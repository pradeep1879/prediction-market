import type { Request, Response, NextFunction } from "express";
import * as userService from "./user.service";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.signup(req.body);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.signin(req.body);

    return res.status(200).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};