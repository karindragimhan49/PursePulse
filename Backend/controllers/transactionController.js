import { StatusCodes } from "http-status-codes";
import { transactionSchema } from "../middleware/validator.js";
import Transaction from "../models/transactionModel.js";
import mongoose from "mongoose";
import Settings from "../models/settingModel.js";
import { updateBudgetAndNotify } from "../services/budgetService.js";
import { convertToBaseCurrency, convertFromBaseCurrency } from "../services/currencyService.js";


// ----------------------- Create Transaction with Currency Conversion ------------------------------
export const createTransaction = async (req, res) => {
    try {
        const { error, value } = transactionSchema.validate(req.body);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
        }

        const { type, amount, category, description, tags, date, recurring, currency } = value;

        //  Check if category exists and is active
        const settings = await Settings.findOne();
        if (!settings || settings.categories.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "No categories found. Contact admin." });
        }

        const selectedCategory = settings.categories.find(cat => cat.name === category && cat.active);
        if (!selectedCategory) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid or inactive category" });
        }

        if (selectedCategory.type !== type) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: `Category '${category}' is for '${selectedCategory.type}' transactions only` });
        }

        //  Convert amount to base currency
        let convertedAmount;
        try {
            convertedAmount = await convertToBaseCurrency(amount, currency);
        } catch (conversionError) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error converting currency", error: conversionError.message });
        }

        //  Save transaction with converted amount in USD
        const transaction = new Transaction({
            userId: req.user.userId,
            type,
            amount: convertedAmount,
            category,
            description,
            tags,
            date,
            recurring: {
                isRecurring: recurring.isRecurring,
                frequency: recurring.isRecurring ? recurring.frequency : undefined,
                endDate: recurring.isRecurring ? recurring.endDate : undefined
            }
        });

        await transaction.save();

        //  If transaction is an **expense**, update the budget's `currentAmount` and send alerts
        if (type === "expense") {
            await updateBudgetAndNotify(req.user.userId, category, convertedAmount);
        }

        res.status(StatusCodes.CREATED).json({
            msg: "Transaction added!",
            data: transaction,
        });

    } catch (error) {
        console.error("Create Transaction Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error adding transaction",
            error: error.message
        });
    }
};

// ----------------------- Get All Transactions by User ------------------------------
export const getUserTransaction = async (req, res) => {
    try {
        const userId = req.user.userId;

        const allTransactions = await Transaction.find({ userId });

        if (allTransactions.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "No user transactions found",
            });
        }

        res.status(StatusCodes.OK).json({
            msg: "User transactions retrieved successfully",
            data: allTransactions,
        });
    } catch (error) {
        console.error("Error fetching user transactions:", error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Something went wrong while retrieving transactions",
            error: error.message,
        });
    }
};

// ----------------------- Get Transaction by ID ------------------------------
export const getTransactionById = async (req, res) => {
    try {
        const transactionId = req.params.id || req.query.id;

        if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "Invalid transaction ID",
            });
        }

        const transaction = await Transaction.findOne({
            _id: transactionId,
            userId: req.user.userId,
        });

        if (!transaction) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "Transaction not found",
            });
        }

        res.status(StatusCodes.OK).json({
            msg: "Transaction retrieved successfully",
            data: transaction,
        });
    } catch (error) {
        console.error("Error fetching transaction by ID:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Something went wrong while retrieving transaction",
            error: error.message,
        });
    }
};


// ----------------------- Get Transactions with Filters ------------------------------
export const filterUserTransaction = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Extract filters and pagination params
        const {startDate, endDate, category, type, sortTags, page = 1, limit = 10, currency = "USD" } = req.query;


        let filter = { userId };

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        if (category) {
            filter.category = category;
        }

        if (type) {
            const formattedType = type.trim().toLowerCase();
            if (!["income", "expense"].includes(formattedType)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    msg: "Invalid transaction type. Must be 'income' or 'expense'",
                });
            }
            filter.type = formattedType;
        }

        // Sort transactions by tags (ascending or descending)
        let sortQuery = {};
        if (sortTags) {
            sortQuery.tags = sortTags === "asc" ? 1 : -1;
        }

        // Convert pagination parameters to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Fetch transactions from database
        const transactions = await Transaction.find(filter)
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNumber);

        // Convert transaction amounts using the convertFromUSD function
        const convertedTransactions = [];
        for (let transaction of transactions) {
            const convertedAmount = await convertFromBaseCurrency(transaction.amount, currency);
            convertedTransactions.push({
                ...transaction.toObject(),
                amount:convertedAmount,
                convertedCurrency: currency,
            });
        }

        // Get total count of matching transactions
        const totalTransactions = await Transaction.countDocuments(filter);

        if (transactions.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "No transactions found for the given filters",
            });
        }

        res.status(StatusCodes.OK).json({
            msg: "Transactions retrieved successfully",
            data: convertedTransactions,
            baseCurrency: "USD",
            requestedCurrency: currency,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalTransactions / limitNumber),
                totalTransactions,
                limit: limitNumber,
            },
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Something went wrong while retrieving transactions",
            error: error.message,
        });
    }
};

// ----------------------- Get Transactions by tag  ------------------------------
export const SortTransactionsByTags = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Extract filters and sorting parameters
        const { tags, sortOrder = "asc", page = 1, limit = 10 } = req.query;

        // Convert pagination parameters to numbers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Build the filter query
        let filter = { userId };

        // Filter by tags (convert to lowercase & use `$in`)
        if (tags) {
            const tagsArray = tags.split(",").map(tag => tag.trim().toLowerCase());
            filter.tags = { $in: tagsArray }; 
        }

        // Sorting: Sort by first tag in the array
        let sortQuery = { "tags.0": sortOrder === "asc" ? 1 : -1 };

        // Query the database with filters, sorting, and pagination
        const transactions = await Transaction.find(filter)
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNumber);

        // Get total count of matching transactions
        const totalTransactions = await Transaction.countDocuments(filter);

        if (transactions.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "No transactions found matching the filters",
            });
        }

        res.status(StatusCodes.OK).json({
            msg: "Transactions filtered and sorted successfully",
            data: transactions,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalTransactions / limitNumber),
                totalTransactions,
                limit: limitNumber,
            },
        });
    } catch (error) {
        console.error("Error filtering and sorting transactions by tags:", error);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Something went wrong while retrieving transactions",
            error: error.message,
        });
    }
};

// ----------------------- Update Transaction ------------------------------

export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        //  Validate request body
        const { error, value } = transactionSchema.validate(req.body);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
        }

        const { type, amount, category, description, tags, date, recurring, currency } = value;

        // Fetch system settings
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "System settings not found" });
        }

        //  Check if category exists & matches the type
        const validCategory = settings.categories.find(
            (cat) => cat.name === category && cat.type === type && cat.active
        );
        if (!validCategory) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: `Invalid category: ${category}` });
        }

        // Convert amount to USD
        let convertedAmount;
        try {
            convertedAmount = await convertToBaseCurrency(amount, currency);
        } catch (conversionError) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error converting currency", error: conversionError.message });
        }

        // Retrieve the old transaction (to check if it was an expense)
        const oldTransaction = await Transaction.findOne({ _id: id, userId: req.user.userId });
        if (!oldTransaction) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "Transaction not found" });
        }

        // Update the transaction
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { _id: id, userId: req.user.userId },
            {
                type,
                amount: convertedAmount,
                category,
                description,
                tags,
                date,
                recurring: {
                    isRecurring: recurring.isRecurring,
                    frequency: recurring.isRecurring ? recurring.frequency : undefined,
                    endDate: recurring.isRecurring ? recurring.endDate : undefined,
                },
            },
            { new: true, runValidators: true }
        );

        if (!updatedTransaction) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "Transaction not found" });
        }

        // If transaction type is "expense", update the budget
        if (type === "expense") {
            await updateBudgetAndNotify(req.user.userId, category, convertedAmount, oldTransaction.amount);
        }

        res.status(StatusCodes.OK).json({
            msg: "Transaction updated successfully",
            data: updatedTransaction,
        });

    } catch (error) {
        console.error("Update Transaction Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error updating transaction",
            error: error.message,
        });
    }
};

// ----------------------- delete transaction ------------------------------
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params; 

        const deletedTransaction = await Transaction.findOneAndDelete({
            _id: id,
            userId: req.user.userId
        });

        if (!deletedTransaction) {
            return res.status(StatusCodes.NOT_FOUND).json({
                msg: "Transaction not found",
            });
        }

        res.status(StatusCodes.OK).json({
            msg: "Transaction deleted successfully",
            data: deletedTransaction
        });
    } catch (error) {
        console.error("Delete Transaction Error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error deleting transaction",
            error: error.message
        });
    }
};






