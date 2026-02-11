import { useState, useEffect } from 'react'
import { supabase, getDailySales, getInventoryAlerts } from '@/lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Download, AlertTriangle, TrendingUp, DollarSign, Package } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminDashboard() {
  const [view, setView] = useState('overview') // overview, menu, tables, inventory, analytics
  const [tenantId, setTenantId] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [tables, setTables] = useState([])
  const [inventory, setInventory] = useState([])
  const [salesData, setSalesData] = useState([])
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    lowStockItems: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('domain', 'demo.restaurant-saas.com')
        .single()
      
      setTenantId(tenant.id)

      // Load menu
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('tenant_id', tenant.id)
      setMenuItems(menuData || [])

      // Load tables
      const { data: tablesData } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('tenant_id', tenant.id)
      setTables(tablesData || [])

      // Load inventory
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('*')
        .eq('tenant_id', tenant.id)
      setInventory(inventoryData || [])

      // Load sales data
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const sales = await getDailySales(tenant.id, startDate, endDate)
      setSalesData(sales || [])

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const todayData = sales.find(s => s.sale_date === today) || {}
      const lowStock = await getInventoryAlerts(tenant.id)
      
      setStats({
        todayRevenue: todayData.revenue || 0,
        todayOrders: todayData.total_orders || 0,
        avgOrderValue: todayData.avg_order_value || 0,
        lowStockItems: lowStock.length
      })

    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    }
  }

  const generateTableQR = async () => {
    try {
      const tableNumber = prompt('Enter table number:')
      if (!tableNumber) return

      const qrToken = Math.random().toString(36).substring(2, 15)
      
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert([{
          tenant_id: tenantId,
          table_number: tableNumber,
          qr_token: qrToken
        }])
        .select()
        .single()

      if (error) throw error

      toast.success('Table QR created!')
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to create table')
    }
  }

  const addMenuItem = async () => {
    const name = prompt('Item name:')
    const price = prompt('Price:')
    const category = prompt('Category (Starters/Mains/Desserts/Beverages):')
    
    if (!name || !price || !category) return

    try {
      await supabase.from('menu_items').insert([{
        tenant_id: tenantId,
        name,
        price: parseFloat(price),
        category,
        available: true
      }])

      toast.success('Menu item added!')
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to add item')
    }
  }

  const downloadQR = (tableId, tableNumber) => {
    const canvas = document.getElementById(`qr-${tableId}`)
    const pngUrl = canvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = `table-${tableNumber}-qr.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-purple-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm opacity-90">Restaurant Management</p>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm p-2 sticky top-0 z-10">
        <div className="flex gap-2 overflow-x-auto">
          {['overview', 'menu', 'tables', 'inventory', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                view === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Overview */}
        {view === 'overview' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <p className="text-2xl font-bold">₹{stats.todayRevenue}</p>
                <p className="text-sm text-gray-600">Today's Revenue</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <p className="text-2xl font-bold">{stats.todayOrders}</p>
                <p className="text-sm text-gray-600">Today's Orders</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="text-purple-600" size={24} />
                </div>
                <p className="text-2xl font-bold">₹{Math.round(stats.avgOrderValue)}</p>
                <p className="text-sm text-gray-600">Avg Order Value</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <p className="text-2xl font-bold">{stats.lowStockItems}</p>
                <p className="text-sm text-gray-600">Low Stock Alerts</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={addMenuItem}
                  className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  + Add Menu Item
                </button>
                <button
                  onClick={generateTableQR}
                  className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  + Generate QR Code
                </button>
                <button
                  onClick={() => setView('inventory')}
                  className="bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition"
                >
                  Manage Inventory
                </button>
                <button
                  onClick={() => setView('analytics')}
                  className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                >
                  View Reports
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Management */}
        {view === 'menu' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Menu Items</h2>
              <button
                onClick={addMenuItem}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus size={20} />
                Add Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{item.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-purple-600">₹{item.price}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables & QR Codes */}
        {view === 'tables' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Table QR Codes</h2>
              <button
                onClick={generateTableQR}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus size={20} />
                Add Table
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map(table => (
                <div key={table.id} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <h3 className="font-bold text-lg mb-2">Table {table.table_number}</h3>
                  <div className="bg-white p-2 inline-block rounded">
                    <QRCodeSVG
                      id={`qr-${table.id}`}
                      value={`${window.location.origin}/?table=${table.qr_token}`}
                      size={150}
                      level="H"
                    />
                  </div>
                  <button
                    onClick={() => downloadQR(table.id, table.table_number)}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download QR
                  </button>
                  <span className={`inline-block mt-2 text-xs px-3 py-1 rounded ${
                    table.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {table.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory */}
        {view === 'inventory' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Inventory Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map(item => {
                const isLow = item.quantity <= item.min_threshold
                return (
                  <div key={item.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
                    isLow ? 'border-red-500' : 'border-green-500'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">{item.item_name}</h3>
                      {isLow && <AlertTriangle className="text-red-500" size={20} />}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-gray-600">Current: </span>
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Minimum: </span>
                        <span>{item.min_threshold} {item.unit}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Analytics */}
        {view === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Sales Analytics</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold mb-4">Last 7 Days Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sale_date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#9333ea" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
