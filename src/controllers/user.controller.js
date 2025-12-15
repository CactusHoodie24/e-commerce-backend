import { createUserService} from "../services/user.service.js";
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

    // Cookie settings - environment aware
    // In production (HTTPS): secure=true, sameSite=None for cross-origin (most cloud deployments)
    // In development (HTTP): secure=false, sameSite=Lax
    // Detect production: check NODE_ENV or if request is via HTTPS (Render uses HTTPS)
    const isProduction = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
    const isSecure = process.env.COOKIE_SECURE !== 'false' && isProduction; // true in production by default
    // Default to 'None' in production for cross-origin support (common in cloud deployments)
    // Use 'Lax' if explicitly set, or if frontend/backend are on same domain
    const sameSiteValue = process.env.COOKIE_SAME_SITE || 
      (isProduction ? 'None' : 'Lax'); // None requires secure: true (which we have in production)
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure, // true in production (HTTPS required for sameSite=None), false in development
      sameSite: sameSiteValue, // None for cross-origin in production, Lax in development
      maxAge: 24 * 60 * 60 * 1000, // 1 day (matches JWT expiration)
      path: '/', // Ensure cookie is available for all paths
      ...(isProduction && process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
    })

     // Send back token + user data (omit password)
    res.status(200).json({
      message: "User created successfully",
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body)
    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Issue token
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Cookie settings - environment aware
    // In production (HTTPS): secure=true, sameSite=None for cross-origin (most cloud deployments)
    // In development (HTTP): secure=false, sameSite=Lax
    // Detect production: check NODE_ENV or if request is via HTTPS (Render uses HTTPS)
    const isProduction = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
    const isSecure = process.env.COOKIE_SECURE !== 'false' && isProduction; // true in production by default
    // Default to 'None' in production for cross-origin support (common in cloud deployments)
    // Use 'Lax' if explicitly set, or if frontend/backend are on same domain
    const sameSiteValue = process.env.COOKIE_SAME_SITE || 
      (isProduction ? 'None' : 'Lax'); // None requires secure: true (which we have in production)
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure, // true in production (HTTPS required for sameSite=None), false in development
      sameSite: sameSiteValue, // None for cross-origin in production, Lax in development
      maxAge: 24 * 60 * 60 * 1000, // 1 day (matches JWT expiration)
      path: '/', // Ensure cookie is available for all paths
      ...(isProduction && process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
    })

    res.json({
      message: "Login successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

