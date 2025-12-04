import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoute from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import ConfirmRoutes from './routes/confirmation.route.js'

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
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

// ✔️ Your normal routes
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoute);
app.use("/api/confirm", ConfirmRoutes)

export default app;
