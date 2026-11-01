import express from 'express'
import * as depositeController from './deposite.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();

router.post("/", authMiddleware, depositeController.deposite)


export default router;
