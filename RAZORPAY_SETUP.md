# Razorpay Standard Checkout Integration Guide

## Overview

This project now includes **Razorpay Standard Web Checkout** integration with:
- Backend Edge Functions for order creation and payment verification
- Frontend React component for seamless checkout
- Type-safe utilities and helpers
- Full HMAC-SHA256 signature verification

---

## 📋 Setup Instructions

### Step 1: Environment Configuration

#### 1a. Frontend Environment (`.env`)

Create a `.env` file in the project root (already in `.gitignore`):

```bash
# Copy from .env.example
cp .env.example .env
```

Fill in the frontend variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_TEb9WO9vHoCqKL
```

**⚠️ IMPORTANT**: 
- `VITE_RAZORPAY_KEY_ID` is **public** (exposed in frontend)
- Never add `VITE_RAZORPAY_KEY_SECRET` to frontend code

#### 1b. Backend Secrets (Supabase Edge Functions)

Set Razorpay credentials as Supabase Edge Function secrets:

```bash
# Using Supabase CLI
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_test_TEb9WO9vHoCqKL \
  RAZORPAY_KEY_SECRET=LZDKHVoNL8F9qht67CJFooTN
```

Or via [Supabase Dashboard](https://app.supabase.com/):
1. Navigate to **Project → Edge Functions → Secrets**
2. Add:
   - Key: `RAZORPAY_KEY_ID` → Value: `rzp_test_TEb9WO9vHoCqKL`
   - Key: `RAZORPAY_KEY_SECRET` → Value: `LZDKHVoNL8F9qht67CJFooTN`

### Step 2: Verify Files Are in Place

Check that these files exist:

```
✓ supabase/functions/razorpay-create-order/index.ts
✓ supabase/functions/razorpay-verify-payment/index.ts
✓ supabase/functions/_shared/cors.ts
✓ src/lib/razorpay.ts
✓ src/components/RazorpayCheckoutButton.tsx
✓ index.html (contains <script src="https://checkout.razorpay.com/v1/checkout.js">)
```

### Step 3: Deploy Edge Functions

```bash
# Start local development
supabase start

# Deploy to production
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
```

---

## 🧪 Testing the Integration

### Local Testing

#### 1. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

#### 2. Use Test Credentials

The provided credentials are for **Test Mode**:
- **Key ID**: `rzp_test_TEb9WO9vHoCqKL`
- **Key Secret**: `LZDKHVoNL8F9qht67CJFooTN`

#### 3. Test Payment Flow

Use these test card numbers from Razorpay docs:
- **Success**: `4111111111111111` (Visa)
- **Decline**: `4000000000000002` (Visa)

Any expiry date (future) and any CVV works in test mode.

#### 4. Check Console Logs

Monitor browser DevTools Console for:
- ✅ Order creation responses
- ✅ Signature verification status
- ❌ Any CORS or API errors

---

## 💻 Usage Example

### Basic Implementation

```tsx
import { RazorpayCheckoutButton } from '@/components/RazorpayCheckoutButton';
import { rupeesToPaise } from '@/lib/razorpay';

export function PaymentPage() {
  const amount = rupeesToPaise(500); // ₹500 → 50000 paise

  const handleSuccess = (response) => {
    console.log('Payment successful:', response);
    // Save payment details to database
    // Redirect to success page
  };

  const handleError = (error) => {
    console.error('Payment failed:', error.message);
    // Show error toast/notification
  };

  return (
    <div>
      <h1>Checkout</h1>
      <RazorpayCheckoutButton
        amount={amount}
        description="Workshop Registration Fee"
        notes={{ workshop_id: '123' }}
        prefill={{
          name: 'John Doe',
          email: 'john@example.com',
          contact: '9876543210',
        }}
        onPaymentSuccess={handleSuccess}
        onPaymentError={handleError}
        buttonText="Pay Now"
      />
    </div>
  );
}
```

### Advanced: Custom Integration

```tsx
import { openRazorpayCheckout, formatAmount, rupeesToPaise } from '@/lib/razorpay';

async function initiatePayment() {
  try {
    const response = await openRazorpayCheckout({
      amount: rupeesToPaise(1000), // ₹1000
      description: 'Premium Internship Application',
      notes: {
        user_id: 'usr_123',
        internship_id: 'int_456',
      },
      prefill: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        contact: '8765432109',
      },
      onSuccess: (response) => {
        console.log('✅ Payment successful!', response);
        // Handle success
      },
      onError: (error) => {
        console.error('❌ Payment failed:', error.description);
        // Handle error
      },
      onDismiss: () => {
        console.log('Payment modal closed');
      },
    });
  } catch (error) {
    console.error('Payment initiation failed:', error);
  }
}
```

---

## 🔐 Security Best Practices

### ✅ DO

- ✅ Store `RAZORPAY_KEY_SECRET` **only** as Supabase secrets
- ✅ Verify signatures on backend before marking payment as complete
- ✅ Never hardcode credentials in source files
- ✅ Use HTTPS in production (Razorpay requires it)
- ✅ Validate amount on backend before creating order
- ✅ Log payment events for audit trail

### ❌ DON'T

- ❌ Add `RAZORPAY_KEY_SECRET` to `.env` file
- ❌ Expose `RAZORPAY_KEY_SECRET` in frontend code
- ❌ Trust frontend-only payment validation
- ❌ Skip signature verification
- ❌ Commit `.env` file to Git
- ❌ Use test credentials in production

---

## 📁 File Structure

```
project-root/
├── .env                                    # Create from .env.example
├── index.html                              # ✅ Contains Razorpay script
├── .env.example                            # ✅ Updated with Razorpay vars
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   └── cors.ts                     # ✅ CORS headers utility
│       ├── razorpay-create-order/
│       │   └── index.ts                    # ✅ Order creation endpoint
│       └── razorpay-verify-payment/
│           └── index.ts                    # ✅ Signature verification
└── src/
    ├── lib/
    │   └── razorpay.ts                     # ✅ Utility functions
    ├── components/
    │   └── RazorpayCheckoutButton.tsx      # ✅ React component
    └── pages/
        └── Checkout.tsx                    # Example: Use button here
```

---

## 🐛 Troubleshooting

### Issue: "Razorpay checkout script not loaded"

**Cause**: `checkout.js` not found in HTML

**Fix**:
```html
<!-- Verify this exists in index.html -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

### Issue: "CORS error from Edge Function"

**Cause**: Missing CORS headers in Edge Function response

**Fix**: Ensure Edge Functions import and use `corsHeaders`:
```typescript
import { corsHeaders } from '../_shared/cors.ts';

return new Response(data, {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

---

### Issue: "Signature verification failed"

**Cause**: HMAC-SHA256 calculation mismatch

**Debug**:
1. Check `RAZORPAY_KEY_SECRET` is set correctly in Supabase
2. Verify message format: `order_id|payment_id` (exact order, no extra spaces)
3. Check logs in Supabase Edge Function dashboard

---

### Issue: "Missing RAZORPAY environment variables"

**Cause**: Secrets not set in Supabase

**Fix**:
```bash
supabase secrets set RAZORPAY_KEY_ID=xxx RAZORPAY_KEY_SECRET=yyy
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
```

---

### Issue: "Order creation returns 401"

**Cause**: Invalid or missing Razorpay credentials

**Fix**:
1. Verify credentials from Razorpay Dashboard
2. Ensure Basic Auth encoding: `btoa('key_id:key_secret')`
3. Check Razorpay account is in test mode

---

## 📊 Razorpay API Endpoints Used

| Function | Method | URL | Purpose |
|----------|--------|-----|---------|
| `razorpay-create-order` | POST | `https://api.razorpay.com/v1/orders` | Create payment order |
| `razorpay-verify-payment` | POST | (Client-side) | Verify HMAC-SHA256 signature |

---

## 🔄 Payment Flow Diagram

```
1. User clicks "Pay" button
   ↓
2. Frontend calls createRazorpayOrder()
   ↓
3. Edge Function creates order via Razorpay API
   ↓
4. Order ID returned to frontend
   ↓
5. Razorpay modal opens with order details
   ↓
6. User enters payment details
   ↓
7. Razorpay processes payment
   ↓
8. Success: Handler receives payment_id & signature
   ↓
9. Frontend calls verifyRazorpayPayment()
   ↓
10. Edge Function verifies HMAC-SHA256 signature
    ↓
11. Signature valid? → Payment confirmed → Success callback
    Signature invalid? → Reject payment → Error callback
```

---

## 📱 Production Deployment

### 1. Get Production Credentials

- Login to [Razorpay Dashboard](https://app.razorpay.com)
- Go to **Settings → API Keys**
- Copy **Production Key ID** and **Production Secret**

### 2. Update Environment Variables

```bash
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_live_xxx \
  RAZORPAY_KEY_SECRET=yyy
```

Update `.env`:
```
VITE_RAZORPAY_KEY_ID=rzp_live_xxx
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy razorpay-create-order --prod
supabase functions deploy razorpay-verify-payment --prod
```

### 4. Test with Real Payments

Use actual card numbers (not test cards). Real money will be charged and refunded.

---

## 📚 Documentation Links

- [Razorpay Docs](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)
- [Razorpay API Reference](https://razorpay.com/docs/api/orders/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Docs](https://deno.land/)

---

## 🎯 Next Steps

1. ✅ Set up environment variables
2. ✅ Deploy Edge Functions
3. ✅ Test with test credentials
4. ✅ Integrate button into Checkout page
5. ✅ Save payment details to database (optional)
6. ✅ Send confirmation emails (optional)
7. ✅ Switch to production credentials
8. ✅ Test real payments

---

## 📞 Support

For issues:
1. Check [Razorpay Troubleshooting Guide](https://razorpay.com/docs/faqs/)
2. Review Edge Function logs in Supabase Dashboard
3. Check browser Console for errors
4. Verify all environment variables are set correctly
