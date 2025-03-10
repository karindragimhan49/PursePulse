import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import Settings from "../models/settingModel.js";
import Budget from "../models/budgetModel.js"
import Transaction from "../models/transactionModel.js";
import { budgetSchema } from "../middleware/validator.js";
import { convertToBaseCurrency , convertFromBaseCurrency } from "../services/currencyService.js";

// ----------------------- create budget ------------------------------
export const setBudget = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = budgetSchema.validate(req.body);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
        }

        const { category, amount, duration, currency } = value;

        // Check if category exists and is active
        const settings = await Settings.findOne();
        if (!settings || settings.categories.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "No categories found. Contact admin." });
        }

        const selectedCategory = settings.categories.find(cat => cat.name === category && cat.active && cat.type === "expense");
        if (!selectedCategory) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid or inactive category" });
        }

        // Convert amount to base currency
        const convertedAmount = await convertToBaseCurrency(amount, currency);

        // Check if a budget already exists for this category & duration
        const existingBudget = await Budget.findOne({
            userId: req.user.userId,
            category,
        });

        if (existingBudget) {
            return res.status(StatusCodes.CONFLICT).json({ msg: "Budget already exists for this category." });
        }

        // Save the new budget
        const budget = new Budget({
            userId: req.user.userId,
            category,
            amount : convertedAmount,
            duration,
        });

        await budget.save();

        res.status(StatusCodes.CREATED).json({
            msg: "Budget set successfully!",
            data: budget,
        });

    } catch (error) {
        console.error("Error setting budget:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error setting budget",
            error: error.message,
        });
    }
};

// ----------------------- update budget ------------------------------
export const updateBudget = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate request body
        const { error, value } = budgetSchema.validate(req.body);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
        }

        const { category, amount, duration, currency } = value;

        // Check if category exists and is active
        const settings = await Settings.findOne();
        if (!settings || settings.categories.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "No categories found. Contact admin." });
        }

        const selectedCategory = settings.categories.find(cat => cat.name === category && cat.active && cat.type === "expense");
        if (!selectedCategory) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid or inactive category" });
        }

        // Convert amount to base currency
        const convertedAmount = await convertToBaseCurrency(amount, currency);

        // Find and update budget
        const updatedBudget = await Budget.findOneAndUpdate(
            { _id: id, userId: req.user.userId }, 
            { category, amount: convertedAmount, duration },
            { new: true, runValidators: true }
        );

        if (!updatedBudget) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "Budget not found" });
        }

        res.status(StatusCodes.OK).json({
            msg: "Budget updated successfully!",
            data: updatedBudget,
        });

    } catch (error) {
        console.error("Error updating budget:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error updating budget",
            error: error.message,
        });
    }
};

// ----------------------- delete budget ------------------------------
export const deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBudget = await Budget.findOneAndDelete({
            _id: id,
            userId: req.user.userId,
        });

        if (!deletedBudget) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "Budget not found" });
        }

        res.status(StatusCodes.OK).json({
            msg: "Budget deleted successfully",
            data: deletedBudget,
        });

    } catch (error) {
        console.error("Error deleting budget:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error deleting budget",
            error: error.message,
        });
    }
};

// ----------------------- fetch all budget ----------------------------
export const getAllBudgets = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.userId;

        // Convert pagination parameters to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Fetch all budgets for the user with pagination
        const budgets = await Budget.find({ userId })
            .skip(skip)
            .limit(limitNumber);

        // Get total count for pagination
        const totalCount = await Budget.countDocuments({ userId });

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limitNumber);

        if (budgets.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "No budgets found." });
        }

        res.status(StatusCodes.OK).json({
            msg: "Budgets retrieved successfully",
            data: budgets,
            pagination: {
                totalCount,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber,
            },
        });

    } catch (error) {
        console.error("Error fetching budgets:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error fetching budgets",
            error: error.message,
        });
    }
};

// ----------------------- fetch budget by filter ----------------------
export const getBudgetByFilter = async (req, res) => {
    try {
        const { category, duration, page = 1, limit = 10, currency } = req.query;
        const userId = req.user.userId;

        // Convert pagination parameters to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Build query object
        let filter = { userId };

        if (category) {
            filter.category = category.trim();
        }
        if (duration) {
            filter.duration = duration.trim();
        }

        console.log("Filter Object:", filter);

        // Fetch budgets based on filters with pagination
        const budgets = await Budget.find(filter)
            .skip(skip)
            .limit(limitNumber);

        // Get total count for pagination
        const totalCount = await Budget.countDocuments(filter);

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limitNumber);

        if (budgets.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "No budgets found for the given filters" });
        }

        // Convert budget amounts if currency is provided
        let convertedBudgets = budgets;

        if (currency) {
            convertedBudgets = await Promise.all(
                budgets.map(async (budget) => {
                    const convertedAmount = await convertFromBaseCurrency(budget.amount, currency);
                    return {
                        ...budget.toObject(),
                        amount: convertedAmount,
                        currency, 
                    };
                })
            );
        }

        res.status(StatusCodes.OK).json({
            msg: "Budgets retrieved successfully",
            data: convertedBudgets,
            pagination: {
                totalCount,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber,
            },
        });

    } catch (error) {
        console.error("Error fetching budgets:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Error fetching budgets",
            error: error.message,
        });
    }
};

// ----------------------- featch budget recomandation ----------------------
export const getBudgetRecommendations = async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Fetch all budgets for the user
      const budgets = await Budget.find({ userId });
  
      if (budgets.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: "No budgets found for the user." });
      }
  
      // Fetch all transactions for the user
      const transactions = await Transaction.find({ userId });
  
      // Calculate current spending for each budget category
      const budgetRecommendations = budgets.map((budget) => {
        const categoryTransactions = transactions.filter(
          (tx) => tx.category === budget.category && tx.type === "expense"
        );
  
        const currentAmount = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const percentage = (currentAmount / budget.amount) * 100;
  
        // Generate recommendation text
        let recommendationText = "";
        if (percentage > 80) {
          recommendationText = `You are spending too much on ${budget.category}. Consider reducing your monthly spending by ${Math.round(percentage - 80)}% to stay within your budget.`;
        } else if (percentage < 50) {
          recommendationText = `You are spending too little on ${budget.category}. Consider reallocating some of your budget to other categories.`;
        } else {
          recommendationText = `Your spending on ${budget.category} is well-balanced. Keep it up!`;
        }
  
        return {
          category: budget.category,
          amount: budget.amount,
          currentAmount,
          duration: budget.duration,
          createdAt: budget.createdAt,
          percentage: Math.round(percentage),
          recommendation: recommendationText,
        };
      });
  
      res.status(StatusCodes.OK).json({
        msg: "Budget recommendations generated successfully",
        data: budgetRecommendations,
      });
    } catch (error) {
      console.error("Error generating budget recommendations:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        msg: "Error generating budget recommendations",
        error: error.message,
      });
    }
  };


  