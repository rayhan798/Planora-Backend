// src/app/utils/seed.ts
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";

const SALT_ROUNDS = 10;

export const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL!;
    const password = process.env.SUPER_ADMIN_PASSWORD!;

    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log("✅ Super Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        isDeleted: false,
        emailVerified: true,
      },
    });

    console.log("🔥 Super Admin created:", admin.email);
  } catch (error) {
    console.error("❌ Seed error:", error);
  }
};