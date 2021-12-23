import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";
import { validationResult } from "express-validator";

const FEED_MAX_PAGE_SIZE = 25;
const FEED_MAX_PAGES = 40;

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

async function FeedRoute(req, res, next) {
  try {
    const { page } = req.query;

    const FEED_PAGE = clamp(page ? parseInt(page, 10) : 0, 0, FEED_MAX_PAGES);

    const data = await elastic.feed(FEED_PAGE, FEED_MAX_PAGE_SIZE);

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
