import crypto from "crypto";
import { Request, Response } from "express";
import { getSupabase } from "../config/supabase";
import { dbWriteLogAndExecute } from "../database/writeLogger";
import { broadcastUpdate } from "../services/sseService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getOrders(req: Request, res: Response) {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: dbOrders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!error && dbOrders) {
        let dbItems: any[] | null = null;
        try {
          const resItems = await supabase.from("order_items").select("*");
          dbItems = resItems.data;
        } catch {
          // ignore order_items fetch failure
        }

        const itemsMap: Record<string, any[]> = {};
        if (dbItems) {
          dbItems.forEach((item: any) => {
            if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
            itemsMap[item.order_id].push({
              product: {
                id: item.product_id || "prod-item",
                name: item.name || "Product",
                price: Number(item.price),
                image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
                categoryId: "rings",
                categoryName: "Rings"
              },
              quantity: Number(item.quantity || 1),
              selectedSize: item.size || "Standard",
              selectedMaterial: item.material || "Gold"
            });
          });
        }

        const mapped = dbOrders.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number || o.id,
          userEmail: o.email || o.user_id || "customer@vero.com",
          date: o.created_at,
          createdAt: o.created_at,
          total: Number(o.total || 0),
          status: o.status || "Processing",
          trackingStatus: o.status || "Order Placed",
          shippingName: o.shipping_name || "Customer",
          shippingEmail: o.email || o.user_id || "customer@vero.com",
          shippingAddress: typeof o.shipping_address === "string" ? o.shipping_address : (o.shipping_address?.address || "Cairo, Egypt"),
          shippingCity: o.shipping_city || "Cairo",
          shippingZip: o.shipping_zip || "11511",
          shippingPhone: o.shipping_phone || "",
          paymentMethod: o.payment_method || "cash",
          earnedPoints: Number(o.earned_points || 0),
          items: itemsMap[o.id] || []
        }));

        return res.json(mapped);
      }
    }
  } catch (err: any) {
    console.warn("[Supabase Fetch Warning] /api/orders:", err?.message || err);
  }

  return res.json([]);
}

export async function createOrder(req: AuthenticatedRequest, res: Response) {
  const newOrder = req.body;
  const orderId = newOrder.id || `order-${Date.now()}`;
  const userEmail = newOrder.shippingEmail || newOrder.userEmail || req.user?.email || "guest@vero.com";
  const userId = req.user?.userId || userEmail;

  await dbWriteLogAndExecute("orders", "Create Order", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("orders").insert([
      {
        id: orderId,
        order_number: orderId,
        user_id: userId,
        email: userEmail,
        shipping_name: newOrder.shippingName || newOrder.shippingAddress?.fullName || "Valued Customer",
        shipping_address: newOrder.shippingAddress?.address || newOrder.shippingAddress || "Cairo",
        shipping_city: newOrder.shippingCity || newOrder.shippingAddress?.city || "Cairo",
        shipping_zip: newOrder.shippingZip || newOrder.shippingAddress?.postalCode || "11511",
        shipping_phone: newOrder.shippingPhone || newOrder.shippingAddress?.phone || null,
        payment_method: newOrder.paymentMethod || "cash",
        payment_status: "pending",
        status: newOrder.status || "Processing",
        subtotal: Number(newOrder.subtotal || newOrder.total || 0),
        shipping_cost: Number(newOrder.shippingFee || 0),
        discount: Number(newOrder.discount || 0),
        total: Number(newOrder.total || 0),
        earned_points: Number(newOrder.earnedPoints || Math.floor(Number(newOrder.total || 0) / 100)),
        customer_notes: newOrder.shippingAddress?.notes || ""
      }
    ]).select().single();
  });

  if (res.headersSent) return;

  if (newOrder.items && newOrder.items.length > 0) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const itemRows = newOrder.items.map((item: any) => ({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: item.product?.id || "prod-item",
          name: item.product?.name || "Luxury Item",
          price: Number(item.product?.price || 0),
          quantity: Number(item.quantity || 1),
          size: item.selectedSize || "Standard",
          material: item.selectedMaterial || "Gold"
        }));
        await supabase.from("order_items").insert(itemRows);
      }
    } catch (e) {
      console.warn("Could not insert order items to Supabase:", e);
    }
  }

  broadcastUpdate();
  res.json({ ...newOrder, id: orderId });
}

export async function updateOrder(req: Request, res: Response) {
  const orderId = req.params.id;
  const updated = req.body;

  const data = await dbWriteLogAndExecute("orders", "Update Order Status", req, res, async () => {
    const supabase = getSupabase()!;
    return await supabase.from("orders").update({ status: updated.status }).eq("id", orderId).select().single();
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json(data);
}

export async function deleteOrder(req: Request, res: Response) {
  const orderId = req.params.id;

  await dbWriteLogAndExecute("orders", "Delete Order", req, res, async () => {
    const supabase = getSupabase()!;
    await supabase.from("order_items").delete().eq("order_id", orderId);
    return await supabase.from("orders").delete().eq("id", orderId);
  });

  if (res.headersSent) return;
  broadcastUpdate();
  res.json({ success: true, deletedId: orderId });
}
