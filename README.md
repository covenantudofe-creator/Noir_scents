# Noir_scents — React + FastAPI + PostgreSQL

The storefront uses React/Vite and the API uses FastAPI with PostgreSQL.
Paystack payments are initialized and verified by the backend. Creating an
order reserves its inventory immediately; failed or abandoned Paystack payments
restore the reserved stock.

## Frontend
```powershell
cd frontend
npm install
npm run dev
```

## Backend
Open a second PowerShell:
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Deploy to Render

This repository contains both services, so create two Render services from the
same GitHub repository and set a different **Root Directory** for each one.
Keep using the PostgreSQL database configured by `DATABASE_URL`; the backend
does not use Supabase.

### Frontend Static Site

- **Root Directory:** `frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: `https://noir-scents-1.onrender.com` (no trailing slash)
  - `VITE_GOOGLE_CLIENT_ID`: the public Google OAuth client ID used locally

Vite reads these variables at build time. Trigger a new deploy after changing
either value.

### Backend Web Service

- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `DATABASE_URL`: the connection string for the existing PostgreSQL database
  - `FRONTEND_URL`: `https://noir-scents-chi.vercel.app` (no trailing slash)
  - `GOOGLE_CLIENT_ID`: the same public Google OAuth client ID
  - `AUTH_SECRET_KEY`: a unique, long random signing key
  - `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and `MAILGUN_FROM`: required for order
    confirmation email after verified payment; `MAILGUN_BASE_URL` is optional
    and defaults to the US API endpoint
  - `PAYSTACK_SECRET_KEY`: private Paystack test or live secret key; set only on
    the backend Web Service
  - `PORT` is supplied automatically by Render; do not set a fixed production
    port

The backend binds to `0.0.0.0` through the start command. Locally, Uvicorn uses
port `8000` by default. After deployment, check `https://<backend-url>/health`;
it should return `{"status":"ok"}`.

### Connect the deployed URLs

After Render creates both services, set the backend's `FRONTEND_URL` to the
frontend URL and the frontend's `VITE_API_URL` to the backend URL. Use the same
frontend URL in Google Cloud Console under **Authorized JavaScript origins**.
The backend verifies Google Identity Services credentials using
`GOOGLE_CLIENT_ID`; this code does not use a Google client secret or a
redirect-URI flow. Keep `AUTH_SECRET_KEY`, `DATABASE_URL`, and Mailgun values
only in the backend's environment settings.

## Configure payments
Paystack is the only online provider currently implemented. The other payment
choices remain pending/manual and do not process payments.

## Configure Google sign-in
1. Create a **Web application** OAuth client in Google Cloud Console.
2. In **Authorized JavaScript origins**, add the exact frontend origins you use:
   `http://localhost:5173` for local development and
   `https://noir-scents-chi.vercel.app` after deploying. Origins do not
   include a path or trailing slash. Do not add the backend URL here.
3. Put the same client ID in `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` and `GOOGLE_CLIENT_ID` in `backend/.env`.
4. Set `AUTH_SECRET_KEY` in `backend/.env` to a long, random secret. For example, generate one with `py -c "import secrets; print(secrets.token_urlsafe(48))"`.
5. Install the updated backend requirements and restart the backend; install frontend dependencies and restart Vite if needed.

Google sign-in verifies the Google credential in FastAPI, stores the Google account in the `users` table, and returns a seven-day app session. The frontend keeps that session in the current browser tab and uses the profile name and email to prefill checkout. Add your production website origin to the OAuth client and `FRONTEND_URL` before deployment. Keep `AUTH_SECRET_KEY` private and do not commit either `.env` file.
This is a Google Identity Services JavaScript flow: it does not use an authorized
redirect URI or a Google client secret. Set `VITE_GOOGLE_CLIENT_ID` in Vercel
and `GOOGLE_CLIENT_ID` plus `AUTH_SECRET_KEY` on Render. Redeploy the frontend
after changing its `VITE_` variable.

## Configure Mailgun welcome and order emails
Add these values to `backend/.env`:

- `MAILGUN_API_KEY`: a private Mailgun API key with message-sending permission.
- `MAILGUN_DOMAIN`: your Mailgun sending domain.
- `MAILGUN_FROM`: a sender address on that verified domain, such as `Noir Scents <orders@mg.yourdomain.com>`.
- `MAILGUN_BASE_URL`: use `https://api.mailgun.net` for US accounts or `https://api.eu.mailgun.net` for EU accounts.

After saving, restart FastAPI. A newly registered Google sign-in receives one
plain-text welcome email after their account has been saved. Returning users do
not receive another welcome email each time they sign in. Each successfully
created order also sends a plain-text confirmation with its items, total, and
confirmed-payment status after Paystack verification. Email delivery failures
are logged and do not undo account creation or change payment status. The sign-in API response includes
`welcome_email_sent` so the caller can tell whether the email was accepted by
Mailgun. Mailgun must have the sending domain verified; sandbox domains can
only send to authorized recipients.

### Paystack
Set `PAYSTACK_SECRET_KEY` in Render's backend environment. Use the test secret
key while testing; never place it in Vercel or React. Set the Paystack webhook
URL to `https://noir-scents-1.onrender.com/api/payments/paystack/webhook`.
The frontend returns to the Vercel site, which asks the backend to verify the
transaction before the order is marked paid.

### Flutterwave
Set `FLW_SECRET_KEY` and `FLW_SECRET_HASH`. Flutterwave Standard creates a payment link server-side and redirects the customer back after payment. Verify the transaction on the backend before marking an order paid.

### OPay
Set the OPay merchant values from OPay Business Dashboard > Developer Tools. OPay's current public documentation requires RSA encryption/signing and merchant-specific configuration. Confirm the `OPAY_SCENE_ENUM` and `OPAY_SUB_SCENE_ENUM` values with OPay for your account before production. Add the public webhook URL in OPay Developer Tools.

### Bank transfer
Replace `BANK_NAME`, `BANK_ACCOUNT_NAME`, and `BANK_ACCOUNT_NUMBER` with Noir_scents' real business account. Bank-transfer orders should remain `pending` until you confirm the transfer or automate confirmation through a provider.

## Important security
Never put secret keys in `frontend/src`, never commit `.env` to GitHub, and use TEST keys while developing. Before production, use HTTPS and persist orders/payment statuses in Neon.
