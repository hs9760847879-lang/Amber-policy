import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MODELS = [
  { name: 'gemini-2.0-flash-lite', key: process.env.GEMINI_3_1_FLASH_LITE_API_KEY },
  { name: 'gemini-3.0-flash', key: process.env.GEMINI_3_FLASH_API_KEY },
  { name: 'gemini-2.5-flash', key: process.env.GEMINI_2_5_FLASH_API_KEY },
  { name: 'gemini-2.5-flash-lite', key: process.env.GEMINI_2_5_FLASH_LITE_API_KEY },
]

const OPTIMIZATION_GUIDELINES = `
You are a policy optimization expert for Amber (a student accommodation provider). Your task is to extract and optimize property policies from the given content following these strict guidelines:

## Terminology Compliance:
Always use the exact terms as mentioned on the property's website, as each word can have legal implications. However, ensure that the liability does not shift to Amber. For example, replace terms like "we will refund" or "we will cancel" with "the property will refund" or "they will cancel."

## How to Frame Payment Policies:

1. Booking Deposit:
A booking deposit includes any fee or advance rental amount due at the time of booking.
Policy Content:
- If fee-related: "You must pay [currency and amount] as [fee name], [currency and amount] as [fee name], etc., at the time of booking or during the booking process."
- If advance rent-related: "1. You must pay [currency and amount] as an advance rent payment or pre-payment at the time of booking. 2. This will be adjusted in the rental payment."
Considerations:
- If fee amounts differ across sections of the website, seek clarification from the KAM agent. For partnered properties, KAM can provide accurate details. For non-partnered properties, include a generic statement.
- Mention any amount paid during booking at the tenancy level.
- Identify the nature of deposits (e.g., refundable or adjustable in rent) and use terms accordingly, such as holding deposit or holding fee.

2. Security Deposit:
This refers to the damage deposit or bond required to secure a room.
Policy Content:
"You must pay [currency and amount] as a security deposit or bond to secure your room with the property."
Considerations:
- Do not include refund conditions unless explicitly mentioned on the property's website.

3. Payment Installment Plan:
This section covers details about rental payment schedules.
Policy Content:
"Rent must be paid [monthly/weekly/termly] in advance."
Considerations:
- Include only details provided on the property's website.
- If no information is available, consult the KAM agent for partnered properties. Create this section for non-partnered properties.

4. Guarantor Requirement:
This outlines whether a guarantor is required.
Policy Content:
"The property accepts (only/both) [guarantor type]."
Considerations:
- Update this information in the top tag of the inventory dashboard.
- If unavailable on the website, consult the KAM agent.

5. Additional Fees:
Include any additional fees payable during the booking process.
Policy Content:
"[Fee Name] - [Currency & Amount]
[Fee Name] - [Currency & Amount]..."
Considerations:
- Gather comprehensive details regarding additional fees.
- Use generic statements if fees vary by tenancy duration or room type, such as "You must pay a certain amount as [fee type]."

## How to Frame Cancellation Policies:

For cancellation policies, refer to the exact terms mentioned on the property's website to ensure accuracy and avoid future disputes.

1. Cooling-Off Period:
This is the period during which a tenant can cancel the booking and receive a full refund. If no cooling-off period is offered, state:
"The property does not offer a cooling-off period. All contracts are legal and binding."

2. No Visa, No Pay:
This policy allows cancellation if a student's visa is denied. Include the T&Cs, as specific timeframes may apply for document submission.

3. No Place, No Pay:
This policy allows cancellation if a student's university place is denied. Include the T&Cs, as specific timeframes may apply for document submission.

4. Replacement Tenant Found:
A tenant can cancel if they find a suitable replacement. Include full T&Cs for this policy.

5. Early Termination:
A tenant may terminate the contract early by providing notice. Include any applicable cancellation fees mentioned by the property.

6. Other Cancellation Policies:
Mention any additional cancellation policies offered by the property under this section.

## Important Formatting Requirements:
Highlight the following important information:
- Days/hours in cooling off policy
- TAT for no visa and no place policy
- Amount in deposit policy section
- Number of instalments in payment instalment plan policy
- Type of guarantor information

## Output Format:
Return a JSON object with the following structure:
{
  "bookingDeposit": "...",
  "securityDeposit": "...",
  "paymentInstallment": "...",
  "guarantor": "...",
  "additionalFees": "...",
  "coolingOff": "...",
  "noVisaNoPay": "...",
  "noPlaceNoPay": "...",
  "replacementTenant": "...",
  "earlyTermination": "...",
  "otherPolicies": "..."
}

Extract and optimize the policies from the following property URL or content:
`

const defaultResult = {
  bookingDeposit: 'You must pay a booking deposit as per the property terms.',
  securityDeposit: 'You must pay a security deposit to secure your room.',
  paymentInstallment: 'Rent must be paid monthly in advance.',
  guarantor: 'The property requires a guarantor. Contact the KAM agent for details.',
  additionalFees: 'Additional fees may apply as per the property terms.',
  coolingOff: 'The property does not offer a cooling-off period. All contracts are legal and binding.',
  noVisaNoPay: 'No Visa, No Pay policy details to be confirmed with the property.',
  noPlaceNoPay: 'No Place, No Pay policy details to be confirmed with the property.',
  replacementTenant: 'Replacement tenant policy to be confirmed with the property.',
  earlyTermination: 'Early termination policy to be confirmed with the property.',
  otherPolicies: 'Other cancellation policies to be confirmed with the property.',
}

async function tryModel(apiKey: string | undefined, modelName: string, prompt: string): Promise<string | null> {
  if (!apiKey) return null
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error(`Error with model ${modelName}:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { propertyUrl } = await request.json()

    if (!propertyUrl) {
      return NextResponse.json(
        { error: 'Property URL is required' },
        { status: 400 }
      )
    }

    const prompt = `${OPTIMIZATION_GUIDELINES}\n\nProperty URL: ${propertyUrl}\n\nPlease extract and optimize the policies based on the content found at this URL. If specific details are not available on the website, provide generic statements based on the guidelines.`

    let response: string | null = null

    for (const model of MODELS) {
      if (model.key) {
        response = await tryModel(model.key, model.name, prompt)
        if (response) break
      }
    }

    if (!response) {
      return NextResponse.json(
        { error: 'No valid API key found. Please configure at least one Gemini API key in .env' },
        { status: 500 }
      )
    }

    let parsedResult
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0])
      } else {
        parsedResult = {
          bookingDeposit: response.includes('booking') ? response : defaultResult.bookingDeposit,
          securityDeposit: response.includes('security') || response.includes('bond') ? response : defaultResult.securityDeposit,
          paymentInstallment: response.includes('monthly') || response.includes('weekly') ? response : defaultResult.paymentInstallment,
          guarantor: response.includes('guarantor') ? response : defaultResult.guarantor,
          additionalFees: response.includes('fee') ? response : defaultResult.additionalFees,
          coolingOff: response.includes('cooling') || response.includes('refund') ? response : defaultResult.coolingOff,
          noVisaNoPay: response.includes('visa') ? response : defaultResult.noVisaNoPay,
          noPlaceNoPay: response.includes('place') || response.includes('university') ? response : defaultResult.noPlaceNoPay,
          replacementTenant: response.includes('replacement') ? response : defaultResult.replacementTenant,
          earlyTermination: response.includes('termination') || response.includes('notice') ? response : defaultResult.earlyTermination,
          otherPolicies: defaultResult.otherPolicies,
        }
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      parsedResult = defaultResult
    }

    return NextResponse.json(parsedResult)
  } catch (error) {
    console.error('Optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize policies' },
      { status: 500 }
    )
  }
}
