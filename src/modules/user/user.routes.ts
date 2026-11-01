import express from "express";
import * as userController from "./user.controller";

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/signin", userController.signin);

export default router;