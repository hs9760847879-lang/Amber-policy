'use client'

import { useState, useEffect } from 'react'

interface Property {
  id: string
  name: string
  location: string
  image: string
  status: 'protected' | 'review' | 'pending'
  premium: string
  renewal: string
}

interface OptimizationResult {
  bookingDeposit: string
  securityDeposit: string
  paymentInstallment: string
  guarantor: string
  additionalFees: string
  coolingOff: string
  noVisaNoPay: string
  noPlaceNoPay: string
  replacementTenant: string
  earlyTermination: string
  otherPolicies: string
}

const initialProperties: Property[] = [
  {
    id: '1',
    name: 'Sunset Villa Estates',
    location: 'Malibu, CA',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3C8b6qCCsdju_FRIY3Oj7t4qeaKL3ybP4mrK9E0F3ZAZ5NKYgJdWiDJv6FfmFlfZpbb8FVT45fbOp797rGZxSPJMzzCWsPWC_I94KiM9mwpAXlSJP6mgOV2aplp0R11rtcACQirEgNVi6EnGHq1IgMKqXXMFeOXRXHUzUx740CBVbLNdukVulvo8wWG8voV-J79OG9GVc1yXpPyNJMCyCD9sBYM0gXeSmzkWid_lU6i5CJVKfv08FclLqX8rPsMrRm7Ypnty5xS9f',
    status: 'protected',
    premium: '$2,450/mo',
    renewal: 'Oct 12, 2024',
  },
  {
    id: '2',
    name: 'Tech Plaza Office',
    location: 'Austin, TX',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsb4MyNmNbsA7C4vmVE6vGvX5nCdggr-1VH5GmJicTf2D4KtlVhsSObIqF8Z8pvfJpPWXBB2udmOv2Ij1cMDIMYaRJfY2fWpElHdUQ60UVyNQsQK6QdNNUhUi_Jh5cey1wJKwp1H8EbjodN2GSXYPTtTFZCHx09vY_DYo3J2GEX_OycPtNzI-ANkTL-oRA5FJuy0hb9eD4MojwCNLfZg_zizs2w2JwO0E1eHoDk5yivqYnmqn7L05n-QOpxaCHf0Q3ert37zYZ9hFo',
    status: 'review',
    premium: '$8,100/mo',
    renewal: 'Nov 05, 2024',
  },
]

export default function Dashboard() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [propertyUrl, setPropertyUrl] = useState('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [properties, setProperties] = useState<Property[]>(initialProperties)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    let effectiveTheme = theme

    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const root = document.documentElement
        if (mediaQuery.matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  const handleSearch = () => {
    console.log('Searching for:', propertyUrl)
  }

  const handleOptimize = async () => {
    if (!propertyUrl) {
      alert('Please enter a property URL first')
      return
    }

    setIsOptimizing(true)
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyUrl }),
      })

      const data = await response.json()
      setOptimizationResult(data)
      setShowResultModal(true)
    } catch (error) {
      console.error('Optimization error:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const highlightText = (text: string, keywords: string[]): JSX.Element => {
    if (!text) return <></>
    
    const parts = text.split(new RegExp(`(${keywords.join('|')})`, 'gi'))
    
    return (
      <>
        {parts.map((part, index) => {
          const isKeyword = keywords.some(k => part.toLowerCase().includes(k.toLowerCase()))
          if (isKeyword) {
            return <span key={index} className="highlight">{part}</span>
          }
          return part
        })}
      </>
    )
  }

  const getStatusBadge = (status: Property['status']) => {
    const badges = {
      protected: 'bg-green-500/20 text-green-500',
      review: 'bg-primary/20 text-primary',
      pending: 'bg-gray-500/20 text-gray-500',
    }
    return badges[status]
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 bg-white dark:bg-slate-custom sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 dark:bg-slate-border p-1 rounded-lg">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-border shadow-sm'
                    : 'hover:bg-white dark:hover:bg-slate-border'
                } ${theme === 'light' ? 'text-primary' : 'text-gray-500'}`}
              >
                <span className="material-symbols-outlined text-[20px]">light_mode</span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-slate-border shadow-sm'
                    : 'hover:bg-white dark:hover:bg-slate-border'
                } ${theme === 'dark' ? 'text-primary' : 'text-gray-500'}`}
              >
                <span class="material-symbols-outlined text-[20px]">dark_mode</span>
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-border shadow-sm'
                    : 'hover:bg-white dark:hover:bg-slate-border'
                } ${theme === 'system' ? 'text-primary' : 'text-gray-500'}`}
              >
                <span class="material-symbols-outlined text-[20px]">settings_brightness</span>
              </button>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-border text-gray-500">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </header>

        <section className="p-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-custom">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-primary/80 mb-2 px-1">
                  Property Link
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    link
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100"
                    placeholder="Enter property URL"
                    type="text"
                    value={propertyUrl}
                    onChange={(e) => setPropertyUrl(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-primary text-gray-900 font-bold rounded-lg flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all h-[50px]"
              >
                <span className="material-symbols-outlined">search</span>
                Search
              </button>
            </div>
          </div>
        </section>

        <section className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold">Policy Overview</h3>
                <p className="text-gray-500 dark:text-gray-400">Manage and optimize your active property coverage</p>
              </div>
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg transition-all hover:bg-gray-800 active:scale-95 group shadow-sm disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[20px] text-primary ${isOptimizing ? 'animate-spin' : ''}`}>
                  {isOptimizing ? 'sync' : 'auto_awesome'}
                </span>
                <span>{isOptimizing ? 'Optimizing...' : 'Optimize with AI'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-custom shadow-sm hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    analytics
                  </span>
                  <span className="text-xs font-bold text-green-500">+12%</span>
                </div>
                <p className="text-xs text-gray-400 uppercase font-medium">Total Assets</p>
                <h4 className="text-2xl font-bold mt-1 text-primary">$4,280,000</h4>
              </div>

              <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-custom shadow-sm hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined p-2 rounded-lg bg-primary/10 text-primary">
                    gavel
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">Active</span>
                </div>
                <p className="text-xs text-gray-400 uppercase font-medium">Active Policies</p>
                <h4 className="text-2xl font-bold mt-1 text-primary">{properties.length}</h4>
              </div>

              <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-custom shadow-sm hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    monitoring
                  </span>
                  <span className="text-xs font-bold text-primary uppercase">Optimization</span>
                </div>
                <p className="text-xs text-gray-400 uppercase font-medium">Risk Score</p>
                <h4 className="text-2xl font-bold mt-1 text-primary">94/100</h4>
              </div>
            </div>

            <div className="mt-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-custom shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h4 className="font-bold">Recent Properties</h4>
                <button className="text-primary text-sm font-bold hover:underline">View All</button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-background-dark text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Premium</th>
                    <th className="px-6 py-4">Next Renewal</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50 dark:hover:bg-background-dark transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            <img
                              className="object-cover size-full"
                              alt={property.name}
                              src={property.image}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{property.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{property.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(property.status)}`}>
                          {property.status === 'protected' ? 'Protected' : property.status === 'review' ? 'Review Required' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{property.premium}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{property.renewal}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="material-symbols-outlined text-gray-400 hover:text-primary">more_vert</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {showResultModal && optimizationResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-custom rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                AI Optimization Result
              </h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-border rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">Payment Policies</h4>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Booking Deposit</h5>
                    <p className="text-sm">{highlightText(optimizationResult.bookingDeposit, ['£', '$', 'advance', 'deposit', 'payment'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Security Deposit</h5>
                    <p className="text-sm">{highlightText(optimizationResult.securityDeposit, ['£', '$', 'bond', 'deposit', 'security'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Payment Installment Plan</h5>
                    <p className="text-sm">{highlightText(optimizationResult.paymentInstallment, ['monthly', 'weekly', 'termly', 'advance', 'instal', 'installment'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Guarantor Requirement</h5>
                    <p className="text-sm">{highlightText(optimizationResult.guarantor, ['guarantor', 'parent', 'uk', 'international'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Additional Fees</h5>
                    <p className="text-sm">{highlightText(optimizationResult.additionalFees, ['£', '$', 'fee', 'admin', 'booking'])}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">Cancellation Policies</h4>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Cooling-Off Period</h5>
                    <p className="text-sm">{highlightText(optimizationResult.coolingOff, ['days', 'hours', 'refund', 'cooling', 'period'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">No Visa, No Pay</h5>
                    <p className="text-sm">{highlightText(optimizationResult.noVisaNoPay, ['visa', 'document', 'days', 'refund'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">No Place, No Pay</h5>
                    <p className="text-sm">{highlightText(optimizationResult.noPlaceNoPay, ['university', 'place', 'offer', 'days', 'refund'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Replacement Tenant Found</h5>
                    <p className="text-sm">{highlightText(optimizationResult.replacementTenant, ['replacement', 'tenant', 'find', 'suitable'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Early Termination</h5>
                    <p className="text-sm">{highlightText(optimizationResult.earlyTermination, ['notice', 'termination', 'fee', 'early'])}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Other Policies</h5>
                    <p className="text-sm">{highlightText(optimizationResult.otherPolicies, ['policy', 'cancellation', 'additional'])}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
