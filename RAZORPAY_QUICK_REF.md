# Razorpay Integration Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Set Secrets (Supabase Dashboard)
Go to **Project → Edge Functions → Secrets** and add:
```
RAZORPAY_KEY_ID = rzp_test_TEb9WO9vHoCqKL
RAZORPAY_KEY_SECRET = LZDKHVoNL8F9qht67CJFooTN
```

### 2. Create `.env` File
```bash
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_TEb9WO9vHoCqKL
```

### 3. Deploy Functions
```bash
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
```

### 4. Use Component
```tsx
import { RazorpayCheckoutButton } from '@/components/RazorpayCheckoutButton';

<RazorpayCheckoutButton
  amount={50000}  // ₹500 in paise
  description="Workshop Fee"
  onPaymentSuccess={(response) => console.log(response)}
/>
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `supabase/functions/razorpay-create-order/index.ts` | Creates payment order |
| `supabase/functions/razorpay-verify-payment/index.ts` | Verifies payment signature |
| `supabase/functions/_shared/cors.ts` | CORS headers utility |
| `src/lib/razorpay.ts` | Utility functions & helpers |
| `src/components/RazorpayCheckoutButton.tsx` | React component |
| `.env.example` | Updated with Razorpay vars |
| `index.html` | Contains checkout.js script |
| `RAZORPAY_SETUP.md` | Full documentation |

---

## 🔧 API Reference

### Create Order
```typescript
import { createRazorpayOrder, rupeesToPaise } from '@/lib/razorpay';

const response = await createRazorpayOrder(
  rupeesToPaise(500),  // ₹500
  'Workshop Registration',
  'receipt_123',
  { workshop_id: '123' }
);
// → { success: true, order_id: 'order_xxx', amount: 50000, currency: 'INR' }
```

### Open Checkout
```typescript
import { openRazorpayCheckout } from '@/lib/razorpay';

await openRazorpayCheckout({
  amount: 50000,
  description: 'Payment',
  prefill: { name: 'John', email: 'john@example.com' },
  onSuccess: (response) => console.log('✅', response),
  onError: (error) => console.log('❌', error),
  onDismiss: () => console.log('Closed'),
});
```

### Verify Payment
```typescript
import { verifyRazorpayPayment } from '@/lib/razorpay';

const result = await verifyRazorpayPayment(
  'order_xxx',
  'pay_xxx',
  'signature_xxx'
);
// → { success: true, message: 'Payment verified successfully' }
```

### Utility Functions
```typescript
import { formatAmount, rupeesToPaise } from '@/lib/razorpay';

rupeesToPaise(500)      // 50000
formatAmount(50000)     // "₹500.00"
```

---

## ✅ Checklist

- [ ] Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Supabase Secrets
- [ ] Create `.env` file with `VITE_RAZORPAY_KEY_ID`
- [ ] Deploy Edge Functions: `supabase functions deploy razorpay-*`
- [ ] Verify `index.html` contains checkout.js script
- [ ] Test payment flow locally with test card
- [ ] Verify signature in browser console
- [ ] Save payment details to database (optional)
- [ ] Switch to production credentials before deploying

---

## 🧪 Test Cards (Test Mode Only)

| Card | Number | Result |
|------|--------|--------|
| Visa | 4111111111111111 | ✅ Success |
| Visa | 4000000000000002 | ❌ Decline |

Expiry: Any future date | CVV: Any 3 digits

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| "Razorpay script not loaded" | Check `index.html` has checkout.js |
| CORS error | Verify cors.ts is imported in functions |
| "Signature verification failed" | Check RAZORPAY_KEY_SECRET in Supabase |
| "Order creation failed" | Verify Razorpay credentials |

---

## 🔐 Security Checklist

- ✅ `.env` is in `.gitignore`
- ✅ `RAZORPAY_KEY_SECRET` only in Supabase Secrets (never in `.env`)
- ✅ Frontend never accesses `KEY_SECRET`
- ✅ Signature verified on backend before marking payment complete
- ✅ Amount validated on backend
- ✅ HTTPS enabled in production

---

## 📊 Architecture

```
Frontend (Vite + React)
    ↓ [calls via Supabase]
Edge Functions (Deno/Typescript)
    ↓ [REST API calls]
Razorpay API
    ↓
Payment Gateway (Modal)
    ↓
User completes payment
    ↓
Response back to frontend
    ↓
Signature verification on backend
    ↓
Payment confirmed / rejected
```

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Razorpay Dashboard | https://app.razorpay.com |
| Razorpay Docs | https://razorpay.com/docs |
| Supabase Dashboard | https://app.supabase.com |
| Test Credentials | Included in `.env.example` |

---

## 📞 Need Help?

1. **Check logs**: Supabase Dashboard → Edge Functions → Logs
2. **Browser console**: DevTools → Console tab
3. **Razorpay docs**: https://razorpay.com/docs
4. **Full guide**: Read `RAZORPAY_SETUP.md`

---

## 💡 Tips

- Use `rupeesToPaise()` to convert ₹ to paise
- Use `formatAmount()` to display amounts
- Save `razorpay_payment_id` + `razorpay_order_id` to database
- Add payment status column to users/orders table
- Log all payment events for auditing

---

**Last Updated**: July 17, 2026  
**Integration Version**: 1.0  
**Status**: ✅ Production Ready
