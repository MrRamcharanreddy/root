# 🚀 Complete Deployment Guide

A comprehensive guide for deploying Roots2Global to production, including environment setup, deployment steps, troubleshooting, and verification checklists.

---

## ✅ Pre-Deployment Verification

### Code Quality
- [x] TypeScript: No type errors
- [x] ESLint: No linting errors
- [x] Build: Successful compilation
- [x] Dependencies: All installed correctly
- [x] Console statements: Removed from production code
- [x] Error handling: All API routes have try-catch
- [x] Type safety: No `any` types in critical paths

### Currency Conversion
- [x] API-based conversion implemented
- [x] Exchange rates fetched on app load
- [x] Fallback rates configured
- [x] All prices convert from USD correctly

### Performance
- [x] Images optimized with lazy loading
- [x] Code splitting enabled
- [x] Bundle size optimized
- [x] Next.js config optimized

### Security
- [x] Environment variables properly handled
- [x] Encryption key has fallback
- [x] MongoDB connection safe
- [x] API routes protected

---

## 📋 Environment Variables Setup

### Required Variables (Production)

Copy these and fill in your actual values in your deployment platform:

```bash
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/roots2global?retryWrites=true&w=majority
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_CURRENCY=USD
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Optional Variables (Recommended)

```bash
NEXT_PUBLIC_ENCRYPTION_KEY=your-64-character-key
NEXT_PUBLIC_ERROR_TRACKING_ENABLED=true
NEXT_PUBLIC_DEBUG=false
```

---

## 🔍 Where to Get Each Variable

### 1. MONGODB_URI

**Source:** MongoDB Atlas

1. Go to [MongoDB Atlas Dashboard](https://www.mongodb.com/cloud/atlas)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<dbname>` with `roots2global`

**Example:**
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/roots2global?retryWrites=true&w=majority
```

---

### 2. NEXT_PUBLIC_ENCRYPTION_KEY (Optional but Recommended)

**Note:** This is optional - the build will work without it, but it's recommended for production security.

**Generate:** Run this command in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Copy the entire output** (64 characters) as your encryption key.

**⚠️ Important:** 
- Build will succeed without this variable
- Recommended to set it in production for better security
- If not set, a default fallback key will be used (development mode only)

---

### 3. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

**Source:** Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Navigate to Developers → API keys
3. Copy "Publishable key" (starts with `pk_test_` or `pk_live_`)

**Example:**
```
pk_test_51AbC123dEf456GhI789JkL012MnOpQrStUvWxYz
```

**For Production:** Use `pk_live_...` keys instead of `pk_test_...`

---

### 4. STRIPE_SECRET_KEY

**Source:** Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Navigate to Developers → API keys
3. Click "Reveal test key" or "Reveal live key"
4. Copy "Secret key" (starts with `sk_test_` or `sk_live_`)

**Example:**
```
sk_test_51AbC123dEf456GhI789JkL012MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrSt
```

**⚠️ Keep this secret! Never commit to GitHub.**

**For Production:** Use `sk_live_...` keys instead of `sk_test_...`

---

### 5. NEXT_PUBLIC_STRIPE_CURRENCY

**Value:** Currency code (usually USD)

**Options:**
- `USD` - US Dollar
- `EUR` - Euro
- `GBP` - British Pound
- `INR` - Indian Rupee
- Or any other Stripe-supported currency

---

### 6. NEXT_PUBLIC_SITE_URL

**Value:** Your deployment platform site URL

**Steps:**
1. Deploy your site first
2. Your platform will give you a URL (e.g., `https://your-app.vercel.app`)
3. Copy that URL
4. Add it as `NEXT_PUBLIC_SITE_URL`
5. Trigger a new deployment

**Examples:**
```
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-app.railway.app
NEXT_PUBLIC_SITE_URL=https://your-app.onrender.com
```

**Note:** If you add a custom domain later, update this value.

---

## 📝 How to Add Environment Variables

### For Vercel:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter variable name and value
6. Select environment (Production, Preview, Development)
7. Click **"Save"**
8. Repeat for all variables
9. Redeploy your site

### For Railway/Render/Other Platforms:
1. Go to your platform dashboard
2. Select your project/service
3. Navigate to **Environment Variables** or **Config**
4. Add each variable with name and value
5. Save and redeploy

---

## 🔧 Deployment Steps

### 1. Pre-Deployment
- [ ] Review all environment variables
- [ ] Test build locally: `npm run build`
- [ ] Test production build: `npm run start`
- [ ] Verify all API endpoints work
- [ ] Check currency conversion works
- [ ] Test payment flow (Stripe test mode)

### 2. Platform Setup (Vercel/Netlify/Railway)
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`
- [ ] Set Node.js version: `18.x` or `20.x`
- [ ] Add all environment variables (see section above)
- [ ] Configure custom domain (if applicable)

### 3. Environment Variables Setup
- [ ] Add `MONGODB_URI`
- [ ] Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Add `STRIPE_SECRET_KEY`
- [ ] Add `NEXT_PUBLIC_STRIPE_CURRENCY`
- [ ] Add `NEXT_PUBLIC_SITE_URL` (after first deploy)
- [ ] Add `NEXT_PUBLIC_ENCRYPTION_KEY` (optional but recommended)

### 4. First Deployment
- [ ] Trigger initial deployment
- [ ] Monitor build logs for errors
- [ ] Verify build completes successfully
- [ ] Test website loads correctly
- [ ] Update `NEXT_PUBLIC_SITE_URL` with actual URL
- [ ] Redeploy after updating site URL

### 5. Post-Deployment Testing
- [ ] Test homepage loads
- [ ] Test product listing page
- [ ] Test product detail page
- [ ] Test cart functionality
- [ ] Test checkout process
- [ ] Test currency conversion
- [ ] Test payment (test mode)
- [ ] Test user registration/login
- [ ] Test seller dashboard
- [ ] Test API endpoints

### 6. Production Verification
- [ ] Switch Stripe to live mode (when ready)
- [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live key
- [ ] Update `STRIPE_SECRET_KEY` to live key
- [ ] Test live payment flow
- [ ] Monitor error logs
- [ ] Check performance metrics

---

## 🐛 Common Issues & Solutions

### Build Fails
- **Issue:** Missing environment variables
- **Solution:** Add all required variables in platform settings (see "How to Add Environment Variables" above)

### MongoDB Connection Error
- **Issue:** `MONGODB_URI` not set or incorrect
- **Solution:** 
  1. Verify connection string format
  2. Check IP whitelist in MongoDB Atlas (add `0.0.0.0/0` for all IPs or your platform's IP)
  3. Verify username and password are correct
  4. Ensure database name is `roots2global`

### Stripe Payment Fails
- **Issue:** Stripe keys not set or incorrect
- **Solution:** 
  1. Verify keys match environment (test vs live)
  2. Check Stripe dashboard for key status
  3. Ensure keys are not expired or revoked
  4. See "Payment Gateway Options" section below for alternatives

### Currency Conversion Not Working
- **Issue:** Exchange rate API failing
- **Solution:** Check API endpoint, fallback rates will be used automatically

### Images Not Loading
- **Issue:** Image domain not configured
- **Solution:** Add domain to `next.config.js` remotePatterns

---

## 📊 Performance Checklist

- [x] Images optimized (lazy loading, proper sizes)
- [x] Code splitting enabled
- [x] Bundle size optimized
- [x] API calls cached
- [x] Exchange rates cached (1 hour)
- [x] Static pages pre-rendered
- [x] Dynamic routes optimized

---

## 🔒 Security Checklist

- [x] Environment variables not in code
- [x] API routes protected
- [x] User input sanitized
- [x] Passwords hashed
- [x] Encryption key configured
- [x] HTTPS enabled
- [x] Security headers configured

### Security Notes

- ✅ Never commit `.env` files to GitHub
- ✅ Use test Stripe keys during development
- ✅ Switch to live keys only in production
- ✅ Keep encryption key secure
- ✅ Rotate keys if compromised

---

## ✅ Final Verification

Before going live:
1. [ ] All tests pass
2. [ ] Build succeeds
3. [ ] All environment variables set
4. [ ] Payment flow tested
5. [ ] Currency conversion verified
6. [ ] Performance acceptable
7. [ ] No console errors
8. [ ] Error tracking configured
9. [ ] Backup plan ready

---

## 💳 Payment Gateway Options

### Current Setup: Stripe

The application is currently configured to use **Stripe** for payments. Stripe is a global payment gateway that supports international transactions.

**Stripe Setup:**
1. Create account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Use test keys (`pk_test_...` and `sk_test_...`) for development
4. Switch to live keys (`pk_live_...` and `sk_live_...`) for production

### Alternative: Razorpay (Recommended for Indian Market)

**Razorpay** is highly recommended for Indian businesses due to:
- ✅ Easy setup for Indian businesses (24-48 hour activation)
- ✅ Excellent UPI support (all major apps)
- ✅ Supports Cards, Net Banking, Wallets, EMI
- ✅ Low transaction fees: 2% + GST
- ✅ Global gateway (works worldwide like Stripe)

**Why Consider Razorpay:**
- **Stripe**: Global-first, complex setup for India
- **Razorpay**: India-first, easy setup, then expanded globally

**Razorpay Setup:**
1. Sign up at https://razorpay.com
2. Complete simple verification (Business PAN, Bank details)
3. Get Key ID and Key Secret from dashboard
4. Install SDK: `npm install razorpay`
5. Create payment intent API endpoint
6. Integrate Razorpay Checkout in frontend

**Using Both Gateways (Recommended):**
- **Razorpay** for Indian customers (INR currency, better UPI support)
- **Stripe** for international customers (USD, EUR, etc.)
- Conditional logic: If currency is INR → Razorpay, else → Stripe

### Other Payment Gateway Options

| Gateway | Type | Setup Difficulty | UPI Support | Transaction Fee | Best For |
|---------|------|-----------------|-------------|----------------|----------|
| **Razorpay** | 🌍 Global | ⭐ Easy | ✅ Excellent | 2% + GST | Indian + Global |
| **Stripe** | 🌍 Global | ⭐⭐⭐ Difficult | ❌ Limited | 2% + GST | International |
| **PayU** | 🇮🇳 Indian | ⭐⭐ Moderate | ✅ Good | 2-3% | Small-Medium |
| **Cashfree** | 🇮🇳 Indian | ⭐ Easy | ✅ Excellent | 2% + GST | All businesses |
| **PhonePe** | 🇮🇳 Indian | ⭐ Easy | ✅ Excellent | 2-3% | UPI-focused |
| **Paytm** | 🇮🇳 Indian | ⭐⭐ Moderate | ✅ Good | 2-3% | Established brands |

**Note:** All these gateways are PCI-DSS compliant and secure for handling payments.

---

## 🆘 Need Help?

If you're missing any values:
- **MongoDB:** Create account at https://www.mongodb.com/cloud/atlas
- **Stripe:** Create account at https://stripe.com
- **Razorpay:** Create account at https://razorpay.com (recommended for Indian market)
- **Encryption Key:** Generate using the command in section 2 above

---

## 🚀 Ready to Deploy!

Your application is ready for production deployment. Follow the steps above and monitor the first deployment closely.

**Good luck! 🎉**

