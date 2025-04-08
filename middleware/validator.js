import Joi from "joi";

export const signupSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(6).max(60).required().email({ tlds: { allow: ['com', 'net'] } }),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(6).required().pattern(new RegExp('^[a-zA-Z0-9@#$%^&+=!*()-_]{6,}$'))
});

export const signinSchema = Joi.object({ 
    email: Joi.string().min(6).max(60).required().email({ tlds: { allow: ['com', 'net'] } }),
    password: Joi.string().min(6).required().pattern(new RegExp('^[a-zA-Z0-9@#$%^&+=!*()-_]{6,}$'))
});

export const acceptCodeSchema = Joi.object({
    email: Joi.string().min(6).max(60).required().email({ tlds: { allow: ['com', 'net'] } }),
    providedCode: Joi.number().required()
});

export const changePasswordSchema = Joi.object({
    newPassword: Joi.string().min(6).required().pattern(new RegExp('^[a-zA-Z0-9@#$%^&+=!*()-_]{6,}$')),
    oldPassword: Joi.string().min(6).required().pattern(new RegExp('^[a-zA-Z0-9@#$%^&+=!*()-_]{6,}$'))
});

export const acceptForgotPasswordSchema = Joi.object({
    email: Joi.string().min(6).max(60).required().email({ tlds: { allow: ['com', 'net'] } }),
    providedCode: Joi.number().required(),
    newPassword: Joi.string().min(6).required().pattern(new RegExp('^[a-zA-Z0-9@#$%^&+=!*()-_]{6,}$'))
});

export const transactionSchema = Joi.object({
    type: Joi.string().valid("income", "expense").required(),
    currency: Joi.string().required(),
    amount: Joi.number().positive().required(),
    category: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    date: Joi.date().required(),
  
    recurring: Joi.object({
        isRecurring: Joi.boolean().required(),
        frequency: Joi.string()
          .valid("daily", "weekly", "monthly")
          .when("isRecurring", {
            is: true,
            then: Joi.required(),
          }),
        endDate: Joi.date()
          .greater("now")
          .when("isRecurring", {
            is: true,
            then: Joi.required(),
          }),
      }).optional(),       
  });


export const goalSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    targetAmount: Joi.number().positive().required(),
    currency: Joi.string().optional(),
    currentAmount: Joi.number().min(0).optional(),
    deadline: Joi.date().greater("now").optional(),
    status: Joi.string().valid("In Progress", "Completed").optional()
});

export const updateUserSchema = Joi.object({
  role: Joi.string().valid("admin", "user").optional(),
  verified: Joi.boolean().optional(),
});

export const categorySchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  type: Joi.string().valid("income", "expense").required(),
  description: Joi.string().max(200).optional(),
  active: Joi.boolean().default(true),
});

export const budgetSchema = Joi.object({
  category: Joi.string().min(3).max(50).required(),
  currency: Joi.string().optional(),
  amount: Joi.number().positive().required(),
  currentAmount: Joi.number().positive(),
  duration: Joi.string().valid("monthly", "weekly", "yearly").required(),
});
