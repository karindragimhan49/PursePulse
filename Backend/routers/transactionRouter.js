import express from "express";
import { createTransaction, getUserTransaction, getTransactionById, filterUserTransaction, SortTransactionsByTags, updateTransaction, deleteTransaction } from "../controllers/transactionController.js";
import { identifierUser } from "../middleware/identification.js";

const router = express.Router();

// Route for transaction
router.post('/', identifierUser, createTransaction);

router.get("/user", identifierUser, getUserTransaction);
router.get("/", identifierUser, getTransactionById);
router.get("/filt", identifierUser, filterUserTransaction);
router.get("/filt-tags", identifierUser, SortTransactionsByTags);

router.patch("/:id", identifierUser, updateTransaction);
router.delete("/:id", identifierUser, deleteTransaction);




export default router;
