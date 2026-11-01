import express from 'express';
import * as splitMergeController from './split.controller'
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();

router.post("/:marketId/split", authMiddleware, splitMergeController.splitMarket)


export default router