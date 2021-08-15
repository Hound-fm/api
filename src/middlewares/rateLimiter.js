import { RateLimiterMemory } from "rate-limiter-flexible";
import { ERROR_RATE_LIMIT } from "../error"

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1, // per 1 second by IP
  keyPrefix: "middleware",
});

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ error: ERROR_RATE_LIMIT });
    });
};

module.exports = rateLimiterMiddleware;
