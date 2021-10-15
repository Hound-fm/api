import { param, query } from "express-validator";
import {
  ERROR_404,
  ERROR_INVALID_ID,
  ERROR_INVALID_PAGE,
  ERROR_INVALID_GROUP,
  ERROR_INVALID_GENRE,
  ERROR_INVALID_CATEGORY,
} from "../error";

const groups = ["latest", "popular"];
const categories = ["music", "podcast", "audiobook", "sfx"];

const SEARCH_TYPES = [
  "artist",
  "music_recording",
  "podcast_series",
  "podcast_episode",
];

const isHex = (str) => {
  const hex = /[0-9A-Fa-f]{6}/g;
  return hex.test(str);
};

const isClaimID = (str) => str.length === 40 && isHex(str);

export const validateId = param("id")
  .not()
  .isEmpty()
  .trim()
  .custom((value) => isClaimID(value) || Promise.reject(ERROR_404));

export const validateSearchQuery = query("q").optional().not().isEmpty().trim();

export const validateSearchType = query("type")
  .optional()
  .not()
  .isEmpty()
  .trim()
  .isIn(SEARCH_TYPES);

export const validateGroup = query("group")
  .optional()
  .isIn(groups)
  .withMessage(ERROR_INVALID_GROUP);

export const validateGenre = query("genre")
  .optional()
  .isLength({ min: 2, max: 24 })
  .withMessage(ERROR_INVALID_GENRE);

export const validatePageIndex = query("page_index")
  .optional()
  .isInt({ min: 1, max: 9 })
  .withMessage(ERROR_INVALID_PAGE);

export const validatePageSize = query("page_size")
  .optional()
  .isInt({ min: 1, max: 100 })
  .withMessage(ERROR_INVALID_PAGE);

export const validateCategory = param("category")
  .isIn(categories)
  .withMessage(ERROR_INVALID_CATEGORY);
