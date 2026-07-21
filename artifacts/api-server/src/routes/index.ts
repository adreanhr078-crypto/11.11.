import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiChatRouter from "./ai-chat";
import userProfileRouter from "./user-profile";
import pushRouter from "./push";
import progressRouter from "./progress";
import argRouter from "./arg";
import { authenticate } from "../middleware/authenticate";

const router: IRouter = Router();

router.use("/healthz", healthRouter);

router.use(authenticate);
router.use("/ai", aiChatRouter);
router.use("/user", userProfileRouter);
router.use("/push", pushRouter);
router.use("/progress", progressRouter);
router.use("/arg", argRouter);

export default router;
