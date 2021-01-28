import hpp from "hpp";
import cors from "cors";
import helmet from "helmet";
import express from "express";
import errorHandler from "./middlewares/errorHandler";
import cacheMiddleware from "./middlewares/cache";
import rateLimiterRedisMiddleware from "./middlewares/rateLimiterRedis";
import { home, content, knowledge } from "./routes";

class Server {
  constructor() {
    this.app = express();
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(rateLimiterRedisMiddleware);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(hpp());
    this.app.use(cacheMiddleware);
    this.server();
    this.routes();
  }

  routes() {
    // API home
    this.app.get("/", home);

    // Get latest aggregated content
    this.app.use("/content", content);

    // Get knowledge from content
    this.app.use("/knowledge", knowledge);

    // Handle 404 error
    this.app.use(errorHandler);
  }

  server() {
    this.app.listen(3333);
  }
}

export default new Server();
