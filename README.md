### Simple Merge PDF Service 

- Sveltekit Cloudflare Pages Deployment
- Merge multiple PDF files into one
- Stripe CC Processing ($3.99 per merge)
- tailwindcss 
- No Database 
- Merged PDFs stored in R2, auto-deleted after 30 days

# simplemergepdf

## R2 Lifecycle (30-day deletion)

Merged PDFs in R2 are automatically deleted after 30 days. If you create a new bucket, add the lifecycle rule:

```sh
npx wrangler r2 bucket lifecycle add simplemergepdf-merged delete-after-30-days merged/ --expire-days 30 -y
```
