import express from "express";
import GameManager from "./game/GameManager";

const router = express.Router();

router.post("/rooms", (req, res) => {
  const { name } = req.body;
  const room = GameManager.createRoom(name);
  res.json(room);
});

router.post("/rooms/:code/join", (req, res) => {
  const { name } = req.body;
  const player = GameManager.joinRoom(req.params.code, name);

  if (!player) return res.status(404).send("Room not found");

  res.json(player);
});

router.get("/rooms/:code", (req, res) => {
  const room = GameManager.getRoom(req.params.code);
  res.json(room);
});

export default router;
