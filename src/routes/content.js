import elastic from "../elastic";
import { Router } from "express";
import { validationResult } from "express-validator";
import { validateGroup, validateCategory, validateGenre } from "../validation";

const router = Router();

// Router middleware, mentioned it before defining routes.
router.use((req, res, next) => next());

// Provide latest content of a specific category
router.get(
  "/:category",
  validateCategory,
  validateGroup,
  validateGenre,

  async (req, res) => {
    try {
      const validation = validationResult(req).throw();
      const { category } = req.params;
      const { genre, group } = req.query;
      let query = { match: { stream_type: category } };
      let sort = [{ discovered_at: { order: "desc" } }];

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

      if (group && group == "popular") {
        sort = [
          { repost_count: { order: "desc" } },
          { view_count: { order: "desc" } },
        ];
      }

      const result = await elastic.search({
        index: "streams_index",
        from: 0,
        size: 20,
        body: { sort, query },
      });

      const result_json = { data: {} };
      // Map relevant data to json
      result_json.data["streams"] = result.body.hits.hits.map((hit) => ({
        id: hit._id,
        ...hit._source,
      }));
      res.json(result_json);
    } catch (error) {
      return res.status(400).json(error);
    }
  }
);

export default router;
