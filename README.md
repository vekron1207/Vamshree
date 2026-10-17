# Vaamshri

Ecommerce storefront + inventory/order admin for vaamshri.com.

## Stack

- Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4
- Prisma 7 + MySQL (via the `@prisma/adapter-mariadb` driver adapter)
- Razorpay for payments
- Custom cookie-based session auth for the admin panel (no third-party auth provider)

## Local setup

1. Copy `.env.example` to `.env` and fill in a local MySQL `DATABASE_URL` and Razorpay test keys.
2. Install dependencies: `npm install`
3. Push the schema to your database: `npx prisma db push`
4. Create the first admin login (reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`):
   `npm run db:seed`
5. Start the dev server: `npm run dev`
   - Storefront: http://localhost:3000
   - Admin: http://localhost:3000/admin/login

## Razorpay webhook

In the Razorpay dashboard, add a webhook pointing to `/api/webhooks/razorpay` with the
`payment.captured` and `order.paid` events enabled, and put its signing secret in
`RAZORPAY_WEBHOOK_SECRET`. This is the source of truth for marking an order paid and
decrementing stock - the client-side checkout callback also verifies and marks the
order paid immediately for a fast confirmation page, but the webhook covers cases
where the browser never gets to call back (closed tab, network drop, etc).

## Deploying to Hostinger

This project targets Hostinger's shared/"Unlimited" hosting plan, which supports a
Node.js app (via hPanel) and a MySQL database, but **not** PostgreSQL - hence the
MySQL + driver-adapter setup above.

1. Create a MySQL database in hPanel and note the connection details.
2. Create a Node.js app in hPanel pointing at this repo, with `npm run build` as the
   build command and `npm run start` as the start command.
3. Set the environment variables from `.env.example` in hPanel's Node.js app settings.
4. Run `npx prisma db push` and `npm run db:seed` once against the production database
   (via hPanel's SSH access or a one-off deploy step).
5. Admin image uploads are stored in `<app folder>/uploads` (gitignored) and served from
   `/media/...`. A `git pull` deploy leaves this folder alone, but if a deploy ever replaces the
   whole app folder, copy `uploads/` across (or symlink it to a folder outside the app) so
   product and collection photos aren't lost. Back it up along with the database.

## Store behaviour worth knowing

- **Stock is reserved when checkout starts** and handed back if the payment never completes
  (after 45 minutes, or straight away if the payment window can't open) or an admin cancels the
  order. Two people can't buy the last piece. If a payment arrives after its checkout expired and
  the stock is gone, the order is marked paid with a NEEDS ATTENTION note on the admin order page
  so you can refund or contact the customer.
- **Sizes** (rings etc.): add them under Sizes on the product form. Each size has its own stock and
  the product's stock is the total.
- **Settings** (Admin > Settings): shipping fee / free-shipping threshold, business details for
  invoices, low-stock level. **Discounts** (Admin > Discounts): percent or flat codes with minimum
  spend, dates and usage caps.
- Orders: add courier + tracking in the order page (customers see it in their account), print an
  invoice, export orders/customers as CSV. Set `NEXT_PUBLIC_SITE_URL` so sitemap, canonical links
  and social previews use the real domain.
- A WhatsApp chat button appears automatically once a WhatsApp number is saved on Admin > Pages > Contact.

## Known gaps / next steps

- Not built (needs outside services): order emails/SMS, password reset, phone OTP, courier
  booking/tracking APIs. Razorpay checkout has not been exercised end to end - add real keys in
  test mode and run a test payment before launch.
- Rate limits and throttles are in memory, so they reset when the app restarts.
- `getActiveProducts` / `getProductBySlug` (`src/lib/products.ts`) are intentionally
  uncached for now. Once a live database is connected, add `"use cache"` +
  `cacheTag("products")` back for performance (the admin actions already call
  `updateTag("products")` on mutation, ready for this).
