import {
	createTestAccount,
	createTransport,
	getTestMessageUrl,
} from "nodemailer";

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 */
async function sendEmail(options) {
	try {
		// Check if we're in development mode
		let transporter;

		if (
			process.env.NODE_ENV === "development" &&
			process.env.USE_TEST_EMAIL === "true"
		) {
			// Create a test account for development
			console.log("Creating test account for email...");
			const testAccount = await createTestAccount();

			transporter = createTransport({
				host: "smtp.ethereal.email",
				port: 587,
				secure: false,
				auth: {
					user: testAccount.user,
					pass: testAccount.pass,
				},
			});

			console.log("Using test email account:", testAccount.user);
		} else {
			// Configure real email service
			transporter = createTransport({
				service: process.env.EMAIL_SERVICE || "gmail",
				host: process.env.EMAIL_HOST,
				port: process.env.EMAIL_PORT,
				secure: process.env.EMAIL_SECURE === "true",
				auth: {
					user: process.env.EMAIL_USERNAME,
					pass: process.env.EMAIL_PASSWORD,
				},
			});
		}

		// Set up email options
		const mailOptions = {
			from:
				process.env.EMAIL_FROM || "MindSpace <noreply@mindharbor.edu>",
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html,
		};

		// Send the email
		const info = await transporter.sendMail(mailOptions);

		// Log email preview URL in development
		if (process.env.NODE_ENV === "development") {
			console.log("Email sent successfully!");
			console.log("Preview URL: %s", getTestMessageUrl(info));
		}

		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("Email sending failed:", error);
		return { success: false, error };
	}
}

export default sendEmail;
