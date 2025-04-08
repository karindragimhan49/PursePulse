import express from "express";
import {
    setBudget,
    updateBudget,
    deleteBudget,
    getAllBudgets,
    getBudgetByFilter,
    getBudgetRecommendations
} from "../controllers/budgetController.js";
import { identifierAdmin, identifierUser } from "../middleware/identification.js";
import { renewBudgets } from "../services/budgetService.js";

const router = express.Router();

router.post("/", identifierUser, setBudget);
router.patch("/:id", identifierUser, updateBudget);
router.delete("/:id", identifierUser, deleteBudget);

router.get("/all", identifierUser, getAllBudgets);
router.get("/filter", identifierUser, getBudgetByFilter);
router.get("/recommendations", identifierUser, getBudgetRecommendations);


// Manually trigger budget renewal (for testing)
router.get("/renew-budgets", async (req, res) => {
    try {
        await renewBudgets();
        res.status(200).json({ msg: "Budget renewal executed successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Error renewing budgets", error: error.message });
    }
});

export default router;