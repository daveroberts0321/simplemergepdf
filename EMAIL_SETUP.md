# SimpleFax Email Configuration

## Amazon SES Setup

This application uses Amazon SES (Simple Email Service) to send confirmation emails to customers after successful fax payments.

## Environment Variables

Add the following variables to your `.env` file:

```env
# Amazon SES SMTP (Email)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
USE_MOCK_AWS="true"
EMAIL_FROM=your_email@example.com
```

### Variable Descriptions

- **AWS_ACCESS_KEY_ID**: Your AWS access key ID with SES permissions
- **AWS_SECRET_ACCESS_KEY**: Your AWS secret access key
- **AWS_REGION**: The AWS region where your SES is configured (e.g., `us-east-1`)
- **USE_MOCK_AWS**: Set to `"true"` for local development (logs emails to console instead of sending). Set to `"false"` in production.
- **EMAIL_FROM**: The verified email address that will appear as the sender (must be verified in AWS SES)

## AWS SES Configuration Steps

### 1. Create an AWS Account
If you don't have one already, sign up at https://aws.amazon.com

### 2. Verify Your Email Address
1. Go to AWS SES Console: https://console.aws.amazon.com/ses/
2. Navigate to "Verified identities"
3. Click "Create identity"
4. Select "Email address"
5. Enter your email address (the one you'll use for `EMAIL_FROM`)
6. Click "Create identity"
7. Check your email and click the verification link

### 3. Request Production Access (Important!)
By default, AWS SES is in "Sandbox mode" which only allows sending to verified email addresses.

To send to any email address:
1. In the SES Console, go to "Account dashboard"
2. Click "Request production access"
3. Fill out the form explaining your use case
4. Wait for approval (usually takes 24 hours)

### 4. Create IAM User with SES Permissions
1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → "Add users"
3. Enter a username (e.g., `simplefax-ses`)
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search for and select `AmazonSESFullAccess`
8. Click through and "Create user"
9. **Important**: Save the Access Key ID and Secret Access Key shown on the final page

### 5. Update Your .env File
Copy the Access Key ID and Secret Access Key to your `.env` file:

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
USE_MOCK_AWS="false"
EMAIL_FROM=noreply@yourdomain.com
```

## Email Flow

1. Customer completes payment via Stripe
2. Payment succeeds and redirects to `/success` page
3. Success page server load function:
   - Retrieves payment details from Stripe
   - Calls `sendConfirmationEmail()` with customer details
   - Email is sent asynchronously (doesn't block page load)
4. Customer receives a professionally formatted HTML email with:
   - Confirmation of payment
   - Fax recipient number
   - Transaction details
   - Privacy guarantee message

## Testing Locally

### Development Mode (Mock Emails)
Set `USE_MOCK_AWS="true"` in your `.env` file. Emails will be logged to the console instead of being sent.

```bash
npm run dev
```

Check your terminal output to see the mock email logs.

### Testing with Real SES
1. Set `USE_MOCK_AWS="false"` in your `.env`
2. Make sure your SES is still in Sandbox mode
3. Verify both your `EMAIL_FROM` address and the test recipient email in AWS SES
4. Test the payment flow with a verified email address

## Email Template

The confirmation email includes:
- Professional HTML formatting with your brand colors (cyan/teal)
- Transaction details (recipient fax number, sender name, amount)
- Privacy guarantee message
- Plain text fallback for email clients that don't support HTML

## Troubleshooting

### Email Not Sending
1. Check that `USE_MOCK_AWS` is set to `"false"`
2. Verify your AWS credentials are correct
3. Check that `EMAIL_FROM` is verified in AWS SES
4. If in Sandbox mode, verify the recipient email address
5. Check CloudWatch logs in AWS for error details

### Permission Errors
Make sure your IAM user has the `AmazonSESFullAccess` policy attached.

### Rate Limiting
AWS SES has sending limits. Check your SES sending limits in the AWS Console under "Account dashboard".

## Cost

AWS SES pricing (as of 2024):
- First 62,000 emails per month: FREE (when sent from EC2)
- After that: $0.10 per 1,000 emails

For SimpleFax's use case, you'll likely stay within the free tier.

## Production Deployment

When deploying to production:
1. Set `USE_MOCK_AWS="false"`
2. Ensure you have production access in AWS SES
3. Use environment variables in your hosting platform (Cloudflare, Vercel, etc.)
4. Never commit your `.env` file with real credentials to git
