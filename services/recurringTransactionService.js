import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import { sendEmail } from "./emailService.js";
import mongoose from "mongoose";

/**
 * Generate the next transaction date based on frequency
 */
const getNextTransactionDate = (lastDate, frequency) => {
  const nextDate = new Date(lastDate);
  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  return nextDate;
};

/**
 * Process all recurring transactions
 */
export const processRecurringTransactions = async () => {
  try {
    const today = new Date();

    // Fetch all active recurring transactions
    const recurringTransactions = await Transaction.find({
      "recurring.isRecurring": true,
      "recurring.endDate": { $gte: today },
    });

    if (!recurringTransactions.length) {
      console.log("No recurring transactions to process today.");
      return;
    }

    for (const transaction of recurringTransactions) {
      const nextDate = getNextTransactionDate(transaction.date, transaction.recurring.frequency);

      // Check if the transaction needs to be created today
      if (nextDate <= today) {
        // Create a new transaction entry
        const newTransaction = new Transaction({
          ...transaction.toObject(),
          _id: new mongoose.Types.ObjectId(), // Generate a new ID
          date: nextDate,
          recurring: { ...transaction.recurring, lastProcessed: today }, // Update last processed date
        });

        await newTransaction.save();

        // Update lastProcessed date
        await Transaction.findByIdAndUpdate(transaction._id, {
          "recurring.lastProcessed": today,
        });

        console.log(`Recurring transaction created for user ${transaction.userId}: ${transaction.category}`);
      }
    }

    console.log("Recurring transactions processed successfully.");
  } catch (error) {
    console.error("Error processing recurring transactions:", error.message);
  }
};

/**
 * Notify users of upcoming recurring transactions
 */
export const notifyUpcomingTransactions = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1); // Notify one day before

    // Find transactions that are due tomorrow
    const upcomingTransactions = await Transaction.find({
      "recurring.isRecurring": true,
      date: tomorrow,
    });

    if (!upcomingTransactions.length) {
      console.log("No upcoming transactions to notify.");
      return;
    }

    for (const transaction of upcomingTransactions) {
      const user = await User.findById(transaction.userId);
      if (!user) continue;

      const emailSubject = `🔔 Reminder: Upcoming Recurring Transaction`;
      const emailMessage = `
        <h2>Upcoming Transaction Alert</h2>
        <p>You have a scheduled transaction for <b>${transaction.category}</b> on ${transaction.date.toDateString()}.</p>
        <p>Amount: ${transaction.amount} ${transaction.currency}</p>
      `;

      await sendEmail(user.email, emailSubject, emailMessage);
      console.log(`Notification sent to ${user.email} for upcoming transaction.`);
    }

  } catch (error) {
    console.error("Error sending transaction notifications:", error.message);
  }
};

/**
 * Notify users of missed transactions
 */
export const notifyMissedTransactions = async () => {
  try {
    const today = new Date();

    // Find recurring transactions that were not processed
    const missedTransactions = await Transaction.find({
      "recurring.isRecurring": true,
      "recurring.lastProcessed": { $lt: today }, // Last processed date is not today
      date: { $lt: today }, // Should have been processed
    });

    if (!missedTransactions.length) {
      console.log(" No missed transactions to notify.");
      return;
    }

    for (const transaction of missedTransactions) {
      const user = await User.findById(transaction.userId);
      if (!user) continue;

      const emailSubject = `⚠ Missed Recurring Transaction`;
      const emailMessage = `
        <h2>Missed Transaction Alert</h2>
        <p>Your scheduled transaction for <b>${transaction.category}</b> on ${transaction.date.toDateString()} was not processed.</p>
        <p>Please check your account.</p>
      `;

      await sendEmail(user.email, emailSubject, emailMessage);
      console.log(`Missed transaction notification sent to ${user.email}`);
    }

  } catch (error) {
    console.error(" Error notifying missed transactions:", error.message);
  }
};
