// email.ts: handles sending emails via Amazon SES
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { env } from '$env/dynamic/private';

// createSESClient: creates and configures the SES client
function createSESClient() {
	// Check if we're in mock mode (for local development)
	if (env.USE_MOCK_AWS === 'true') {
		return null;
	}

	// Create SES client with credentials from environment variables
	return new SESClient({
		region: env.AWS_REGION || 'us-east-1',
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
		}
	});
}

// sendConfirmationEmail: sends a confirmation email with download link after successful payment
export async function sendConfirmationEmail(
	recipientEmail: string,
	downloadLink: string
): Promise<boolean> {
	try {
		const sesClient = createSESClient();

		// If in mock mode, log the email and return success
		if (!sesClient) {
			console.log('[MOCK EMAIL] Would send confirmation email to:', recipientEmail);
			console.log('Download Link:', downloadLink);
			return true;
		}

		// Email subject line
		const subject = 'SimpleMergePDF - Your Merged PDF is Ready';

		// HTML email body with confirmation details
		const htmlBody = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>SimpleMergePDF Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f1f5f9;">
	<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
		<!-- Header -->
		<div style="background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
			<h1 style="color: #ffffff; margin: 0; font-size: 28px;">SimpleMergePDF</h1>
			<p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 16px;">Your merged PDF is ready!</p>
		</div>
		
		<!-- Body -->
		<div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
			<h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px;">Thank you for using SimpleMergePDF!</h2>
			
			<p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
				Your payment has been successfully processed, and your PDFs have been merged into a single document.
			</p>
			
			<!-- Download Button -->
			<div style="text-align: center; margin: 30px 0;">
				<a href="${downloadLink}" style="display: inline-block; background-color: #9333ea; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">Download Your Merged PDF</a>
			</div>
			
			<p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0; font-size: 14px;">
				Or copy and paste this link into your browser:<br />
				<a href="${downloadLink}" style="color: #9333ea; word-break: break-all;">${downloadLink}</a>
			</p>
			
			<!-- Details Section -->
			<div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
				<h3 style="color: #0f172a; margin: 0 0 15px 0; font-size: 16px;">Transaction Details</h3>
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 8px 0; color: #64748b; font-size: 14px;">Service:</td>
						<td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right;">PDF Merge</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount Paid:</td>
						<td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right;">$2.99</td>
					</tr>
				</table>
			</div>
			
			<!-- Privacy Notice -->
			<div style="background-color: #f0fdfa; border: 1px solid #99f6e4; padding: 15px; border-radius: 8px; margin: 0 0 25px 0;">
				<p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.5;">
					<strong>🔒 Privacy Guarantee:</strong> Your files have been permanently deleted from our servers. We do not store any documents or personal information after processing.
				</p>
			</div>
			
			<p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0; font-size: 14px;">
				If you have any questions or issues, please reply to this email.
			</p>
			
			<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
			
			<p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
				This is an automated confirmation email from SimpleMergePDF.<br />
				No subscription. No tracking. No data retention.
			</p>
		</div>
	</div>
</body>
</html>
		`;

		// Plain text version for email clients that don't support HTML
		const textBody = `
SimpleMergePDF - Your Merged PDF is Ready

Thank you for using SimpleMergePDF!

Your payment has been successfully processed, and your PDFs have been merged into a single document.

Download your merged PDF here:
${downloadLink}

Transaction Details:
- Service: PDF Merge
- Amount Paid: $2.99

Privacy Guarantee: Your files have been permanently deleted from our servers. We do not store any documents or personal information after processing.

If you have any questions or issues, please reply to this email.

---
This is an automated confirmation email from SimpleMergePDF.
No subscription. No tracking. No data retention.
		`;

		// Create the SendEmailCommand with all parameters
		const command = new SendEmailCommand({
			Source: env.EMAIL_FROM!, // From address (must be verified in SES)
			Destination: {
				ToAddresses: [recipientEmail] // Recipient email address
			},
			Message: {
				Subject: {
					Data: subject,
					Charset: 'UTF-8'
				},
				Body: {
					Html: {
						Data: htmlBody,
						Charset: 'UTF-8'
					},
					Text: {
						Data: textBody,
						Charset: 'UTF-8'
					}
				}
			}
		});

		// Send the email via SES
		await sesClient.send(command);
		console.log('[EMAIL] Confirmation sent to:', recipientEmail);
		return true;
	} catch (error) {
		// Log the error but don't throw - we don't want email failures to break the app
		console.error('[EMAIL ERROR] Failed to send confirmation email:', error);
		return false;
	}
}
