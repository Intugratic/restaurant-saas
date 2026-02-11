import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

let messaging = null
if (typeof window !== 'undefined') {
  messaging = getMessaging(app)
}

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      })
      return token
    }
    return null
  } catch (error) {
    console.error('Notification permission error:', error)
    return null
  }
}

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })

// Send notification helper (call from backend)
export const sendPushNotification = async (token, title, body, data = {}) => {
  const response = await fetch('/api/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, title, body, data })
  })
  return response.json()
}

// Notification templates
export const notifications = {
  newOrder: (tableNumber) => ({
    title: '🔔 New Order!',
    body: `Table ${tableNumber} placed an order`,
    data: { type: 'new_order' }
  }),
  orderReady: (orderNumber) => ({
    title: '✅ Order Ready!',
    body: `Order #${orderNumber} is ready to serve`,
    data: { type: 'order_ready' }
  }),
  lowInventory: (item) => ({
    title: '⚠️ Low Inventory',
    body: `${item} is running low`,
    data: { type: 'inventory_alert' }
  })
}
