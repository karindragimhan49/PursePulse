import express from "express";
import { getAllUsers, getUserById, updateUser, deleteUser, getAllTransactions, getCounts } from "../controllers/adminController.js";
import { identifierAdmin, identifierUser } from "../middleware/identification.js";

const router = express.Router();

router.get("/users", identifierAdmin, getAllUsers);
router.get("/users/:id", identifierAdmin, getUserById);
router.patch("/user/:id",identifierAdmin, updateUser)
router.delete("/user/:id", identifierAdmin, deleteUser);

router.get("/transactions", identifierAdmin, getAllTransactions);
router.get("/counts",identifierAdmin, getCounts);

export default router;