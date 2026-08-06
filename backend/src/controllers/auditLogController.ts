import { Request, Response } from "express";
import { getAuditLogsFromDisk } from "../services/auditService";

export function getAuditLogs(req: Request, res: Response) {
  const logs = getAuditLogsFromDisk();
  res.json(logs);
}
