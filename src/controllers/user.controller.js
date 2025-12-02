import { createUserService, getUsersService } from "../services/user.service.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const createUser = async (req, res) => {
  try {
       const { name, email, password } = req.body;

       // Hash the password
    const saltRounds = 10; // standard value
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Replace plain password with hashed password
    const user = await createUserService({ name, email, password: hashedPassword });

       // Generate JWT token for automatic login
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

     // Send back token + user data (omit password)
    res.status(201).json({
      message: "User created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Issue token
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login successful",
      data: { _id: user._id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

