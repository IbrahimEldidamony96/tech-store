import "dotenv/config";
import { defineConfig } from "prisma/config";

// ملحوظة: كنا بنستخدم env("DATABASE_URL") من "prisma/config" هنا، لكن الدالة
// دي بترمي PrismaConfigEnvError وقت تحميل الملف نفسه لو المتغيّر مش موجود —
// يعني حتى "prisma generate" (اللي أصلًا مش محتاج اتصال حقيقي بقاعدة بيانات)
// كان بيفشل. والمشكلة إن الـ postinstall hook في package.json بيشغّل
// "prisma generate" فورًا أثناء "npm install"، يعني قبل ما المستخدم يعمل
// "cp .env.example .env" أصلًا (الخطوة 2 في الـ README بعد الخطوة 1: install).
// النتيجة: npm install كان بيفشل بالكامل على أي clone جديد.
// الحل: نقرأ process.env.DATABASE_URL مباشرة (dotenv/config فوق بيحمّل .env
// لو موجود) ونستخدم placeholder صوري لو مش موجود، عشان "generate" يعدي.
// أوامر تانية زي migrate/db seed محتاجة اتصال حقيقي فهتفشل عادي لو الـ
// placeholder لسه موجود — وده الاتصال المتوقع، مش رجوع للمشكلة القديمة.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
