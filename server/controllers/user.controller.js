import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import imagekit from "../config/imagekit.js";
import fs from "fs";

// ✅ Improved production check
// On Render, NODE_ENV is usually set, but we can also check if we're not on localhost
const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  // ❗ CRITICAL: Must be true for cross-domain cookies to work (Vercel -> Render)
  secure: true, 
  // ❗ CRITICAL: Must be "none" if Frontend and Backend are on different domains
  sameSite: "none", 
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
};

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, cookieOptions);
    return res.json({ success: true, message: "Registered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Wrong credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, cookieOptions);
    return res.json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET USER DATA
export const getUserData = async (req, res) => {
  try {
    // Ensure req.user exists (populated by your auth middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  // Clear cookie with same options used to set it
  res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
  res.json({ success: true, message: "Logged out" });
};

// ... (uploadProfileImage and deleteProfileImage remain the same)
