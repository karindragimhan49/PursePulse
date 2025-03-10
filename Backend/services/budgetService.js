import Budget from "../models/budgetModel.js";
import User from "../models/userModel.js";
import { sendEmail } from "./emailService.js"; 

/**
 * Auto-renew budgets and send email notifications
 */
export const renewBudgets = async () => {
    try {
        const today = new Date();

        // Find budgets that need renewal
        const budgetsToRenew = await Budget.find({
            $or: [
                { duration: "monthly", createdAt: { $lte: new Date(today.getFullYear(), today.getMonth(), 1) } },
                { duration: "yearly", createdAt: { $lte: new Date(today.getFullYear(), 0, 1) } },
            ]
        });

        if (budgetsToRenew.length === 0) {
            console.log("No budgets to renew today.");
            return;
        }

        for (const budget of budgetsToRenew) {
            // Reset current spending & update renewal date
            await Budget.findByIdAndUpdate(
                budget._id,
                { currentAmount: 0, createdAt: new Date() },
                { new: true }
            );

            // Send email notification
            const emailSubject = "Your Budget Has Been Renewed!";
            const emailMessage = `Hello, your budget for <strong>${budget.category}</strong> has been renewed for the next ${budget.duration}.`;

            await sendEmail(budget.userId, emailSubject, emailMessage);
        }

        console.log(`🔄 ${budgetsToRenew.length} budgets renewed successfully and emails sent!`);
    } catch (error) {
        console.error("Error renewing budgets:", error);
    }
};


/**
 * Function to check budgets and notify users 
 */
/**
 * Update Budget Current Amount & Notify Users if Exceeding Limit
 * @param {String} userId - The user's ID
 * @param {String} category - The category of the transaction
 * @param {Number} convertedAmount - The amount in USD
 */
export const updateBudgetAndNotify = async (userId, category, convertedAmount) => {
    try {
        const budget = await Budget.findOne({ userId, category });

        if (budget) {
            budget.currentAmount += convertedAmount;

            // Check if spending exceeds 80% of the budget
            const usagePercentage = (budget.currentAmount / budget.amount) * 100;
            if (usagePercentage >= 80) {
                const user = await User.findById(userId);
                if (user) {
                    const emailSubject = `⚠ Budget Alert: ${budget.category} Spending`;
                    const emailMessage = `
                        <h2>Budget Alert: ${budget.category} Spending</h2>
                        <p>Your spending in <b>${budget.category}</b> is nearing or has exceeded your budget.</p>
                        <p><b>Current Spending:</b> $${budget.currentAmount.toFixed(2)}</p>
                        <p><b>Budget Limit:</b> $${budget.amount.toFixed(2)}</p>
                        <p>Please review your expenses.</p>
                    `;

                    await sendEmail(budget.userId, emailSubject, emailMessage);
                    console.log(`Budget Alert Sent to ${user.email}`);

                }
            }

            await budget.save();
        }
    } catch (error) {
        console.error("Error updating budget and notifying user:", error.message);
    }
};
