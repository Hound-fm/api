const DEAFAULT_TIME = 60 * 5; // 5 minutes

const cacheMiddleware = (req, res, next) => {
  // Here you can define period in second, this one is 5 minutes
  const period = DEAFAULT_TIME;

  // Only cache for GET requests
  if (req.method == "GET") {
    res.set("Cache-Control", `public,max-age=${period},immutable`);
  } else {
    // For the other requests set strict no caching parameters
    res.set("Cache-Control", `no-store`);
  }
  // Remember to call next() to pass on the request
  next();
};

// now call the new middleware function in your app

export default cacheMiddleware;
