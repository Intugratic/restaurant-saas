'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function KitchenDisplay() {
  const [kots] = useState([
    { 
      id: 'KOT-001', 
      time: '10:30 AM',
      items: [
        { name: 'Margherita Pizza', qty: 2, prepTime: 15 },
        { name: 'Garlic Bread', qty: 1, prepTime: 10 }
      ],
      status: 'new'
    },
    {
      id: 'KOT-002',
      time: '10:35 AM',
      items: [
        { name: 'Paneer Tikka', qty: 1, prepTime: 12 },
        { name: 'Chicken Biryani', qty: 2, prepTime: 20 }
      ],
      status: 'in_progress'
    },
    {
      id: 'KOT-003',
      time: '10:40 AM',
      items: [
        { name: 'Masala Dosa', qty: 3, prepTime: 10 }
      ],
      status: 'ready'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">👨‍🍳 Kitchen Display System</h1>
        <Link 
          href="/"
          className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          ← Back
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {kots.map(kot => (
            <KOTCard key={kot.id} kot={kot} />
          ))}
        </div>
      </div>
    </div>
  )
}

function KOTCard({ kot }) {
  const statusConfig = {
    new: { bg: 'bg-red-600', label: 'NEW' },
    in_progress: { bg: 'bg-orange-600', label: 'IN PROGRESS' },
    ready: { bg: 'bg-green-600', label: 'READY' }
  }

  const config = statusConfig[kot.status]

  return (
    <div className={`${config.bg} rounded-xl p-6`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-bold text-2xl">{kot.id}</p>
          <p className="text-sm opacity-90">{kot.time}</p>
        </div>
        <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
          {config.label}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {kot.items.map((item, idx) => (
          <div key={idx} className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="font-bold text-lg">{item.qty}x {item.name}</p>
            <p className="text-sm opacity-75">⏱ {item.prepTime} mins</p>
          </div>
        ))}
      </div>

      {kot.status !== 'ready' && (
        <button className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 font-bold">
          Mark Ready ✓
        </button>
      )}
    </div>
  )
}
