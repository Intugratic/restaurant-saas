import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations

export const getTenantByDomain = async (domain) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('domain', domain)
    .single()
  
  if (error) throw error
  return data
}

export const getMenuItems = async (tenantId) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('available', true)
    .order('category')
  
  if (error) throw error
  return data
}

export const createOrder = async (orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createOrderItems = async (items) => {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select()
  
  if (error) throw error
  return data
}

export const updateOrderStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const subscribeToOrders = (tenantId, callback) => {
  return supabase
    .channel('orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`
      },
      callback
    )
    .subscribe()
}

export const getTableByToken = async (token) => {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('qr_token', token)
    .single()
  
  if (error) throw error
  return data
}

export const getDailySales = async (tenantId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('daily_sales')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
    .order('sale_date', { ascending: false })
  
  if (error) throw error
  return data
}

export const getInventoryAlerts = async (tenantId) => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('tenant_id', tenantId)
    .filter('quantity', 'lte', 'min_threshold')
  
  if (error) throw error
  return data
}
