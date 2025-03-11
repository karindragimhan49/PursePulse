import { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema, acceptForgotPasswordSchema } from "../middleware/validator.js";
import { doHash, doHashValidation, hmacProcess } from "../utils/hashing.js";
import User  from "../models/userModel.js";
import jwt from "jsonwebtoken";
import transport from "../middleware/sendMail.js";

// ----------------------- sign up ------------------------------
export const signup = async (req, res) =>{
    
    const {name,email,phoneNumber,password} = req.body; 

    try {
        const {error,value} = signupSchema.validate({name,email,phoneNumber,password}); 

        if(error){
            return res.status(401).json({success:false, message: error.details[0].message});
        }

        const existingUser = await User.findOne({email}); 

        if(existingUser){
            return res.status(401).json({success:false, message:"User already exist !"});
        }

        const hashedPassword = await doHash(password, 12);

        const newUser = new User({
            name,
            email,
            phoneNumber,
            password:hashedPassword,
        })

        const result = await newUser.save();
        result.password = undefined;
        res.status(201).json({success:true, message:'Your account has been created successfully',result})

        
    } catch (error) {
        console.log(error)
        
    }
};
// ----------------------- create budget ------------------------------
export const signin = async (req,res) => {
    const {email, password} = req.body;
    try {
        const {error, value} = signinSchema.validate({email,password});

        if(error){
            return res.status(401).json({success:false, message: error.details[0].message});
        }

        const existingUser = await User.findOne({email}).select('+password');

        if(!existingUser){
            return res.status(401).json({success:false, message:"User does not exists !"});
        }

        const result = await doHashValidation(password,existingUser.password)

        if(!result){
            return res.status(401).json({success:false, message:"Invalid credentials !"});
        }

        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            role: existingUser.role,
            verified: existingUser.verified
        },
        process.env.TOKEN_SECRET,
        { expiresIn: "8h" }
    );
    return res.status(200).json({ success: true, token, message: 'Logged in successfully' });

    } catch (error) {
        console.error("Signin Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
        
    }
};

export const signout = async (req,res) => {
    res.clearCookie('Authorization').status(200).json({success:true, message: "logged out successfully"});
}

export const sendVerificationCode = async (req,res) => {
    const {email} = req.body;

    try {
        const existingUser = await User.findOne({email});

        if(!existingUser){
            return res.status(404).json({success:false, message:"User does not exists !"});
        }

        if(existingUser.verified){
            return res.status(400).json({success:false, message:"Your already verified !"});
        }

        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"verification code",
            html: '<div style="text-align: center; font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; border-radius: 10px;">' +
                '<h2 style="color: #007BFF;">Your Verification Code</h2>' +
                '<p style="font-size: 18px; color: #333;">Enter the code below to verify your account:</p>' +
                '<h1 style="display: inline-block; padding: 15px 30px; background: #28a745; color: white; border-radius: 5px;">' +
                codeValue +
                '</h1>' +
                '<p style="margin-top: 20px; font-size: 14px; color: #666;">' +
                'If you didn’t request this code, please ignore this email.' +
                '</p>' +
            '</div>'
        })

        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({success:true, message:"Code sent !"});
        }
        res.status(400).json({success:true, message:"Code sent failed !"});
    } catch (error) {
        console.log(error);
    }
};

export const verifyVerificationCode = async (req, res) => {
    const { email, providedCode } = req.body;

    try {
        const { error, value } = acceptCodeSchema.validate({ email, providedCode });

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation");

        if (!existingUser) {
            return res.status(400).json({ success: false, message: "User does not exist!" });
        }
        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: "You are already verified!" });
        }

        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Code has expired!" });
        }

        const hashedCodeValue = await hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCodeValue === existingUser.verificationCode) {
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Your account has been verified!" });
        }

        return res.status(400).json({ success: false, message: "Invalid verification code!" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const changePassword = async (req,res) => {

    if (!req.User) {
        return res.status(401).json({ success: false, message: "Unauthorized request" });
    }
    const { userId, verified } = req.User;

    const {oldPassword, newPassword} = req.body;

    try {

        const { error, value } = changePasswordSchema.validate({ oldPassword, newPassword });

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        if(!verified){
            return res.status(401).json({ success: false, message: 'You are not verified user'});
        }

        const existingUser = await User.findOne({_id:userId}).select('+password');
        if (!existingUser) {
            return res.status(400).json({ success: false, message: "User does not exist!" });
        }

        const result = await doHashValidation(oldPassword, existingUser.password);
        if (!result) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const hashedPassword = await doHash(newPassword,12);
        existingUser.password = hashedPassword;
        await existingUser.save();

        return res.status(200).json({ success: true, message: "Password updated" });
        
    } catch (error) {
        console.log(error);
    }
};


export const sendForgotPasswordCode = async (req,res) => {
    const {email} = req.body;

    try {
        const existingUser = await User.findOne({email});

        if(!existingUser){
            return res.status(404).json({success:false, message:"User does not exists !"});
        }

        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"Forgot Password code",
            html: '<h1>' + codeValue + '</h1>'
        })

        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({success:true, message:"Code sent !"});
        }
        return res.status(400).json({success:false, message:"Code sent failed !"});
    } catch (error) {
        console.log(error);
    }
};

export const verifyForgotPasswordCode = async (req, res) => {
    const { email, providedCode, newPassword } = req.body;

    try {
        // Validate input
        const { error } = acceptForgotPasswordSchema.validate({ email, providedCode, newPassword });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // Find user and include forgotPasswordCode and validation timestamp
        const existingUser = await User.findOne({ email }).select("+forgotPasswordCode +forgotPasswordCodeValidation");

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User does not exist!" });
        }

        if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: "Invalid or missing reset code!" });
        }

        // Check if the code has expired (valid for 5 minutes)
        const expirationTime = existingUser.forgotPasswordCodeValidation + 5 * 60 * 1000;
        if (Date.now() > expirationTime) {
            return res.status(400).json({ success: false, message: "Code has expired!" });
        }

        // Hash the provided code and compare with stored hash
        const hashedCodeValue = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCodeValue !== existingUser.forgotPasswordCode) {
            return res.status(400).json({ success: false, message: "Incorrect verification code!" });
        }

        // Hash new password and update user
        existingUser.password = await doHash(newPassword, 12);
        existingUser.forgotPasswordCode = undefined;
        existingUser.forgotPasswordCodeValidation = undefined;
        await existingUser.save();

        return res.status(200).json({ success: true, message: "Password reset successfully!" });

    } catch (error) {
        console.error("Error in verifyForgotPasswordCode:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const adminCheck = async (req,res) => {
    return res.status(200).json({ success: true, message: "admin right !" });
}
