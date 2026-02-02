import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import imagekit from "../config/imagekit.js";
import fs from "fs";

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: "Wrong credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET USER
export const getUserData = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

// LOGOUT
export const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 0,
  });
  res.json({ success: true });
};

// UPLOAD PROFILE IMAGE
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file" });
    }
    const fileBuffer = fs.readFileSync(req.file.path);
    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: req.file.originalname,
      folder: "/profiles",
    });
    const imageUrl = imagekit.url({
      path: uploadResponse.filePath,
      transformation: [{ width: "200", height: "200", crop: "at_max" }],
    });
    await User.findByIdAndUpdate(req.user._id, { image: imageUrl });
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const user = await User.findById(req.user._id).select("-password");
    res.json({ success: true, user, message: "Profile image updated" });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Upload failed" });
  }
};

// DELETE PROFILE IMAGE
export const deleteProfileImage = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { image: "" });
    const user = await User.findById(req.user._id).select("-password");
    res.json({ success: true, user, message: "Profile image removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to remove image" });
  }
};
