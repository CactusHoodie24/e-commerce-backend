import express from "express";
import { createUser, loginUser } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/", createUser);        // POST /api/users → signup
router.post("/login", loginUser);    // POST /api/users/login → login
         // optional, GET all users
  // /api/users

export default router;
