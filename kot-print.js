import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId } = req.body

    // Fetch order details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant_tables(table_number),
        order_items(
          *,
          menu_items(name, category)
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error

    // Generate KOT text for thermal printer
    const kot = generateKOT(order)

    // In production, this would send to actual printer via:
    // - USB/Network printer API
    // - Cloud print service
    // - POS system integration
    
    // For demo, we'll just return the KOT text
    console.log('KOT Generated:', kot)

    res.status(200).json({ 
      success: true, 
      kot,
      message: 'KOT sent to kitchen printer'
    })

  } catch (error) {
    console.error('KOT print error:', error)
    res.status(500).json({ error: 'Failed to print KOT' })
  }
}

function generateKOT(order) {
  const now = new Date().toLocaleString()
  
  let kot = `
========================================
           KITCHEN ORDER TICKET
========================================
Order #: ${order.id.slice(0, 8).toUpperCase()}
Table: ${order.restaurant_tables.table_number}
Time: ${now}
----------------------------------------

`

  // Group by category
  const itemsByCategory = order.order_items.reduce((acc, item) => {
    const cat = item.menu_items.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  Object.entries(itemsByCategory).forEach(([category, items]) => {
    kot += `** ${category.toUpperCase()} **\n`
    items.forEach(item => {
      kot += `  ${item.quantity}x ${item.menu_items.name}\n`
      if (item.special_instructions) {
        kot += `     Note: ${item.special_instructions}\n`
      }
    })
    kot += '\n'
  })

  if (order.notes) {
    kot += `----------------------------------------\n`
    kot += `SPECIAL INSTRUCTIONS:\n${order.notes}\n`
  }

  kot += `========================================\n`

  return kot
}
