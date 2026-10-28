import express from 'express'
import { userSignin, userSignup } from '../controller/user.controller';
const userRouter = express.Router();

userRouter.post("/signup", userSignup);
userRouter.post("/signin", userSignin);

export default userRouter