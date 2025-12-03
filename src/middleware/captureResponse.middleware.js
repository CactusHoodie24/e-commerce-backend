// captureResponse.middleware.js
// Middleware that captures the body of successful (200) JSON responses
// and stores it on `res.locals.capturedResponse` for downstream handlers.

export default function captureResponse(req, res, next) {
  const oldJson = res.json;

  res.json = function (body) {
    try {
      if (res.statusCode === 200) {
        res.locals.capturedResponse = body;
      }
    } catch (e) {
      // ignore capture errors and continue
    }

    return oldJson.call(this, body);
  };

  next();
}
