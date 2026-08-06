import { Request, Response } from "express";

let sseClients: Response[] = [];

export function broadcastUpdate() {
  sseClients.forEach((client) => {
    try {
      client.write("data: REFRESH\n\n");
    } catch (err) {
      // Ignore write errors to closed sockets
    }
  });
}

export function handleSseConnection(req: Request, res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("data: CONNECTED\n\n");
  sseClients.push(res);

  const heartbeat = setInterval(() => {
    try {
      res.write("data: PING\n\n");
    } catch (err) {
      cleanup();
    }
  }, 25000);

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearInterval(heartbeat);
    sseClients = sseClients.filter((client) => client !== res);
  };

  req.on("close", cleanup);
  req.on("end", cleanup);
  req.on("error", cleanup);
  res.on("close", cleanup);
  res.on("finish", cleanup);
  res.on("error", cleanup);
}
