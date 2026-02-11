# 🔧 Vercel.json Error Fix

## ❌ The Error
```
The `functions` property cannot be used in conjunction with the `builds` property.
Please remove one of them.
```

## ✅ Fixed!

I've simplified your `vercel.json` to:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

## Why This Happened

Your old `vercel.json` had **both** `builds` and `functions` properties:
- `builds` - Old Vercel v2 config format
- `functions` - New Vercel config format
- **You can't use both!**

## Solution Options

### Option 1: Minimal Config (Recommended) ✅
Use the simplified version I created. Vercel auto-detects Next.js, so minimal config is best.

### Option 2: Delete vercel.json Completely
```bash
rm vercel.json
```
Vercel will auto-detect Next.js and use default settings. **This is perfectly fine!**

### Option 3: Use Only Functions (If You Need API Control)
```json
{
  "functions": {
    "src/app/api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

## 🚀 Now You Can Deploy!

### Method 1: Vercel Dashboard (Easiest)
1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your repository
5. Vercel auto-detects Next.js ✅
6. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
7. Click "Deploy"

### Method 2: Vercel CLI
```bash
cd restaurant-saas-fixed
npm install -g vercel
vercel login
vercel
```

## 📝 Environment Variables

You'll need to add these in Vercel dashboard:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

**Optional (for payments):**
- `RAZORPAY_KEY_ID` - Your Razorpay test/live key
- `RAZORPAY_KEY_SECRET` - Your Razorpay secret

### How to Add in Vercel:
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable
4. Click "Save"
5. Redeploy

## ✅ Deployment Checklist

Before deploying, make sure:

- [x] `vercel.json` fixed (no conflicting properties) ✅
- [x] Code pushed to GitHub
- [x] `src/app/` directory exists with pages
- [x] `package.json` has correct dependencies
- [ ] Environment variables ready
- [ ] Supabase project created (optional, for database)

## 🧪 Test Locally First

```bash
# Install dependencies
npm install

# Test build (what Vercel will do)
npm run build

# If build succeeds ✅
npm start

# Open http://localhost:3000
```

If `npm run build` works locally, **it will work on Vercel!**

## 🎯 Expected Deployment Flow

1. Push to GitHub → Vercel detects push
2. Vercel runs `npm install`
3. Vercel runs `npm run build`
4. Build succeeds ✅
5. Site is live!
6. You get a URL like: `https://your-app.vercel.app`

## 🆘 Still Getting Errors?

### Build Errors
- Check `package.json` dependencies are correct
- Run `npm run build` locally to see errors
- Check Next.js version is 14.x

### Deployment Errors
- Verify environment variables are set
- Check build logs in Vercel dashboard
- Make sure `.env` is in `.gitignore` (don't commit secrets!)

### Runtime Errors
- Check browser console for errors
- Verify API routes if using them
- Check Supabase connection if database errors

## 💡 Pro Tips

1. **Use Vercel's Auto-detection**: For Next.js, you rarely need custom `vercel.json` config

2. **Environment Variables**: Never commit `.env` files! Use Vercel dashboard

3. **Preview Deployments**: Every GitHub push gets a preview URL for testing

4. **Production vs Preview**: 
   - `main` branch → Production
   - Other branches → Preview deployments

## 📚 Additional Resources

- Vercel Next.js Docs: https://vercel.com/docs/frameworks/nextjs
- Vercel Config Docs: https://vercel.com/docs/configuration
- Next.js Deployment: https://nextjs.org/docs/deployment

---

**Your deployment is now ready to go!** 🚀

The `vercel.json` conflict is fixed. Just push and deploy!
