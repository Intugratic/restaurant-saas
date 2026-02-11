import { useState, useEffect } from 'react'
import { supabase, subscribeToOrders, updateOrderStatus } from '@/lib/supabase'
import { CheckCircle, Clock, Bell, Printer } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function WaiterApp() {
  const [orders, setOrders] = useState([])
  const [tenantId, setTenantId] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, confirmed, ready

  useEffect(() => {
    // Get tenant from user profile or demo
    loadOrders()
    setupRealtimeSubscription()
  }, [])

  const loadOrders = async () => {
    try {
      // For demo, using demo tenant
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
            menu_items(name, price)
          )
        `)
        .eq('tenant_id', tenant.id)
        .neq('status', 'paid')
        .order('created_at', { ascending: false })

      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    }
  }

  const setupRealtimeSubscription = async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('domain', 'demo.restaurant-saas.com')
      .single()

    const subscription = subscribeToOrders(tenant.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        toast.success(`New order from Table ${payload.new.table_number}!`, {
          icon: '🔔',
          duration: 5000
        })
        loadOrders()
      } else if (payload.eventType === 'UPDATE') {
        loadOrders()
      }
    })

    return () => subscription.unsubscribe()
  }

  const confirmOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'confirmed')
      toast.success('Order confirmed! KOT sent to kitchen.')
      
      // Trigger KOT print
      await fetch('/api/kot-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
    } catch (error) {
      toast.error('Failed to confirm order')
    }
  }

  const markAsServed = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'served')
      toast.success('Order marked as served!')
    } catch (error) {
      toast.error('Failed to update order')
    }
  }

  const generateBill = async (orderId) => {
    try {
      // Navigate to bill page
      window.open(`/bill?order=${orderId}`, '_blank')
    } catch (error) {
      toast.error('Failed to generate bill')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      preparing: 'bg-orange-100 text-orange-800 border-orange-300',
      ready: 'bg-green-100 text-green-800 border-green-300',
      served: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return colors[status] || 'bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <h1 className="text-2xl font-bold">Waiter Dashboard</h1>
        <p className="text-sm opacity-90">Manage Orders & Service</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white shadow-sm p-2 sticky top-16 z-10">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pending', 'confirmed', 'ready'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {orders.filter(o => o.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock size={48} className="mx-auto mb-3 opacity-50" />
            <p>No {filter !== 'all' ? filter : ''} orders</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4">
              {/* Order Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">
                    Table {order.restaurant_tables?.table_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.customer_name} • {order.customer_phone}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              {/* Order Items */}
              <div className="border-t border-b py-3 my-3 space-y-2">
                {order.order_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.menu_items?.name}
                    </span>
                    <span className="font-semibold">
                      ₹{item.quantity * item.price}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-blue-600">
                  ₹{order.total_amount}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => confirmOrder(order.id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Confirm Order
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    onClick={() => markAsServed(order.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Mark Served
                  </button>
                )}

                {order.status === 'served' && (
                  <button
                    onClick={() => generateBill(order.id)}
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2"
                  >
                    <Printer size={18} />
                    Generate Bill
                  </button>
                )}

                {order.status === 'confirmed' && (
                  <button
                    disabled
                    className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Clock size={18} className="animate-pulse" />
                    Kitchen Preparing...
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {orders.filter(o => o.status === 'preparing').length}
            </p>
            <p className="text-xs text-gray-600">Preparing</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'ready').length}
            </p>
            <p className="text-xs text-gray-600">Ready</p>
          </div>
        </div>
      </div>
    </div>
  )
}
