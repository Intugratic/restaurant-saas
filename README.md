# 🍽️ Restaurant SaaS Platform - Complete Setup Guide

## 🚀 Quick Deploy (1-Click)

### Prerequisites
- GitHub account
- Vercel account (free)
- Supabase account (free)
- Razorpay account (for payments)

### Deploy in 5 Minutes

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Run SQL from `supabase/schema.sql`
   - Get your project URL and anon key

2. **Deploy to Vercel**
   ```bash
   # Clone this repo first (or create from files below)
   git clone <your-repo>
   cd restaurant-saas
   
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Configure Environment Variables in Vercel**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   FIREBASE_SERVICE_ACCOUNT=your_firebase_json
   ```

## 📁 Project Structure

```
restaurant-saas/
├── README.md                 
├── DATABASE_SCHEMA.md        
├── DEPLOYMENT_GUIDE.md       
├── package.json              
├── next.config.js            
├── vercel.json              
├── .env.example             
│
├── supabase/
│   ├── schema.sql           
│   └── seed.sql             
│
├── public/
│   ├── manifest.json        
│   └── service-worker.js    
│
├── src/
│   ├── app/                 
│   │   ├── layout.js
│   │   ├── page.js          
│   │   ├── api/             
│   │   ├── admin/           
│   │   ├── waiter/          
│   │   ├── kitchen/         
│   │   └── menu/            
│   ├── components/
│   ├── lib/
│   └── styles/
│
└── scripts/
    └── generate-qr.js       
```

## 🎯 Core Features Implemented

✅ QR Code System | ✅ Order Flow | ✅ KOT Auto-generation  
✅ Payments (Razorpay) | ✅ Inventory Tracking | ✅ AI Upsells  
✅ Loyalty Points | ✅ Multi-outlet | ✅ PWA Support  
✅ Real-time Notifications | ✅ White-label SaaS

## 🛠️ Tech Stack

**Frontend:** React 18 + Next.js 13+ + Tailwind CSS  
**Backend:** Next.js API Routes + Supabase  
**Payments:** Razorpay  
**Notifications:** Firebase Cloud Messaging  
**Deploy:** Vercel + Supabase (Free Tiers)

## 🚦 Getting Started Locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

## 🎓 Customization Prompts

- "Add Hindi menu support"
- "Enable table reservations"
- "Add delivery mode with rider assignment"
- "Let tenants customize theme colors"

---

**See `DEPLOYMENT_GUIDE.md` for complete deployment instructions.**
