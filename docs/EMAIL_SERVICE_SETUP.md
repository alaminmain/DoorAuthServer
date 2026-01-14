# Free Email Service Recommendations for DoorAuthServer

## Recommended: Brevo (formerly Sendinblue) ⭐ BEST CHOICE

### Why Brevo?
- ✅ **300 emails/day FREE** (9,000/month)
- ✅ No credit card required
- ✅ Simple API integration
- ✅ Good deliverability
- ✅ SMTP + API support
- ✅ Email templates
- ✅ Detailed analytics

### Setup Steps

1. **Create Account**
   - Go to https://www.brevo.com/
   - Sign up for free account
   - Verify your email

2. **Get API Key**
   - Go to Settings → SMTP & API
   - Create new API key
   - Copy the key (you'll need it)

3. **Environment Variables**
   ```env
   # Add to server/.env
   EMAIL_SERVICE=brevo
   BREVO_API_KEY=your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=DoorAuth
   ```

4. **Install Package**
   ```bash
   cd server
   npm install @getbrevo/brevo
   ```

---

## Alternative 1: SendGrid

### Pros & Cons
- ✅ **100 emails/day FREE** (3,000/month)
- ✅ Industry standard
- ✅ Excellent deliverability
- ❌ Requires credit card (even for free tier)
- ❌ Stricter verification process

### Setup Steps

1. **Create Account**
   - Go to https://sendgrid.com/
   - Sign up for free account
   - Verify email and add credit card

2. **Get API Key**
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permission
   - Copy the key

3. **Environment Variables**
   ```env
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=DoorAuth
   ```

4. **Install Package**
   ```bash
   cd server
   npm install @sendgrid/mail
   ```

---

## Alternative 2: Mailgun

### Pros & Cons
- ✅ **5,000 emails/month FREE** (first 3 months)
- ✅ Good for developers
- ❌ Requires credit card
- ❌ After 3 months, only 100 emails/day free

### Setup Steps

1. **Create Account**
   - Go to https://www.mailgun.com/
   - Sign up for free trial
   - Verify email and add credit card

2. **Get API Key**
   - Go to Settings → API Keys
   - Copy your API key
   - Note your domain (sandbox domain for testing)

3. **Environment Variables**
   ```env
   EMAIL_SERVICE=mailgun
   MAILGUN_API_KEY=your_api_key_here
   MAILGUN_DOMAIN=your_sandbox_domain
   EMAIL_FROM=noreply@your_sandbox_domain
   EMAIL_FROM_NAME=DoorAuth
   ```

4. **Install Package**
   ```bash
   cd server
   npm install mailgun.js form-data
   ```

---

## Alternative 3: Resend (Developer-Friendly)

### Pros & Cons
- ✅ **100 emails/day FREE**
- ✅ Modern, developer-friendly API
- ✅ No credit card required
- ✅ React email templates support
- ⚠️ Newer service (less established)

### Setup Steps

1. **Create Account**
   - Go to https://resend.com/
   - Sign up with GitHub
   - Verify email

2. **Get API Key**
   - Go to API Keys
   - Create new API key
   - Copy the key

3. **Environment Variables**
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=your_api_key_here
   EMAIL_FROM=onboarding@resend.dev
   EMAIL_FROM_NAME=DoorAuth
   ```

4. **Install Package**
   ```bash
   cd server
   npm install resend
   ```

---

## Comparison Table

| Service | Free Limit | Credit Card | Deliverability | Ease of Use | Recommendation |
|---------|-----------|-------------|----------------|-------------|----------------|
| **Brevo** | 300/day | ❌ No | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **BEST** |
| SendGrid | 100/day | ✅ Yes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Good |
| Mailgun | 5000/month (3mo) | ✅ Yes | ⭐⭐⭐⭐ | ⭐⭐⭐ | Okay |
| Resend | 100/day | ❌ No | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Good |

---

## Recommendation for DoorAuthServer

**Use Brevo** for the following reasons:
1. No credit card required
2. Generous free tier (300 emails/day)
3. Simple setup
4. Good for development and small production use
5. Can upgrade later if needed

---

## Next Steps

1. Choose Brevo (recommended)
2. Create account and get API key
3. Add environment variables to `.env`
4. I'll implement the email service integration
5. Test with email verification flow

---

## Email Templates We'll Create

1. **Email Verification**
   - Subject: "Verify your email address"
   - Content: Verification link with 24-hour expiry

2. **Welcome Email** (after verification)
   - Subject: "Welcome to DoorAuth!"
   - Content: Getting started guide

3. **Password Reset**
   - Subject: "Reset your password"
   - Content: Password reset link

4. **Session Alert** (optional)
   - Subject: "New login detected"
   - Content: Device and location info

---

**Ready to proceed with Brevo setup?**
