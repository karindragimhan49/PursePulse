import express from "express";
import { createGoal, getAllGoalsByUser, updateGoal, deleteGoal, getGoalStats, addFundToGoal } from "../controllers/goalController.js";
import { identifierUser } from "../middleware/identification.js";

const router = express.Router();

// Route for transaction
router.post('/', identifierUser, createGoal);

router.get("/user", identifierUser, getAllGoalsByUser);
router.get("/stats", identifierUser, getGoalStats);

router.patch("/:id", identifierUser, updateGoal);
router.patch("/:id/fund", identifierUser, addFundToGoal);

router.delete("/:id", identifierUser, deleteGoal);



export default router;