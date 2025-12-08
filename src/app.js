import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoute from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import ConfirmRoutes from './routes/confirmation.route.js'
import authenticateUser from "./middleware/auth.middleware.js";
import cookieParser from "cookie-parser";


const app = express();

// CORS configuration - supports different origins for development and production
// Development: defaults to http://localhost:5173
// Production: Set ALLOWED_ORIGINS in .env (comma-separated for multiple origins)
// Example: ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    // Support multiple origins separated by commas
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  // Default to development origin if not set
  return ["http://localhost:5173"];
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));


// ✔️ First define webhook route with raw body capture (needs raw bytes for HMAC)
app.use(
  "/webhook",
  express.raw({ type: "*/*" }),
  (req, _res, next) => {
    req.rawBody = req.body; // store buffer so middleware/controllers can reuse it
    next();
  },
  webhookRoutes
);

// ✔️ Now enable normal JSON parsing for your entire API
app.use(express.json());

app.use(cookieParser());

// ✔️ Your normal routes
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoute);
app.use("/api/confirm", ConfirmRoutes)

app.get("/api/auth/me", authenticateUser, (req, res) => {
  // req.user is added by JWT middleware after verifying token
  res.json({ user: req.user });
});


app.post('/api/users/test', (req, res) => {
  res.json({ message: 'Test route works' });
});


export default app;
