import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiChatRouter from "./ai-chat";
import userProfileRouter from "./user-profile";
import pushRouter from "./push";
import progressRouter from "./progress";
import argRouter from "./arg";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiChatRouter);
router.use(userProfileRouter);
router.use(pushRouter);
router.use(progressRouter);
router.use(argRouter);

export default router;
