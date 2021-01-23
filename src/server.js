import helmet from "helmet";
import express from "express";

import cors from "cors";
import { home, content, knowledge } from "./routes";

class Server {
  constructor() {
    this.app = express();
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
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
  }

  server() {
    this.app.listen(3333);
  }
}

export default new Server();
