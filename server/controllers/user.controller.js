import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import imagekit from "../config/imagekit.js";
import fs from "fs";

// ✅ Safety check for environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
}

const cookieOptions = {
    httpOnly: true,
    secure: true, // Always true for Render (HTTPS)
    sameSite: "none", // Required for Cross-Origin (Vercel to Render)
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
};

// REGISTER
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password || password.length < 8) {
            return res.status(400).json({ success: false, message: "Invalid data. Password must be 8+ chars." });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, cookieOptions);
        return res.status(201).json({ success: true, message: "Account created" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
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

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, cookieOptions);
        return res.status(200).json({ success: true, message: "Logged in successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET USER
export const getUserData = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        return res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// LOGOUT
export const logoutUser = async (req, res) => {
    res.clearCookie("token", cookieOptions);
    return res.status(200).json({ success: true, message: "Logged out" });
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

        return res.status(200).json({ success: true, user, message: "Profile image updated" });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error(error);
        return res.status(500).json({ success: false, message: error.message || "Upload failed" });
    }
};

// DELETE PROFILE IMAGE
export const deleteProfileImage = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { image: "" });
        const user = await User.findById(req.user._id).select("-password");
        return res.status(200).json({ success: true, user, message: "Profile image removed" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to remove image" });
    }
};
