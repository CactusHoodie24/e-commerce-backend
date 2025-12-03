// routes/webhook.routes.js
import express from "express";
import { handleWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();

router.post("/paychangu", handleWebhook);

export default router;
