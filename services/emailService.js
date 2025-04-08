import transport from "../middleware/sendMail.js";
import User from "../models/userModel.js";

/**
 * Function to send an email notification to a user
 * @param {String} userId - The ID of the user to send email
 * @param {String} subject - Email subject
 * @param {String} message - Email body
 */
export const sendEmail = async (userId, subject, message) => {
    try {
        // Get the user's email
        const user = await User.findById(userId);
        if (!user || !user.email) {
            console.error(` No email found for user ${userId}`);
            return;
        }

        // Send the email
        await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: user.email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; background: #f9f9f9;">
                    <h2 style="color: #007BFF;">${subject}</h2>
                    <p style="color: #333;">${message}</p>
                    <br>
                    <p style="color: #666;">If you have any questions, contact support.</p>
                </div>
            `
        });

        console.log(`Email sent to ${user.email}`);

    } catch (error) {
        console.error(" Error sending email:", error.message);
    }
};
