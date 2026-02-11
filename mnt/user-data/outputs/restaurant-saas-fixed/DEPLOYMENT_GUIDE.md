# 🚀 Complete Deployment Guide - Restaurant SaaS

## Step-by-Step Deployment (15 minutes)

### Phase 1: Database Setup (Supabase)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up with GitHub (free)
   - Create new project:
     - Name: `restaurant-saas`
     - Database password: (save this!)
     - Region: Choose closest to you

2. **Run Database Schema**
   - In Supabase dashboard, go to SQL Editor
   - Copy entire content from `supabase/schema.sql`
   - Click "Run"
   - Wait for ✅ Success message

3. **Get API Credentials**
   - Go to Settings → API
   - Copy:
     - `Project URL` (e.g., https://xxx.supabase.co)
     - `anon/public key`
   - Save these for later!

4. **Enable Realtime (for live order updates)**
   - Go to Database → Publications
   - Click on `supabase_realtime`
   - Enable tables: `orders`, `order_items`, `kot`, `notifications`

### Phase 2: Payment Setup (Razorpay)

1. **Create Razorpay Account**
   - Go to https://razorpay.com
   - Sign up (free test account)
   - Complete KYC for live mode (optional for testing)

2. **Get API Keys**
   - Dashboard → Settings → API Keys
   - Generate Key Pair
   - Copy `Key ID` and `Key Secret`
   - ⚠️ Keep secret key safe!

3. **Setup Webhook**
   - Dashboard → Webhooks
   - Add new webhook:
     - URL: `https://your-app.vercel.app/api/webhooks/razorpay`
     - Events: `payment.captured`, `payment.failed`
     - Secret: (auto-generated, save it!)

### Phase 3: Push Notifications (Firebase) - Optional

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Add project → Name it `restaurant-saas`
   - No Google Analytics needed

2. **Enable Cloud Messaging**
   - Project settings → Cloud Messaging
   - Generate new private key
   - Download JSON file (service account)

3. **Get FCM Server Key**
   - Project settings → Cloud Messaging → Server key
   - Copy this for environment variables

### Phase 4: Deploy to Vercel

#### Option A: GitHub (Recommended)

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/restaurant-saas.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - New Project → Import from GitHub
   - Select `restaurant-saas` repo
   - Framework: Next.js (auto-detected)

3. **Configure Environment Variables**
   In Vercel project settings, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   RAZORPAY_KEY_ID=rzp_test_xxxxxx
   RAZORPAY_KEY_SECRET=your_secret
   RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
   
   FIREBASE_PROJECT_ID=restaurant-saas
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxx.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
   
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... repeat for all env vars

# Deploy to production
vercel --prod
```

### Phase 5: White-Label Setup (Multi-tenant)

1. **Configure Custom Domains in Vercel**
   - Project → Settings → Domains
   - Add domain: `*.yourplatform.com` (wildcard)
   - Or add individual: `pizzapalace.yourplatform.com`

2. **DNS Setup**
   - Add CNAME record:
     - Name: `*` or specific subdomain
     - Value: `cname.vercel-dns.com`

3. **Create First Tenant**
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO tenants (name, subdomain, plan_type)
   VALUES ('Pizza Palace', 'pizzapalace', 'premium');
   ```

### Phase 6: Testing

1. **Test QR Flow**
   - Go to `/admin`
   - Generate QR for Table 1
   - Scan with phone (or click QR data)
   - Place test order

2. **Test Payment**
   - Use Razorpay test cards:
     - Card: `4111 1111 1111 1111`
     - CVV: any 3 digits
     - Expiry: any future date

3. **Test Realtime**
   - Open kitchen display
   - Confirm order from waiter app
   - Watch KOT appear instantly!

### Phase 7: Go Live Checklist

- [ ] All environment variables set
- [ ] Database schema applied
- [ ] Sample data added (optional)
- [ ] QR codes generated for tables
- [ ] Payment gateway tested
- [ ] Mobile PWA tested (install on phone)
- [ ] Realtime notifications working
- [ ] Admin panel accessible
- [ ] Custom domain configured (optional)

### Quick Start Script

```bash
#!/bin/bash
# Automated setup (run after cloning repo)

echo "🚀 Restaurant SaaS Quick Setup"

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
echo "✅ Environment file created - please edit .env.local"

# Start dev server
npm run dev
```

## Troubleshooting

### Issue: Database connection failed
**Solution:** Check Supabase URL and anon key are correct in `.env.local`

### Issue: Payments not working
**Solution:** Verify Razorpay keys. Test mode uses `rzp_test_` prefix.

### Issue: Realtime not updating
**Solution:** Enable realtime in Supabase Publications settings for required tables.

### Issue: QR code not generating
**Solution:** Check browser console. Install `qrcode.react` if missing: `npm install qrcode.react`

### Issue: Deployment failed on Vercel
**Solution:** Check Next.js version compatibility. Ensure `next.config.js` exists.

## Performance Optimization

1. **Enable Vercel Edge Functions**
   - API routes run closer to users
   - Lower latency for orders

2. **Add Database Indexes**
   - Already included in schema
   - Monitor slow queries in Supabase

3. **CDN for Images**
   - Upload menu images to Vercel blob storage
   - Or use Supabase storage

4. **PWA Caching**
   - Service worker caches menu data
   - Works offline for menu viewing

## Security Checklist

- [x] Row Level Security (RLS) enabled on all tables
- [x] API routes protected with tenant checks
- [x] Razorpay webhook signature verification
- [x] HTTPS only (enforced by Vercel)
- [x] Environment variables not exposed to client
- [x] Input validation on all forms

## Scaling

### Free Tier Limits
- **Vercel:** 100GB bandwidth, unlimited deployments
- **Supabase:** 500MB database, 2GB bandwidth
- **Razorpay:** Unlimited test transactions

### When to Upgrade
- Database > 500MB → Supabase Pro ($25/mo)
- Bandwidth > 100GB → Vercel Pro ($20/mo)
- Go live payments → Razorpay (2-3% fee)

### Multi-Region Setup
1. Deploy to multiple Vercel regions
2. Use Supabase read replicas
3. Add Cloudflare for global CDN

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Razorpay Docs:** https://razorpay.com/docs
- **Next.js Docs:** https://nextjs.org/docs

## Next Steps After Deployment

1. **Add Analytics**
   - Vercel Analytics (built-in)
   - PostHog for user tracking

2. **Add Monitoring**
   - Sentry for error tracking
   - Vercel monitoring for uptime

3. **Marketing**
   - Create landing page
   - Add restaurant signup form
   - SEO optimization

---

**Congratulations!** 🎉 Your Restaurant SaaS is now live!

Access your app at: `https://your-app.vercel.app`
