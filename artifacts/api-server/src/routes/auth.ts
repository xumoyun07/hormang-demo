import { Router } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable, providerProfilesTable } from "@workspace/db";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  COOKIE_OPTS,
} from "../lib/auth.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

function checkRateLimit(key: string): { blocked: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key) ?? { count: 0 };
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { blocked: true, remaining: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    loginAttempts.delete(key);
  }
  return { blocked: false, remaining: 5 - entry.count };
}

function recordFailedAttempt(key: string) {
  const entry = loginAttempts.get(key) ?? { count: 0 };
  entry.count += 1;
  if (entry.count >= 5) {
    entry.lockedUntil = Date.now() + 5 * 60 * 1000;
  }
  loginAttempts.set(key, entry);
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body as {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      password: string;
      role: "buyer" | "provider";
    };

    if (!firstName || !lastName || !password) {
      res.status(400).json({ error: "Ism, familiya va parol talab qilinadi" });
      return;
    }
    if (!email && !phone) {
      res.status(400).json({ error: "Email yoki telefon talab qilinadi" });
      return;
    }
    if (!["buyer", "provider"].includes(role)) {
      res.status(400).json({ error: "Noto'g'ri rol" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Parol kamida 8 belgidan iborat bo'lishi kerak" });
      return;
    }

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        email
          ? eq(usersTable.email, email)
          : eq(usersTable.phone, phone!)
      )
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Bu email yoki telefon allaqachon ro'yxatdan o'tgan" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(usersTable)
      .values({ firstName, lastName, email, phone, passwordHash, role })
      .returning();

    const safeUser = { ...user, passwordHash: undefined };
    const accessToken = generateAccessToken({ ...user });
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
    res.status(201).json({ user: safeUser, accessToken });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Xatolik yuz berdi. Qayta urinib ko'ring." });
  }
});

router.post("/register/provider-profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { categories, bio, workingHours, preferredLocation } = req.body as {
      categories: string[];
      bio?: string;
      workingHours?: string;
      preferredLocation?: string;
    };

    if (!categories?.length) {
      res.status(400).json({ error: "Kamida bitta kategoriya tanlang" });
      return;
    }

    const existing = await db
      .select({ id: providerProfilesTable.id })
      .from(providerProfilesTable)
      .where(eq(providerProfilesTable.userId, req.user!.id))
      .limit(1);

    if (existing.length > 0) {
      const [profile] = await db
        .update(providerProfilesTable)
        .set({ categories, bio, workingHours, preferredLocation, updatedAt: new Date() })
        .where(eq(providerProfilesTable.userId, req.user!.id))
        .returning();
      res.json({ profile });
      return;
    }

    const [profile] = await db
      .insert(providerProfilesTable)
      .values({ userId: req.user!.id, categories, bio, workingHours, preferredLocation })
      .returning();

    res.status(201).json({ profile });
  } catch (err) {
    console.error("Provider profile error:", err);
    res.status(500).json({ error: "Xatolik yuz berdi. Qayta urinib ko'ring." });
  }
});

router.post("/login", async (req, res) => {
  const { email, phone, password } = req.body as {
    email?: string;
    phone?: string;
    password: string;
  };

  const key = email ?? phone ?? "unknown";
  const { blocked, remaining } = checkRateLimit(key);

  if (blocked) {
    res.status(429).json({ error: `Juda ko'p urinish. ${remaining} soniyadan so'ng qayta urinib ko'ring.` });
    return;
  }

  try {
    if (!password || (!email && !phone)) {
      res.status(400).json({ error: "Email/telefon va parol talab qilinadi" });
      return;
    }

    const condition = email ? eq(usersTable.email, email) : eq(usersTable.phone, phone!);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(condition)
      .limit(1);

    if (!user) {
      recordFailedAttempt(key);
      res.status(401).json({ error: "Email/telefon yoki parol noto'g'ri" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      recordFailedAttempt(key);
      res.status(401).json({ error: "Email/telefon yoki parol noto'g'ri" });
      return;
    }

    clearAttempts(key);

    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user.id));

    const safeUser = { ...user, passwordHash: undefined };
    const accessToken = generateAccessToken({ ...user });
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
    res.json({ user: safeUser, accessToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Xatolik yuz berdi. Qayta urinib ko'ring." });
  }
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: "Refresh token topilmadi" });
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.sub as string))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Foydalanuvchi topilmadi" });
      return;
    }

    const accessToken = generateAccessToken({ ...user });
    const newRefreshToken = generateRefreshToken(user.id);

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTS);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Token yaroqsiz" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Foydalanuvchi topilmadi" });
      return;
    }

    const safeUser = { ...user, passwordHash: undefined };

    if (user.role === "provider") {
      const [profile] = await db
        .select()
        .from(providerProfilesTable)
        .where(eq(providerProfilesTable.userId, user.id))
        .limit(1);
      res.json({ user: safeUser, providerProfile: profile ?? null });
      return;
    }

    res.json({ user: safeUser, providerProfile: null });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Xatolik yuz berdi" });
  }
});

export default router;
