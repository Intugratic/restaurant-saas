'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function CustomerMenu() {
  const [cart, setCart] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)

  const menuItems = [
    { id: 1, name: 'Margherita Pizza', price: 299, category: 'Pizza', veg: true, prepTime: 15, emoji: '🍕' },
    { id: 2, name: 'Chicken Biryani', price: 349, category: 'Main Course', veg: false, prepTime: 20, emoji: '🍛' },
    { id: 3, name: 'Paneer Tikka', price: 249, category: 'Starters', veg: true, prepTime: 12, emoji: '🥘' },
    { id: 4, name: 'Gulab Jamun', price: 99, category: 'Desserts', veg: true, prepTime: 5, emoji: '🍮' },
    { id: 5, name: 'Masala Dosa', price: 149, category: 'Breakfast', veg: true, prepTime: 10, emoji: '🥞' },
    { id: 6, name: 'Butter Chicken', price: 399, category: 'Main Course', veg: false, prepTime: 18, emoji: '🍗' }
  ]

  const tables = [
    { id: 'T1', number: '1' },
    { id: 'T2', number: '2' },
    { id: 'T3', number: '3' },
    { id: 'T4', number: '4' }
  ]

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id)
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))
    } else {
      setCart([...cart, {...item, quantity: 1}])
    }
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-2xl font-bold">🍕 Restaurant Menu</h1>
            <Link href="/" className="px-3 py-1 bg-gray-200 rounded-lg text-sm">
              ← Exit
            </Link>
          </div>
          
          {/* Table Selection */}
          {!selectedTable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Select your table:</p>
              <div className="flex gap-2">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className="px-3 py-1 bg-white border rounded-lg hover:bg-purple-50 text-sm"
                  >
                    Table {table.number}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTable && (
            <div className="bg-purple-50 rounded-lg px-3 py-2 text-sm">
              <span className="font-medium">Table {selectedTable.number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="container mx-auto px-4 py-6 pb-32">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  <span className="text-4xl">{item.emoji}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded ${item.veg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.veg ? '🟢 Veg' : '🔴 Non-Veg'}
                  </span>
                  <span className="text-xs text-gray-500">⏱ {item.prepTime} mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-purple-600">₹{item.price}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">{cart.length} items</p>
              <p className="text-2xl font-bold">₹{total}</p>
            </div>
            <button 
              disabled={!selectedTable}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold disabled:bg-gray-300"
            >
              Place Order →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
