import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiChatRouter from "./ai-chat";
import userProfileRouter from "./user-profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiChatRouter);
router.use(userProfileRouter);

export default router;
