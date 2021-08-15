import { ERROR_UKNOWN, ERROR_404 } from "../error";

export class RouterError extends Error {
  constructor(message, statusCode = 404) {
    super(message);
    this.name = "RouterError";
    this.message = message;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends Error {
  constructor(errorData, statusCode = 404) {
    super();
    const { errors } = errorData;
    const message =
      errors && errors.length ? errors.map((err) => err.msg)[0] : ERROR_UKNOWN;
    this.name = "ValidatorError";
    this.message = message;
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (req, res, next) => {
  const error = new RouterError(ERROR_404, 404);
  next(error);
};

export const errorHandlerMiddleware = (err, req, res, next) => {
  if (err && err.statusCode) {
    res.status(err.statusCode);
  }
  res.json({ error: { status: err.statusCode, message: err.message } });
};
