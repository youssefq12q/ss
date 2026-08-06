import { Router } from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/userController";
import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", requireAdmin, getUsers);
router.post("/", requireAdmin, createUser);
router.put("/:id", requireAdmin, updateUser);
router.delete("/:id", requireAdmin, deleteUser);

export default router;
