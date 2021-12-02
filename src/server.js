import { config } from "dotenv";
// Load config from env file
config();

import hpp from "hpp";
import cors from "cors";
import helmet from "helmet";
import express from "express";
import {
  errorMiddleware,
  errorHandlerMiddleware,
} from "./middlewares/errorHandler";
import cacheMiddleware from "./middlewares/cache";
import rateLimiterMiddleware from "./middlewares/rateLimiter";
import routes from "./routes";

const PORT = process.env.PORT || 3333;

class Server {
  constructor() {
    this.app = express();
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(rateLimiterMiddleware);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(hpp());
    this.app.use(cacheMiddleware);
    this.routes();
    this.server();
  }

  routes() {
    // Init routes
    routes.get.forEach(({ path, route, validators }, i) => {
      this.app.get(path, ...validators, route);
    });
    routes.post.forEach(({ path, route, validators }, i) => {
      this.app.post(path, ...validators, route);
    });
    // Handle 404 error
    this.app.get("*", errorMiddleware);
    // Handle errors
    this.app.use(errorHandlerMiddleware);
  }

  server() {
    this.app.listen(PORT, () => {
      console.info(`Listening: http://localhost:${PORT}`);
    });
  }
}

export default new Server();
