import express from "express";
import { generateReport, generateSummaryReport } from "../controllers/reportController.js";
import { identifierUser } from "../middleware/identification.js";

const router = express.Router();

router.get("/trends", identifierUser, generateReport);
router.get("/filter", identifierUser, generateSummaryReport)

export default router;
