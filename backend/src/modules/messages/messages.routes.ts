import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware";
import { MessagesController } from "./messages.controller";

const router = Router();
const controller = new MessagesController();

router.use(authenticate);

router.post("/thread", controller.getOrCreateThread);
router.get("/threads", controller.getUserThreads);
router.get("/thread/:threadId", controller.getThreadMessages);
router.post("/", controller.sendMessage);

export default router;
