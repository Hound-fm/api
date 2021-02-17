import { param, query } from "express-validator";
import {
  ERROR_INVALID_PAGE,
  ERROR_INVALID_GROUP,
  ERROR_INVALID_GENRE,
  ERROR_INVALID_CATEGORY,
} from '../error';

const groups = ["latest", "popular"];
const categories = ["music", "podcast", "audiobook"];

export const validateGroup = query("group").optional().isIn(groups).withMessage(ERROR_INVALID_GROUP);

export const validateGenre = query("genre")
  .optional()
  .isLength({ min: 2, max: 24 })
  .withMessage(ERROR_INVALID_GENRE)

export const validatePage = query("page")
    .optional()
    .isInt({ min: 1, max: 9 })
    .withMessage(ERROR_INVALID_PAGE)

export const validateCategory = param("category").isIn(categories).withMessage(ERROR_INVALID_CATEGORY)
