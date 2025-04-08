import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    targetAmount: {
        type: Number,
        required: true
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    deadline: {
        type: Date,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
    status: {
        type: String,
        enum: ["In Progress", "Completed"],
        default: "In Progress"
    }
}, { timestamps: true });

export default mongoose.model("Goal", GoalSchema);
