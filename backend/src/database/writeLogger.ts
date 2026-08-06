import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";

export async function dbWriteLogAndExecute(
  table: string,
  actionName: string,
  req: Request,
  res: Response,
  operation: () => Promise<{ data: any; error: any }>
) {
  console.log(`=======================================================`);
  console.log(`[DB WRITE REQUEST RECEIVED] ${req.method} ${req.path}`);
  console.log(`Action: ${actionName}`);
  console.log(`SQL Table: ${table}`);
  console.log(`Payload:`, JSON.stringify(req.body, null, 2));

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await operation();
      if (!error && data) {
        console.log(`[DB WRITE SUCCESS] Table: ${table} | Insert/Update Result:`, JSON.stringify(data, null, 2));
        console.log(`=======================================================`);
        return data;
      }
      if (error) {
        console.warn(`[DB WRITE SUPABASE WARNING] Table: ${table} | Error:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[DB WRITE SUPABASE EXCEPTION] Table: ${table} | Exception:`, err?.message || err);
    }
  } else {
    console.log(`[DB WRITE INFO] Supabase client is not active. Using in-memory fallback for ${table}.`);
  }

  console.log(`[DB WRITE LOCAL FALLBACK] Table: ${table} | Action: ${actionName}`);
  console.log(`=======================================================`);
  return req.body;
}
