import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { registerSchema, loginSchema } from "../models/user/schema";

export class AuthController {
  register = async (req: Request, res: Response) => {
    const validated = registerSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error });
    }

    try {
      const result = await authService.register(validated.data);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(409).json({ error: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    console.log(req.body);
    const validated = loginSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error });
    }

    try {
      const result = await authService.login(validated.data);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  };

  me = async (req: any, res: Response) => {
    res.json({ user: req.user });
  };
}

export const authController = new AuthController();
