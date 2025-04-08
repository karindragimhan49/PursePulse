import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", required: true },
    reportType: { 
        type: String, 
        enum: ["monthly", "yearly", "custom"], 
        required: true },
    startDate: { 
        type: Date, 
        required: true },
    endDate: { 
        type: Date, 
        required: true },
    totalIncome: { 
        type: Number, 
        required: true },
    totalExpense: { 
        type: Number, 
        required: true },
    categoryBreakdown: { 
        type: Object, 
        required: true }, // JSON object for category-wise summary
    generatedAt: { 
        type: Date, 
        default: Date.now },
  }
);

export default mongoose.model("Report", ReportSchema);
