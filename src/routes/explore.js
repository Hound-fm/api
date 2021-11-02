import url from "url";
import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";

export default async function ExploreRoute(req, res, next) {
  try {
    // const validation = validationResult(req).throw();
    // Return response
    const { type, sortBy, genre, size } = req.query;
    // Handle search query
    if (type || sortBy || genre) {
      const results = await elastic.explore(type, sortBy, genre, size);
      res.json({ data: results.responses || results.hits });
    } else {
      // Handle empty search query
      next();
    }
  } catch (err) {
    console.error(err);
    const error = new ValidationError(err, 404);
    next(error);
  }
}
