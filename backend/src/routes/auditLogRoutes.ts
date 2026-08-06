import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLogController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", requireAdmin, getAuditLogs);

export default router;
