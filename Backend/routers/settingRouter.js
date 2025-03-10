import express from "express";
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
} from "../controllers/settingController.js";
import { identifierAdmin, identifierUser } from "../middleware/identification.js";

const router = express.Router();

router.post("/category/create", identifierAdmin, createCategory); 
router.get("/category/",identifierUser, getCategories); 
router.patch("/category/:categoryId", identifierAdmin, updateCategory); 
router.delete("/category/:categoryId", identifierAdmin, deleteCategory); 
export default router;