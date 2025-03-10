import mongoose from "mongoose";

// ✅ Define Settings Schema
const SettingsSchema = new mongoose.Schema(
  {
    categories: [
      {
        name: {
          type: String,
          required: [true, "Category name is required!"],
          unique: true,
        },
        type: {
          type: String,
          enum: ["income", "expense"],
          required: [true, "Category type is required!"],
        },
        description: {
          type: String,
          default: "",
        },
        active: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now, 
        },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Get only active categories
SettingsSchema.statics.getActiveCategories = async function () {
  const settings = await this.findOne().lean();
  return settings?.categories.filter((cat) => cat.active) || [];
};

export default mongoose.model("Settings", SettingsSchema);
