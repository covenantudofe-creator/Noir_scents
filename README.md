# Noir_scents — React + FastAPI + multiple Nigerian payment methods

This version supports four checkout choices:
1. Paystack — server-side transaction initialization and verification.
2. Flutterwave — server-side Standard checkout and verification.
3. OPay — encrypted server-side order creation using OPay's RSA API envelope; OPay merchant-specific configuration is required.
4. Bank transfer — manual transfer instructions using the bank details in `.env`.

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

## Configure payments
Edit `backend/.env`.

## Configure Google sign-in
1. Create a **Web application** OAuth client in Google Cloud Console.
2. Add the website origin to its authorized JavaScript origins. For local development, add both `http://localhost:5173` and `http://127.0.0.1:5173` if you use both addresses.
3. Put the same client ID in `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` and `GOOGLE_CLIENT_ID` in `backend/.env`.
4. Set `AUTH_SECRET_KEY` in `backend/.env` to a long, random secret. For example, generate one with `py -c "import secrets; print(secrets.token_urlsafe(48))"`.
5. Install the updated backend requirements and restart the backend; install frontend dependencies and restart Vite if needed.

Google sign-in verifies the Google credential in FastAPI, stores the Google account in the `users` table, and returns a seven-day app session. The frontend keeps that session in the current browser tab and uses the profile name and email to prefill checkout. Add your production website origin to the OAuth client and `FRONTEND_URL` before deployment. Keep `AUTH_SECRET_KEY` private and do not commit either `.env` file.

## Configure Mailgun order confirmations
Add these values to `backend/.env`:

- `MAILGUN_API_KEY`: a private Mailgun API key with message-sending permission.
- `MAILGUN_DOMAIN`: your Mailgun sending domain.
- `MAILGUN_FROM`: a sender address on that verified domain, such as `Noir Scents <orders@mg.yourdomain.com>`.
- `MAILGUN_BASE_URL`: use `https://api.mailgun.net` for US accounts or `https://api.eu.mailgun.net` for EU accounts.

After saving, restart FastAPI. Each successfully created order sends the customer a plain-text confirmation with its items, total, and current pending-payment status. Email delivery failures are logged and do not cancel the order. Mailgun must have the sending domain verified; sandbox domains can only send to authorized recipients.

### Paystack
Set `PAYSTACK_SECRET_KEY`. Paystack initializes transactions from the backend and returns an authorization URL; the secret key must never be placed in React. Configure the webhook URL in your Paystack dashboard when the backend is publicly reachable.

### Flutterwave
Set `FLW_SECRET_KEY` and `FLW_SECRET_HASH`. Flutterwave Standard creates a payment link server-side and redirects the customer back after payment. Verify the transaction on the backend before marking an order paid.

### OPay
Set the OPay merchant values from OPay Business Dashboard > Developer Tools. OPay's current public documentation requires RSA encryption/signing and merchant-specific configuration. Confirm the `OPAY_SCENE_ENUM` and `OPAY_SUB_SCENE_ENUM` values with OPay for your account before production. Add the public webhook URL in OPay Developer Tools.

### Bank transfer
Replace `BANK_NAME`, `BANK_ACCOUNT_NAME`, and `BANK_ACCOUNT_NUMBER` with Noir_scents' real business account. Bank-transfer orders should remain `pending` until you confirm the transfer or automate confirmation through a provider.

## Important security
Never put secret keys in `frontend/src`, never commit `.env` to GitHub, and use TEST keys while developing. Before production, use HTTPS and persist orders/payment statuses in Neon.
