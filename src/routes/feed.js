import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";
import { validationResult } from "express-validator";

async function FeedRoute(req, res, next) {
  try {
    const resolveData = {};

    const data = await elastic.feed();

    if (data && Object.keys(data).length > 0) {
      // Return response
      res.json({ data });
    } else {
      next();
    }
  } catch (err) {
    const error = new ValidationError(err, 404);
    next(error);
  }
}

export default FeedRoute;
