import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxLength: 1000,
    },
    tags: [
      {
        type: String,
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        required: function () {
          return this.recurring?.isRecurring;
        },
      },
      endDate: {
        type: Date,
        required: function () {
          return this.recurring?.isRecurring;
        },
      },
      lastProcessed: { 
        type: Date, default: null 
      },
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Middleware: Ensure `recurring.frequency` and `recurring.endDate` are properly handled
TransactionSchema.pre("save", function (next) {
  if (!this.recurring.isRecurring) {
    this.recurring.frequency = undefined;
    this.recurring.endDate = undefined;
  }
  next();
});

export default mongoose.model("Transaction", TransactionSchema);
