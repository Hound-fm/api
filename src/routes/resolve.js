import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";
import { validationResult } from "express-validator";
const RESOLVE_TYPES = [
  "artist",
  "music_recording",
  "podcast_series",
  "podcast_episode",
];
async function ResolveRoute(req, res, next) {
  try {
    const resolveData = {};
    Object.entries(req.body).forEach(([key, value]) => {
      if (RESOLVE_TYPES.includes(key) && value && value.length) {
        resolveData[key] = value;
      }
    });

    const data = await elastic.resolve(resolveData);

    if (data && Object.keys(data).length ) {
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

export default ResolveRoute;
