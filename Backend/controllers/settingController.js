import { StatusCodes } from "http-status-codes";
import { categorySchema } from "../middleware/validator.js";
import Settings from "../models/settingModel.js";

// ----------------------- Create a New Category ------------------------------
export const createCategory = async (req, res) => {
  try {
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ categories: [] });
    }

    // ✅ Check if category already exists
    const categoryExists = settings.categories.some((cat) => cat.name === value.name);
    if (categoryExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Category already exists" });
    }

    // ✅ Add the new category
    settings.categories.push({ ...value, createdAt: new Date() });
    await settings.save();

    res.status(StatusCodes.CREATED).json({ msg: "Category added successfully", data: settings.categories });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error adding category", error: error.message });
  }
};

// ----------------------- Get All Categories ------------------------------
export const getCategories = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || settings.categories.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "No categories found" });
    }

    res.status(StatusCodes.OK).json({ msg: "Categories retrieved successfully", data: settings.categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error fetching categories", error: error.message });
  }
};

// ----------------------- Update Category by ID ------------------------------
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Settings not found" });
    }

    // ✅ Find and update category
    const categoryIndex = settings.categories.findIndex((cat) => cat._id.toString() === categoryId);
    if (categoryIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Category not found" });
    }

    settings.categories[categoryIndex] = { ...settings.categories[categoryIndex], ...value };
    await settings.save();

    res.status(StatusCodes.OK).json({ msg: "Category updated successfully", data: settings.categories[categoryIndex] });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error updating category", error: error.message });
  }
};

// ----------------------- Delete Category by ID ------------------------------
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    let settings = await Settings.findOne();
    if (!settings) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Settings not found" });
    }

    const initialLength = settings.categories.length;
    settings.categories = settings.categories.filter((cat) => cat._id.toString() !== categoryId);

    if (initialLength === settings.categories.length) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Category not found" });
    }

    await settings.save();

    res.status(StatusCodes.OK).json({ msg: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error deleting category", error: error.message });
  }
};
