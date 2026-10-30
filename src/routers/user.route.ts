import express from 'express'
import { addBalance, getUserProfile, userSignin, userSignup } from '../controller/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
const userRouter = express.Router();

userRouter.post("/signup", userSignup);
userRouter.post("/signin", userSignin);
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.post("/onramp", authMiddleware, addBalance);

export default userRouter