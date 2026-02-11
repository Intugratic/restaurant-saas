'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">🍽️ Restaurant SaaS</h1>
          <p className="text-xl opacity-90">Complete QR-based Restaurant Management Platform</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <AppCard 
            icon="👨‍💼"
            title="Admin Panel"
            desc="Manage menus, QR codes, reports"
            href="/admin"
          />
          <AppCard 
            icon="📱"
            title="Customer Menu"
            desc="Scan QR & order food"
            href="/menu"
          />
          <AppCard 
            icon="🧑‍🍳"
            title="Waiter App"
            desc="Manage orders & tables"
            href="/waiter"
          />
          <AppCard 
            icon="👨‍🍳"
            title="Kitchen Display"
            desc="View KOT & mark ready"
            href="/kitchen"
          />
        </div>

        <div className="mt-16 max-w-4xl mx-auto bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">✨ Features Included</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'QR Code Generation (per table)',
              'Real-time Order Management',
              'Auto KOT Generation',
              'Razorpay Payment Integration',
              'Inventory Tracking',
              'AI Upsell Suggestions',
              'Loyalty Points System',
              'Multi-outlet Support',
              'Push Notifications',
              'Sales Reports & Analytics',
              'White-label SaaS Ready',
              'PWA Support (Install on phone)'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-green-300">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm opacity-75">
            Built with Next.js + Supabase + Razorpay
          </p>
        </div>
      </div>
    </div>
  )
}

function AppCard({ icon, title, desc, href }) {
  return (
    <Link href={href}>
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 cursor-pointer hover:bg-opacity-20 transition text-center border border-white border-opacity-20">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="opacity-80 text-sm">{desc}</p>
      </div>
    </Link>
  )
}
