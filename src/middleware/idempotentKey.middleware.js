// idempotencyMiddleware.js

const idempotencyStore = new Map();

export const idempotencyMiddleware = (req, res, next) => {
  const key = req.header("Idempotency-Key");

  if (!key) {
    return res.status(400).json({
      error: "Idempotency-Key header is required",
    });
  }

  if (idempotencyStore.has(key)) {
    const storedResponse = idempotencyStore.get(key);

    return res.status(storedResponse.status).json(storedResponse.body);
  }

  // Monkey-patch res.json to capture response
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    idempotencyStore.set(key, {
      status: res.statusCode,
      body,
    });

    return originalJson(body);
  };

  next();
};


