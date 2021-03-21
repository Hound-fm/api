import elastic from "../elastic";
import { Router } from "express";
import { ERROR_UKNOWN } from "../error";
import { POPULAR_SCORE } from "../scores";
import { validationResult } from "express-validator";
import {
  validateGroup,
  validateGenre,
  validateCategory,
  validatePageSize,
  validatePageIndex,
} from "../middlewares/validation";

const router = Router();

// Router middleware, mentioned it before defining routes.
router.use((req, res, next) => next());

// Provide latest content of a specific category
router.get(
  "/:category",
  validateGroup,
  validateGenre,
  validateCategory,
  validatePageSize,
  validatePageIndex,
  async (req, res) => {
    try {
      const validation = validationResult(req).throw();
      const { category } = req.params;
      const { genre, group, page_index, page_size } = req.query;

      // Range limits
      const size = page_size || 10;
      const from = (page_index || 0) * size;

      let sort;
      let query = { match: { stream_type: category } };

      if (genre) {
        query = {
          bool: {
            must: [
              query,
              { multi_match: { query: genre, fields: ["genres"] } },
            ],
          },
        };
      }

      if (group && group == "latest") {
        sort = [{ discovered_at: { order: "desc" } }];
      }

      if (group && group == "popular") {
        const function_score = { query, ...POPULAR_SCORE };
        query = { function_score };
      }

      const result = await elastic.search({
        size,
        from,
        index: "streams_index",
        body: { sort, query },
      });

      const result_json = { data: {} };
      // Map relevant data to json
      result_json.data["streams"] = result.body.hits.hits.map((hit) => ({
        id: hit._id,
        ...hit._source,
      }));
      res.json(result_json);
    } catch (errorData) {
      console.info(errorData.body);
      const { errors } = errorData;
      const error =
        errors && errors.length
          ? errors.map((err) => err.msg)[0]
          : ERROR_UKNOWN;
      return res.status(400).json({ error });
    }
  }
);

export default router;
