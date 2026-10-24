# TODO

## Domain cutover (vaamshri.com -> new store)
Parked for now. Plan agreed in discussion:
1. Finish pre-launch items first: real stock numbers, order emails, contact/shipping/business settings, policy page text.
2. Back up: full Hostinger backup of the WordPress site (files + database) and a DNS record snapshot.
3. Add redirects from old WordPress addresses (`/product/<slug>/`, `/product-category/...`, `/about-us/`, `/contact-us/`, policy pages) to the new ones.
4. Rehearse on a subdomain (e.g. new.vaamshri.com) to test SSL, Razorpay and email.
5. Cutover at a quiet hour: move the WordPress site to a temporary address in hPanel (do not delete it), then Connect domain on the Node site (apex + www). Keep the email DNS records untouched.
6. Set `NEXT_PUBLIC_SITE_URL=https://vaamshri.com`, remove `PREVIEW_MODE`, rebuild, add a Razorpay webhook for the new URL, run a real Rs 1 test.
7. Rollback: put WordPress back on the domain or restore the DNS snapshot. Keep WordPress for at least a month.
- Check with Hostinger support whether the plan's main domain can be moved off the WordPress site this way.
- Before switching, confirm in WooCommerce that no paid orders are still waiting to be shipped.

## Other open items
- Real stock counts (45 pieces currently default to 10).
- Order and enquiry emails (needs a mailbox/SMTP login from the client).
- Client to fill in: contact details, shipping rules, business/GSTIN details, policy page text.
- Thank-you card redesign (waiting for the reference image).
- Landscape/portrait hero video poster image for better mobile performance score.
- Mobile alignment issues reported by the client (needs a page/screenshot to pin down).
