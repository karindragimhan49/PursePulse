import { StatusCodes } from "http-status-codes";
import { goalSchema } from "../middleware/validator.js";
import Goal from "../models/goalModel.js";
import Transaction from "../models/transactionModel.js"; 
import mongoose from 'mongoose'; // Add this line to import mongoose
import { convertToBaseCurrency , convertFromBaseCurrency } from "../services/currencyService.js";
import { sendEmail } from "../services/emailService.js";

// ----------------------- create goal ------------------------------
export const createGoal = async (req, res) => {
    try {
        const { error, value } = goalSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ msg: error.details[0].message });
        }

        const { name, targetAmount, deadline, currency } = value;
        const BASE_CURRENCY = process.env.BASE_CURRENCY || "LKR";

        // Convert targetAmount to base currency
        const convertedAmount = await convertToBaseCurrency(targetAmount, currency);

        // Create a new goal with converted amount
        const goal = new Goal({
            userId: req.user.userId,
            name,
            targetAmount: convertedAmount,
            deadline,
        });

        await goal.save();

        res.status(StatusCodes.OK).json({
            msg: "Goal created successfully!",
            data: goal,
        });

    } catch (error) {
        console.error("Create Goal Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error creating goal",
            error: error.message,
        });
    }
};

// ----------------------- get goal by user ------------------------------
export const getAllGoalsByUser = async (req, res) => {
    try {
        const userGoals = await Goal.find({ userId: req.user.userId });

        if (userGoals.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "No goals found for this user.",
                data: []
            });
        }

        res.status(StatusCodes.OK).json({
            msg: "User goals retrieved successfully",
            data: userGoals
        });

    } catch (error) {
        console.error("Error fetching user goals:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Something went wrong while retrieving goals",
            error: error.message
        });
    }
};

// ----------------------- update goal ------------------------------
export const updateGoal = async (req, res) => {
    try {
        const { id } = req.params;

        const { error, value } = goalSchema.validate(req.body);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
        }

        const goal = await Goal.findOneAndUpdate(
            { _id: id, userId: req.user.userId },
            value,
            { new: true, runValidators: true }
        );

        if (!goal) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "Goal not found" });
        }

        res.status(StatusCodes.OK).json({ msg: "Goal updated successfully", data: goal });

    } catch (error) {
        console.error("Update Goal Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error updating goal",
            error: error.message
        });
    }
};

// ----------------------- delete goal ------------------------------
export const deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;

        const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user.userId });

        if (!goal) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "Goal not found" });
        }

        res.status(StatusCodes.OK).json({ msg: "Goal deleted successfully" });

    } catch (error) {
        console.error("Delete Goal Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error deleting goal",
            error: error.message
        });
    }
};

// ----------------------- Get Goal Statistics with Progress ------------------------------
export const getGoalStats = async (req, res) => {
  try {

    const goals = await Goal.find({ userId: req.user.userId });

    const totalGoals = goals.length;
    const totalTargetAmount = goals.reduce((acc, goal) => acc + goal.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
    const completedGoals = goals.filter((goal) => goal.status === "Completed").length;
    
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const goalsWithProgress = goals.map((goal) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      return {
        ...goal.toObject(),
        progress: progress > 100 ? 100 : Math.round(progress),
      };
    });
    res.status(StatusCodes.OK).json({
      msg: "Goal statistics retrieved successfully",
      data: {
        totalGoals,
        totalTargetAmount,
        totalCurrentAmount,
        completedGoals,
        completionRate,
       // goals: goalsWithProgress, //  Include goals with progress tracking
      },
    });

  } catch (error) {
    console.error("Error fetching goal stats:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error fetching goal stats",
      error: error.message,
    });
  }
};

// ----------------------- add fund to goal ------------------------------
export const addFundToGoal = async (req, res) => {
  try {
    const { id } = req.params; // Goal ID from request params
    const { amount, currency } = req.body; // Amount and currency from request body
    const userId = req.user.userId; // User ID from the authenticated user

    // Validate the amount
    if (!amount || amount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid amount. Must be greater than 0" });
    }

    // Find the goal by ID and userId
    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Goal not found" });
    }

    // Fetch total available income for the user
    const incomeResult = await Transaction.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId), type: "income" } // Use `new mongoose.Types.ObjectId(userId)`
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Log the aggregated result for debugging purposes
    console.log("Aggregated Income Result:", incomeResult);

    // Calculate available funds (total income)
    const availableFunds = incomeResult.length > 0 ? incomeResult[0].total : 0;
    console.log(`Available Funds: ${availableFunds}`);

    // If the available funds are 0, return an error
    if (availableFunds <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "No income available" });
    }

    // Convert the requested amount to base currency if necessary
    let convertedFundAmount = amount;
    if (currency !== process.env.BASE_CURRENCY) {
      // Assuming `convertToBaseCurrency` function is defined to handle conversion
      convertedFundAmount = await convertToBaseCurrency(amount, currency);
      console.log(`Converted requested amount (${amount} ${currency}) to ${convertedFundAmount} ${process.env.BASE_CURRENCY}`);
    }

    // Check if the user has sufficient available funds
    if (convertedFundAmount > availableFunds) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Insufficient funds to add to goal",
        availableFunds: availableFunds,
        requiredFunds: convertedFundAmount
      });
    }

    // Add the converted amount to the goal's current amount
    goal.currentAmount += convertedFundAmount;

    // If the goal is completed, update the status and send an email
    if (goal.currentAmount >= goal.targetAmount) {
      goal.currentAmount = goal.targetAmount;
      goal.status = "Completed";

      // Send email notification for goal completion
      const subject = "Goal Completed!";
      const message = `Congratulations! You have successfully completed your goal: <strong>${goal.name}</strong>.`;
      await sendEmail(userId, subject, message);
    }

    // Check if the goal is not fulfilled before the deadline
    const currentDate = new Date();
    if (currentDate > goal.deadline && goal.currentAmount < goal.targetAmount) {
      // Send email notification for unfulfilled goal
      const subject = "Goal Not Fulfilled Before Deadline";
      const message = `Your goal <strong>${goal.name}</strong> was not fulfilled before the deadline. Consider reviewing your budget and savings plan.`;
      await sendEmail(userId, subject, message);
    }

    // Save the goal after updating it
    await goal.save();

    // Return success response
    res.status(StatusCodes.OK).json({
      msg: "Goal funded successfully",
      data: goal,
    });

  } catch (error) {
    console.error("Error funding goal:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error funding goal",
      error: error.message,
    });
  }
};