import type { Request, Response } from "express";
import { prisma } from "../db/client";
import { userSignIn, userSignUp } from "../types/user.types";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

export const userSignup = async (req:Request, res:Response) => {
  try {
    const result = userSignUp.safeParse(req.body);
    if(!result.success){
      throw new Error("Validation error");
    }

    const isUserExist = await prisma.user.findFirst({
      where:{
        email: result.data.email
      }
    });
    if(isUserExist){
      return res.status(400).json({
        success: false,
        message: "User already exits"
      });
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 5);

    const newUser = await prisma.user.create({
      data:{
        email: result.data.email,
        password: hashedPassword,
        balance: result.data.balance
      }
    });

    res.status(200).json({
      success: true,
      message: "User crated Successfully",
      user: newUser
    });

  } catch (error:any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}


export const userSignin = async (req:Request, res:Response) => {
  try {
    const result = userSignIn.safeParse(req.body);
    if(!result.success){
      throw new Error("Validation error");
    }

    const isUserExist = await prisma.user.findFirst({
      where:{
        email: result.data.email
      }
    });
    if(!isUserExist){
      return res.status(400).json({
        success: false,
        message: "User does not exit"
      });
    }

    const hashedPassword = await bcrypt.compare(result.data.password, isUserExist.password);
    if(!hashedPassword){
      return res.status(400).json({
        success: false,
        message: "Invalid Password"
      });
    }

    const token = jwt.sign({
      userId: isUserExist.id
    }, process.env.JWT_SECRET!)

    res.status(200).json({
      success: true,
      message: "User signedUp successfully",
      token: token
    });

  } catch (error:any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}