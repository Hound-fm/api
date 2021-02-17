import elastic from "../elastic";
import { Router } from "express";
import { ERROR_UKNOWN } from "../error";
import { validationResult } from "express-validator";
import {
  validatePage,
  validateGroup,
  validateGenre,
  validateCategory,
} from "../middlewares/validation";

const router = Router();

// Router middleware, mentioned it before defining routes.
router.use((req, res, next) => next());

// Provide latest content of a specific category
router.get(
  "/:category",
  validateCategory,
  validateGroup,
  validateGenre,
  validatePage,
  async (req, res) => {
    try {
      const validation = validationResult(req).throw();
      const { category } = req.params;
      const { genre, group, page } = req.query;
      const pageIndex = page || 0;
      const pageSize = 10;

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
        sort = [
          { view_count: { order: "desc" } },
          { repost_count: { order: "desc" } },
        ];
      }

      const result = await elastic.search({
        index: "streams_index",
        from: pageSize * pageIndex,
        size: pageSize,
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
