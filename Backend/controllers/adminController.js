import { StatusCodes } from "http-status-codes";
import { updateUserSchema } from "../middleware/validator.js";
import User  from "../models/userModel.js";
import Transaction from "../models/transactionModel.js"
import Budget from "../models/budgetModel.js";
import Goal from "../models/goalModel.js";


// ----------------------- get all user details  ------------------------------
export const getAllUsers = async (req, res) => {
  try {
    const { role, verified, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (role) filter.role = role.toLowerCase(); 
    if (verified) filter.verified = verified.toLowerCase();

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const users = await User.find(filter)
      .select("-password") 
      .skip(skip) 
      .limit(limitNumber);

    const totalUsers = await User.countDocuments(filter);

    if (users.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "No users found.",
        totalUsers: 0,
        data: [],
      });
    }

    res.status(StatusCodes.OK).json({
      msg: "Users retrieved successfully",
      totalUsers,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalUsers / limitNumber),
      limit: limitNumber,
      data: users,
    });

  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error retrieving users",
      error: error.message,
    });
  }
};

// ----------------------- get user details by id  ------------------------------
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "User not found",
      });
    }

    res.status(StatusCodes.OK).json({
      msg: "User retrieved successfully",
      data: user,
    });

  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error retrieving user",
      error: error.message,
    });
  }
};


// ----------------------- update user role and validate  ------------------------------
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
    }

    const updatedUser = await User.findByIdAndUpdate(id, value, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    }

    res.status(StatusCodes.OK).json({
      msg: "User updated successfully",
      data: updatedUser,
    });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error updating user", error: error.message });
  }
};

// ----------------------- delete user by id  ------------------------------
export const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedUser = await User.findByIdAndDelete(id);
  
      if (!deletedUser) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
      }
  
      res.status(StatusCodes.OK).json({ msg: "User deleted successfully" });
  
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        msg: "Error deleting user",
        error: error.message,
      });
    }
  };


// ----------------------- get all transaction  ------------------------------
export const getAllTransactions = async (req, res) => {
  try {
    const { startDate, endDate, userId, category, type, page = 1, limit = 10 } = req.query;
    
    const queryObject = {};

    if (startDate && endDate) {
      queryObject.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    if (userId) queryObject.userId = userId; 
    if (category) queryObject.category = category;
    if (type) queryObject.type = type;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const transactions = await Transaction.find(queryObject)
      .populate("userId", "name email")
      .sort({ date: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limitNumber);

    const totalTransactions = await Transaction.countDocuments(queryObject);

    res.status(StatusCodes.OK).json({
      msg: "Transactions retrieved successfully",
      totalTransactions,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalTransactions / limitNumber),
      data: transactions,
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error retrieving transactions",
      error: error.message,
    });
  }
};

// ----------------------- count all transactions, budgets, users, and goals ------------------------------
export const getCounts = async (req, res) => {
  try {
    // Count all transactions
    const transactionCount = await Transaction.countDocuments();

    // Count all budgets
    const budgetCount = await Budget.countDocuments();

    // Count all users
    const userCount = await User.countDocuments();

    // Count all goals
    const goalCount = await Goal.countDocuments();

    res.status(StatusCodes.OK).json({
      msg: "Counts retrieved successfully",
      data: {
        transactions: transactionCount,
        budgets: budgetCount,
        users: userCount,
        goals: goalCount,
      },
    });
  } catch (error) {
    console.error("Error retrieving counts:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error retrieving counts",
      error: error.message,
    });
  }
};



  
