import { useState, useEffect } from 'react'
import { supabase, subscribeToOrders, updateOrderStatus } from '@/lib/supabase'
import { ChefHat, Clock, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([])
  const [tenantId, setTenantId] = useState(null)

  useEffect(() => {
    loadKitchenOrders()
    setupRealtimeSubscription()
  }, [])

  const loadKitchenOrders = async () => {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('domain', 'demo.restaurant-saas.com')
        .single()
      
      setTenantId(tenant.id)

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant_tables(table_number),
          order_items(
            *,
            menu_items(name, category)
          )
        `)
        .eq('tenant_id', tenant.id)
        .in('status', ['confirmed', 'preparing'])
        .order('created_at', { ascending: true })

      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load kitchen orders')
    }
  }

  const setupRealtimeSubscription = async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('domain', 'demo.restaurant-saas.com')
      .single()

    const subscription = subscribeToOrders(tenant.id, (payload) => {
      if (payload.new.status === 'confirmed') {
        // New KOT arrived
        toast.success('New KOT received!', {
          icon: '🔔',
          duration: 5000
        })
        // Play sound (optional)
        new Audio('/kitchen-bell.mp3').play().catch(() => {})
      }
      loadKitchenOrders()
    })

    return () => subscription.unsubscribe()
  }

  const startPreparing = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'preparing')
      toast.success('Order marked as preparing')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const markAsReady = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'ready')
      toast.success('Order ready! Waiter notified.')
      
      // Send notification to waiter
      await fetch('/api/notify-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
    } catch (error) {
      toast.error('Failed to mark as ready')
    }
  }

  const getTimeSinceOrder = (createdAt) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt)) / 60000)
    return minutes
  }

  const getTimeColor = (minutes) => {
    if (minutes < 10) return 'text-green-600'
    if (minutes < 20) return 'text-orange-600'
    return 'text-red-600'
  }

  // Group items by category for better kitchen workflow
  const groupItemsByCategory = (orderItems) => {
    return orderItems.reduce((acc, item) => {
      const category = item.menu_items?.category || 'Other'
      if (!acc[category]) acc[category] = []
      acc[category].push(item)
      return acc
    }, {})
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-red-600 p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat size={32} />
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-sm opacity-90">Active Orders: {orders.length}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{new Date().toLocaleTimeString()}</p>
            <p className="text-sm opacity-90">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <ChefHat size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl text-gray-500">No active orders</p>
            <p className="text-sm text-gray-600">New KOTs will appear here</p>
          </div>
        ) : (
          orders.map(order => {
            const minutes = getTimeSinceOrder(order.created_at)
            const itemsByCategory = groupItemsByCategory(order.order_items)

            return (
              <div 
                key={order.id} 
                className={`rounded-lg p-4 border-2 ${
                  order.status === 'confirmed' 
                    ? 'bg-yellow-900/30 border-yellow-500' 
                    : 'bg-orange-900/30 border-orange-500'
                }`}
              >
                {/* KOT Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold">
                      Table {order.restaurant_tables?.table_number}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Order #{order.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getTimeColor(minutes)}`}>
                      {minutes} min
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Items by Category */}
                <div className="space-y-4 mb-4">
                  {Object.entries(itemsByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-lg font-bold text-orange-400 mb-2 uppercase tracking-wide">
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {items.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex justify-between bg-black/30 rounded p-2"
                          >
                            <span className="font-medium">
                              <span className="inline-block w-8 text-center bg-orange-600 rounded mr-2 font-bold">
                                {item.quantity}
                              </span>
                              {item.menu_items?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Instructions */}
                {order.notes && (
                  <div className="bg-red-900/40 border border-red-500 rounded p-2 mb-4">
                    <p className="text-sm font-semibold">⚠️ Note: {order.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => startPreparing(order.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
                    >
                      <Clock size={20} />
                      Start Preparing
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => markAsReady(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Mark Ready
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
