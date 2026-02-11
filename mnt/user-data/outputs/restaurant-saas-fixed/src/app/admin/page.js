'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function AdminPanel() {
  const [stats] = useState({
    ordersToday: 47,
    revenueToday: 23450,
    activeTables: '8/12'
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍕</span>
          <h1 className="text-2xl font-bold">Restaurant Admin</h1>
        </div>
        <Link 
          href="/"
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Back
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Total Orders Today" 
            value={stats.ordersToday} 
            icon="📊" 
            color="blue" 
          />
          <StatCard 
            title="Revenue Today" 
            value={`₹${stats.revenueToday.toLocaleString()}`} 
            icon="💰" 
            color="green" 
          />
          <StatCard 
            title="Active Tables" 
            value={stats.activeTables} 
            icon="🪑" 
            color="purple" 
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <ActionButton 
                label="📱 Generate QR Codes" 
                color="purple" 
              />
              <ActionButton 
                label="🍕 Add Menu Item" 
                color="blue" 
              />
              <ActionButton 
                label="📈 View Sales Report" 
                color="green" 
              />
              <ActionButton 
                label="🏪 Manage Outlets" 
                color="orange" 
              />
            </div>
          </div>

          {/* Menu Categories */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Menu Categories</h2>
            <div className="space-y-2">
              {[
                { name: 'Pizza', count: 12 },
                { name: 'Starters', count: 8 },
                { name: 'Main Course', count: 15 },
                { name: 'Desserts', count: 6 },
                { name: 'Beverages', count: 10 }
              ].map(cat => (
                <div key={cat.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-gray-600 text-sm">{cat.count} items</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Table</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">ORD-{20250211 + i}</td>
                    <td className="px-4 py-3 text-sm">Table {i}</td>
                    <td className="px-4 py-3 text-sm">{2 + i} items</td>
                    <td className="px-4 py-3 text-sm font-semibold">₹{(Math.random() * 1000 + 300).toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className={`inline-block p-3 rounded-lg ${colors[color]} mb-3`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

function ActionButton({ label, color }) {
  const colors = {
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  }
  
  return (
    <button className={`w-full px-4 py-3 ${colors[color]} text-white rounded-lg font-medium transition`}>
      {label}
    </button>
  )
}
