import url from "url";
import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";

export async function AutocompleteRoute(req, res, next) {
  try {
    // const validation = validationResult(req).throw();
    // Return response
    const { q } = req.query;
    // Handle search query
    if (q && q.length) {
      const results = await elastic.autocomplete(q);
      res.json({ data: results });
    } else {
      // Handle empty search query
      next();
    }
  } catch (err) {
    console.info(err);
    const error = new ValidationError(err, 404);
    next(error);
  }
}
