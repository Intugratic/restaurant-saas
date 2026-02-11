'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function WaiterApp() {
  const [orders] = useState([
    { id: 'ORD-001', table: '1', items: 3, amount: 599, status: 'pending' },
    { id: 'ORD-002', table: '3', items: 2, amount: 450, status: 'confirmed' },
    { id: 'ORD-003', table: '5', items: 4, amount: 899, status: 'preparing' }
  ])

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🧑‍🍳 Waiter App</h1>
        <Link 
          href="/"
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Back
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending Orders */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              🔔 Pending Orders ({orders.filter(o => o.status === 'pending').length})
            </h2>
            <div className="space-y-4">
              {orders.filter(o => o.status === 'pending').map(order => (
                <OrderCard key={order.id} order={order} isPending />
              ))}
            </div>
          </div>

          {/* Active Orders */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              🔥 Active Orders ({orders.filter(o => o.status !== 'pending').length})
            </h2>
            <div className="space-y-4">
              {orders.filter(o => o.status !== 'pending').map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, isPending }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700'
  }

  return (
    <div className={`rounded-xl p-4 ${isPending ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-white shadow-sm'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold">{order.id}</p>
          <p className="text-sm text-gray-600">Table {order.table}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
          {order.status}
        </span>
      </div>
      <p className="text-sm mb-2">{order.items} items</p>
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">₹{order.amount}</span>
        {isPending && (
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Confirm Order
          </button>
        )}
      </div>
    </div>
  )
}
