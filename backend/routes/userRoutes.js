import express from 'express'
import rateLimit from 'express-rate-limit'
import { getUserProfile, loginUser, registerUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const userRouter=express.Router();

// Limit repeated login/register attempts from the same IP
// (protects against brute-force / credential-stuffing attacks)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window per IP
    message: { message: "Too many attempts. Please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

userRouter.post('/register', authLimiter, registerUser)
userRouter.post('/login', authLimiter, loginUser)

//protected route as token will be generated
userRouter.get('/profile',protect,getUserProfile)

export default userRouter