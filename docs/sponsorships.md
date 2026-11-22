# Sponsorships and Stripe Checkout

Businesses can ask about a project, pledge support for supplies or operations and commit volunteer places. Coordinators review offers and confirm pledges before collecting payment. A confirmed volunteer commitment updates staffing independently of payments. Project and business reports use the same sponsorship ledger.

## Collect a payment

1. Open **Community → Winter essentials drive → See sponsorship options** or choose **Pantry meal kits** under **Impact → Choose a project to support**. Submit an offer.
2. As the coordinator, open **Manage project support → Review** and confirm the offer.
3. Open **Payments**, select the pledge and enter the amount to collect. Choose **Create Stripe payment link**. Copy the link or share it from the phone. The sponsor can open it directly in their browser.
4. The coordinator’s outstanding balance and project reports update when Stripe confirms the payment. Repeat for any remaining balance. Use **Record offline payment** for funds received outside Stripe.

An active Checkout link reserves its amount against the remaining pledge. Opening the payment link again uses the same session. An expired checkout or failed delayed payment releases the reservation. A paid session contributes one receipt, including when Stripe retries delivery of the event. Project totals use posted receipts. Handle refunds, disputes and related adjustments in Stripe and reconcile those separately against the gross receipts ledger.

## Configure the API

Connect the Stripe account that should receive project sponsorships. Set `STRIPE_SECRET_KEY` to a server-side restricted key with Checkout Sessions write access. Set `STRIPE_CHECKOUT_RETURN_ORIGIN` to the public HTTPS origin for the API. Register `POST /sponsorship/stripe/webhook` at that origin and set `STRIPE_WEBHOOK_SECRET` to the endpoint’s signing secret. Store both credentials in the host’s secret manager. [Stripe key guidance](https://docs.stripe.com/keys-best-practices)

Subscribe the endpoint to these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Restart the API after setting the environment, and run the client with `EXPO_PUBLIC_API_URL` pointing to it. The Checkout controls appear for the coordinator on a configured shared workspace. Stripe hosts card entry. The return page only acknowledges the action. The webhook verifies the raw request signature, session, pledge, currency and amount before writing a receipt. [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?ui=full-page)

For verification, use a Stripe sandbox and complete a small payment through the generated link. In local development, Stripe CLI can forward the same events to `http://localhost:8787/sponsorship/stripe/webhook`, using the signing secret printed by `stripe listen`. Verify that the amount is credited once after replaying the event and that a second partial payment uses the remaining balance.
