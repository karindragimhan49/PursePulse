import { Router } from "express";
const router = Router();

import {
    signup,
    signin,
    signout,
    sendVerificationCode,
    verifyVerificationCode,
    changePassword,
    sendForgotPasswordCode,
    verifyForgotPasswordCode,
    adminCheck,
} from "../controllers/authController.js";

import {
    identifierUser,
    identifierAdmin,
} from "../middleware/identification.js";

// Authentication routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', identifierUser, signout);

// Verification routes
router.patch('/send-verification-code', identifierUser, sendVerificationCode);
router.patch('/verify-verification-code', identifierUser, verifyVerificationCode); // Fixed typo

// Password reset routes
router.patch('/send-forgot-password-code', sendForgotPasswordCode);
router.patch('/verify-forgot-password-code', verifyForgotPasswordCode);
router.patch('/change-password', identifierUser, changePassword);

// Admin check route
router.get('/admin', identifierAdmin, adminCheck);


export default router;
