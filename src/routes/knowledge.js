import path from "path";
import elastic from "../elastic";
import { Router } from "express";
import { ERROR_UKNOWN } from "../error"
import { promises as fs } from "fs";
import { validationResult } from "express-validator";

import {
  validateGroup,
  validateCategory,
  validateGenre,
} from "../middlewares/validation";

const knowledge_dir = path.resolve(process.cwd(), "../scrapz/src/data/stats");
const router = Router();

// Router middleware, mentioned it before defining routes.
router.use((req, res, next) => next());

// Provide all latest content
router.get("/:category", validateCategory, validateGroup, async (req, res) => {
  try {
    const validation = validationResult(req).throw();
    const { category } = req.params;
    const { group } = req.query;

    let filePath = `/latest_stats_${category}.json`;

    if (group) {
      filePath = `/${group}_stats_${category}.json`;
    }

    const latest_stats = await fs.readFile(path.join(knowledge_dir, filePath));

    const result_json = JSON.parse(latest_stats);
    return res.json(result_json);
  } catch (errorData) {
    const {errors} = errorData
    const error = (errors && errors.length) ? errors.map(err => err.msg)[0] : ERROR_UKNOWN
    return res.status(400).json({ error });
  }
});

export default router;
