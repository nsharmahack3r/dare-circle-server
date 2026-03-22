import { Router, Response } from "express";
import GameManager from "../game/GameManager";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// All room routes require authentication
router.use(authMiddleware);

// POST /api/rooms — create a new room (authenticated user becomes host)
router.post("/", (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const room = GameManager.createRoom(req.user.userId, req.user.name);
  res.status(201).json(room);
});

// POST /api/rooms/:code/join — join an existing room
router.post("/:code/join", (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const player = GameManager.joinRoom(req.params.code, req.user.userId, req.user.name);
  if (!player) return res.status(404).json({ error: "Room not found or game already started" });

  res.json({ player, room: GameManager.getRoom(req.params.code) });
});

// GET /api/rooms/:code — get room state
router.get("/:code", (req: AuthenticatedRequest, res: Response) => {
  const room = GameManager.getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(room);
});

export default router;
