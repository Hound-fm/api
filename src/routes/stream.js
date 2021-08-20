import elastic from "../elastic";
import { ValidationError } from "../middlewares/errorHandler";
import { validationResult } from "express-validator";

async function EpisodeRoute(req, res, next) {
  try {
    const validation = validationResult(req).throw();
    const { id } = req.params;
    const data = await elastic.getById("stream", id);
    if (data) {
      // Return response
      res.json({ data });
    } else {
      next()
    }
  } catch (err) {
    const error = new ValidationError(err, 404);
    next(error);
  }
}


export default EpisodeRoute;
