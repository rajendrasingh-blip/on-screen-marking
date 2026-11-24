import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

export const signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "all fields are required." })
        }
        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email already registered.", data: existingUser })
        }
        const hashedPassword = await bcrypt.hash(password, 12);

        const response = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            isActive: true
        })

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            data: {
                id: response._id,
                name: response.name,
                email: response.email,
                role: response.role,
                isActive: response.isActive
            }
        });
    }
    catch (error) {
        console.error(error, 'signup controller error');
        res.status(500).json({
            success: false,
            message: "controller error to create user",
        });
    }
}

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "email and password both are required." })
        }
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");

        if (!user) {
            return res.status(401).json({ success: false, message: "invalid email or password" })
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Your account is not active. Contact admin." })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "invalid email or password" })
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not configured.");
        }
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            secret,
            { expiresIn: "8h" }
        )

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 8 * 60 * 60 * 1000,
            path: "/"
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error(error, '"Login controller error');
        res.status(500).json({
            success: false,
            message: "Unable to login.",
        });
    }
}

export const currentUser = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.accessToken;
        const secret = process?.env?.JWT_SECRET;

        if (!token) {
            return res.status(401).json({ success: false, message: "Token missing, please login again." })
        }
        if (!secret) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as { id: string; role: string };

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "current user noy found" });
        }
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        })
    }
    catch (error) {
        console.error(error, "current user controller error");
        res.status(500).json({ success: false, message: "current user controller error" });
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 8 * 60 * 60 * 1000,
            path: "/"
        });

        res.status(200).json({ success: true, message: "user logout successfully." })
    }
    catch (error) {
        console.error(error, "logout controller error");
        res.status(500).json({ success: false, message: "logout controller error" });
    }
}

export const getAllUser = async (req: Request, res: Response) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })

        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        console.error(error, "get all user controller error");
        res.status(500).json({ success: false, message: "get all user controller error" });
    }
}

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id, role } = req.body;
        console.log(req.body, 'req.body');
        const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true })
            .select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "user is not found" });
        }

        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        console.error(error, "controller error to updating user role.");
        res.status(500).json({ success: false, message: "controller error to updating user role." });
    }
}