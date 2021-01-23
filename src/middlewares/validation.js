import { param, query } from "express-validator";

const groups = ["latest", "popular"];
const categories = ["music", "podcast", "audiobook"];

export const validateGroup = query("group").isIn(groups);
export const validateGenre = query("genre")
  .optional()
  .isLength({ min: 2, max: 24 });

export const validateCategory = param("category").isIn(categories);
