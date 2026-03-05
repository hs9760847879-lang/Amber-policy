const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { google } = require('googleapis');
const { GoogleGenerativeAI } = require("@google/generative-ai");

puppeteer.use(StealthPlugin());

// --- 🔑 CONFIGURATION ---
const SPREADSHEET_ID = '13kWfrEhOtHgLCfQGSzrUqo5sdHTV8JoQgEebC42qY2k';
const GEMINI_KEY = 'AIzaSyCS4lOYn559tjdBWJxTfbZQMUnsc89TKgo';
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const FIELDS = [
    "Booking Deposit", "Security Deposit", "Payment Instalment", "Mode of Payment",
    "Guarantor", "Additional Fees", "Cancellation Tag", "Cooling Off",
    "No Visa No Pay", "No Place No Pay", "Course Cancellation", "Early Termination",
    "Delayed Arrival", "Replacement Tenant", "Deferring Studies", "Intake Delayed",
    "No Questions Asked", "Extenuating Circumstances"
];

// --- 🧠 AI EXTRACTION WITH INSTANT FAILOVER (3 -> 2.5 -> 2.5 Lite) ---
async function extractWithFailover(text, url) {
    if (text.includes("Cloudflare") || text.includes("blocked") || text.length < 500) {
        return "ERROR: Blocked by Cloudflare or Empty Page.";
    }

    // Exact 2026 Model IDs
    const models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-flash-lite"];

    const prompt = `
    Extract student housing policies for ${url}. 
    STRICT MAPPING RULES:
    - US Sites: 'Relet' = Early Termination, 'Admin Fee' = Booking Deposit, 'Individual Liability' = Instalment.
    - UK/AU: 'Tenancy Takeover' = Replacement, 'Bond' = Security Deposit.
    
    POINTS TO EXTRACT: ${FIELDS.join(", ")}
    TEXT DATA: ${text.substring(0, 35000)} 
    Return strictly in JSON format.`;

    let lastError = "";

    for (let modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (e) {
            lastError = e.message;
            // If Rate Limit (429) or Overloaded (500), switch model immediately
            if (e.message.includes("429") || e.message.includes("500") || e.message.includes("quota")) {
                console.log(`⚠️ ${modelName} limit hit. Jumping to next model...`);
                continue;
            } else {
                console.log(`❌ ${modelName} error: ${e.message}`);
                continue;
            }
        }
    }
    return `FAILED ALL MODELS. Last Error: ${lastError}`;
}

async function runMasterProject() {
    // 1. Auth and Sheet Setup
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Sheet1!A2:A' });
    const rows = res.data.values || [];

    // 2. Cluster Setup (Optimized for 2026 Stealth)
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 1, // Set to 1 to avoid hitting AI rate limits too fast
        puppeteerOptions: {
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ]
        }
    });

    await cluster.task(async ({ page, data }) => {
        const { url, rowIndex } = data;
        try {
            console.log(`📡 [Row ${rowIndex}] Scraping: ${url}`);

            // A. Identity Cloaking
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // B. Reveal Content (Click Banners)
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button, a, span'));
                const accept = btns.find(b => /accept|agree|allow|close|consent/i.test(b.innerText.toLowerCase()));
                if (accept) accept.click();
            });
            await new Promise(r => setTimeout(r, 2000));

            // C. Recursive Link Search (Policy + Rooms)
            const links = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                return {
                    policy: anchors.find(a => /policy|faq|terms|payment|cancellation/i.test(a.innerText.toLowerCase()))?.href,
                    rooms: anchors.filter(a => /studio|ensuite|room|view|details/i.test(a.innerText.toLowerCase())).map(a => a.href).slice(0, 2)
                };
            });

            let combinedText = "";
            const targets = [url, links.policy, ...links.rooms].filter(Boolean);

            for (const target of targets) {
                try {
                    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await page.evaluate(() => window.scrollBy(0, 1000));
                    combinedText += `\n--- SOURCE: ${target} ---\n` + await page.evaluate(() => document.body.innerText);
                } catch (e) { }
            }

            // D. Extract with 3 -> 2.5 -> 2.5 Lite Failover
            const output = await extractWithFailover(combinedText, url);

            // E. Write to Sheet
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `Sheet1!B${rowIndex}`,
                valueInputOption: 'RAW',
                resource: { values: [[output]] }
            });

            console.log(`✅ [Row ${rowIndex}] Completed.`);
        } catch (err) {
            console.error(`❌ [Row ${rowIndex}] Failed: ${err.message}`);
        }
    });

    // 3. Queue all properties
    rows.forEach((row, i) => {
        if (row[0]) cluster.queue({ url: row[0], rowIndex: i + 2 });
    });

    await cluster.idle();
    await cluster.close();
}

runMasterProject();