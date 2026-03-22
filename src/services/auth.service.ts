import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user/model";
import { RegisterInput, LoginInput } from "../models/user/schema";

const JWT_SECRET = process.env.JWT_SECRET || "truth-dare-secret-key";
const JWT_EXPIRES_IN = "7d";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
}

export interface AuthResult {
  user: { id: string; name: string; email: string };
  token: string;
}

export class AuthService {
  generateToken(user: IUser): string {
    const payload: AuthTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  async register(data: RegisterInput): Promise<AuthResult> {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new Error("Email already registered");
    }

    const user = await User.create(data);

    return {
      user: { id: user._id.toString(), name: user.name, email: user.email },
      token: this.generateToken(user),
    };
  }

  async login(data: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = await user.comparePassword(data.password);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    return {
      user: { id: user._id.toString(), name: user.name, email: user.email },
      token: this.generateToken(user),
    };
  }

  verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  }
}

export const authService = new AuthService();
