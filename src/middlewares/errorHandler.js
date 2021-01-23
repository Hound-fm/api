import { ERROR_404 } from "../error";

const errorMiddleware = (req, res, next) => {
  res.status(404).json({ error: ERROR_404 });
};

export default errorMiddleware;
