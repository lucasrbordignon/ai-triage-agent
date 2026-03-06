import { Router } from "express";
import { ChatController } from "./modules/chat/controller/chat.controller";

const router = Router();
const chatController = new ChatController();

router.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

router.post("/messages", chatController.sendMessage);
router.get("/messages", chatController.getHistory);

router.use("/api", router);

export default router;