import { Router } from "express";
import { Department } from "@repo/shared";

const router = Router();

router.get("/health", (_, res) => {
  res.json({ status: Department.SALES });
});

router.use("/api", router);

export default router;