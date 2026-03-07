import { Router } from "express";
import { ChatController } from "./modules/chat/controller/chat.controller";
import rateLimit from "express-rate-limit";
import { apiKeyMiddleware } from "./infra/middleware/apiKey.middleware";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20, 
  message: { error: "Muitas requisições. Tente novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();
const chatController = new ChatController();

router.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

router.post("/messages", apiKeyMiddleware, limiter, chatController.sendMessage);
router.get("/messages", apiKeyMiddleware, limiter, chatController.getHistory);

router.use("/api", router);

export default router;