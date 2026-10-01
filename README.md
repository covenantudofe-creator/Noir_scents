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
