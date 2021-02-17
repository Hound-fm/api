import { ERROR_404 } from "../error";

const errorMiddleware = (req, res, next) => {
  console.info(res.statusCode);
  res.status(404).json({ error: ERROR_404 });
};

export default errorMiddleware;
