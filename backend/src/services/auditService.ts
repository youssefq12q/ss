import path from "path";
import fs from "fs";

const AUDIT_LOGS_FILE = path.join(process.cwd(), "audit-logs.json");

export function getAuditLogsFromDisk(): any[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const content = fs.readFileSync(AUDIT_LOGS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading audit logs:", err);
  }
  return [];
}

export function logAuditEvent(userId: string, userEmail: string, action: string, targetResource: string, details: string, ipAddress: string) {
  const logEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    action,
    targetResource,
    details,
    ipAddress
  };
  const logs = getAuditLogsFromDisk();
  logs.unshift(logEntry);
  if (logs.length > 500) logs.pop();
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving audit log:", err);
  }
}
