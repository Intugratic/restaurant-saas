import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, getMenuItems, getTableByToken, createOrder, createOrderItems } from '../lib/supabase'
import { ShoppingCart, Plus, Minus, Clock, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function CustomerMenu() {
  const router = useRouter()
  const { table } = router.query // table QR token from URL
  
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [tableData, setTableData] = useState(null)
  const [orderStatus, setOrderStatus] = useState(null)
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (table) {
      loadTableAndMenu()
    }
  }, [table])

  const loadTableAndMenu = async () => {
    try {
      const tableInfo = await getTableByToken(table)
      setTableData(tableInfo)
      
      const items = await getMenuItems(tableInfo.tenant_id)
      setMenuItems(items)
      setLoading(false)
    } catch (error) {
      toast.error('Invalid QR code')
      setLoading(false)
    }
  }

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id)
    if (existing) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
    toast.success(`Added ${item.name}`)
  }

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(i => {
      if (i.id === itemId) {
        const newQty = i.quantity + delta
        return newQty > 0 ? { ...i, quantity: newQty } : null
      }
      return i
    }).filter(Boolean))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const placeOrder = async () => {
    if (!customerInfo.phone) {
      toast.error('Please enter your phone number')
      return
    }

    try {
      const total = calculateTotal()
      
      // Create order
      const order = await createOrder({
        tenant_id: tableData.tenant_id,
        table_id: tableData.id,
        customer_phone: customerInfo.phone,
        customer_name: customerInfo.name || 'Guest',
        total_amount: total,
        status: 'pending'
      })

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
      
      await createOrderItems(orderItems)

      setOrderStatus('pending')
      setCart([])
      toast.success('Order placed! Waiter will confirm soon.')
      
      // Track order status
      trackOrderStatus(order.id)
    } catch (error) {
      toast.error('Failed to place order')
      console.error(error)
    }
  }

  const trackOrderStatus = (orderId) => {
    const subscription = supabase
      .channel('order_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrderStatus(payload.new.status)
          
          const statusMessages = {
            confirmed: 'Order confirmed by waiter!',
            preparing: 'Your food is being prepared 👨‍🍳',
            ready: 'Your order is ready! 🍽️',
            served: 'Enjoy your meal! ❤️'
          }
          
          if (statusMessages[payload.new.status]) {
            toast.success(statusMessages[payload.new.status])
          }
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const category = item.category || 'Other'
      if (!acc[category]) acc[category] = []
      acc[category].push(item)
      return acc
    }, {})
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!tableData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid QR Code</h1>
          <p className="text-gray-600">Please scan a valid table QR code</p>
        </div>
      </div>
    )
  }

  const categorizedMenu = groupByCategory(menuItems)

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-orange-500 text-white p-4 sticky top-0 z-10 shadow-lg">
        <h1 className="text-2xl font-bold">Menu</h1>
        <p className="text-sm opacity-90">Table {tableData.table_number}</p>
      </div>

      {/* Order Status Tracker */}
      {orderStatus && (
        <div className="bg-white p-4 m-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            {orderStatus === 'served' ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <Clock className="text-orange-500 animate-pulse" size={24} />
            )}
            <div>
              <p className="font-semibold">Order Status</p>
              <p className="text-sm text-gray-600 capitalize">{orderStatus.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="p-4 space-y-6">
        {Object.entries(categorizedMenu).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xl font-bold mb-3 text-gray-800">{category}</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    <p className="text-lg font-bold text-orange-500 mt-1">₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition h-fit"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary (Fixed Bottom) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t p-4">
          <div className="max-w-2xl mx-auto">
            {/* Cart Items */}
            <div className="max-h-40 overflow-y-auto mb-3 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="bg-gray-200 rounded p-1 hover:bg-gray-300"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="bg-gray-200 rounded p-1 hover:bg-gray-300"
                    >
                      <Plus size={16} />
                    </button>
                    <span className="ml-2 font-semibold">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="text"
                placeholder="Name (optional)"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Place Order Button */}
            <button
              onClick={placeOrder}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold flex items-center justify-between px-4 hover:bg-orange-600 transition"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart size={20} />
                Place Order ({cart.length} items)
              </span>
              <span>₹{calculateTotal()}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
