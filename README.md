# SimpleSignPDF

Sign PDF documents online. Upload a PDF, choose where to place your signature, draw or type your signature, pay, and download. A copy is sent to your email.

- SvelteKit + Cloudflare Pages
- Single PDF upload, place signature, draw or type
- Stripe payment processing
- TailwindCSS
- No database
- Signed PDFs stored in R2, auto-deleted after 30 days

## R2 Lifecycle (30-day deletion)

Signed PDFs in R2 are automatically deleted after 30 days. Create the bucket and add the lifecycle rule:

```sh
npx wrangler r2 bucket create simplesignpdf-signed
npx wrangler r2 bucket lifecycle add simplesignpdf-signed delete-after-30-days merged/ --expire-days 30 -y
```

## Environment

See `.env.example` for required variables. Set `SITE_URL=https://simplesignpdf.com` for production.
# simplesignpdf
