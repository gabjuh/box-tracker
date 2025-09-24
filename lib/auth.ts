import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);
const TOKEN_NAME = 'auth-token';

export interface AuthUser {
  id: number;
  username: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async generateToken(user: AuthUser): Promise<string> {
    return await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
  }

  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const { userId, username } = payload as { userId: number; username: string };
      return { id: userId, username };
    } catch {
      return null;
    }
  }

  static async createUser(username: string, password: string): Promise<AuthUser> {
    const hashedPassword = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword }
    });
    return { id: user.id, username: user.username };
  }

  static async authenticateUser(username: string, password: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await this.verifyPassword(password, user.password))) {
      return null;
    }
    return { id: user.id, username: user.username };
  }

  static async changePassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;

    if (!token) {
      return null;
    }

    return await this.verifyToken(token);
  }

  static async setAuthCookie(user: AuthUser): Promise<void> {
    const token = await this.generateToken(user);
    const cookieStore = await cookies();

    cookieStore.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
  }

  static async clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_NAME);
  }
}