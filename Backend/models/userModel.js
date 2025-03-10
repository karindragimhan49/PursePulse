import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!'],
        trim: true,
        minLength: [3, 'Name must be at least 3 characters long.']
    },
    email:{
        type: String,
        required: [true,'Email is required !'],
        trim: true,
        unique: [true, "Email must be unique"],
        minLength: [5,"Email must have 5 character"],
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required!'],
        trim: true,
        unique: true,
        minLength: [10, 'Phone number must be at least 10 digits.']
    },
    password:{
        type:String,
        required: [true,"password must be provided !"],
        trim: true,
        select: false
    },
    profilePicture: {
        type: String, 
        default: 'default-profile.png'
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    verified:{
        type:Boolean,
        default:false,
    },
    verificationCode:{
        type:String,
        select:false,
    },
    verificationCodeValidation:{
        type:Number,
        select:false,
    },
    forgotPasswordCode:{
        type:String,
        select:false,
    },
    forgotPasswordCodeValidation:{
        type:Number,
        select:false,
    },
},{
    timestamps: true
});

export default mongoose.model("User", userSchema);