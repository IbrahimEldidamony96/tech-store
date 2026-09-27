import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { couponUpdateSchema } from "@/lib/validations/coupon";
import { Prisma } from "@/app/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = couponUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ data: coupon });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      }
      if (err.code === "P2002") {
        return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
      }
    }
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  // Order.couponId هو onDelete: SetNull — حذف كوبون مستخدم قبل كده آمن،
  // الأوردرات القديمة بتفضل زي ما هي (discount المحفوظ عليها snapshot
  // مش مشتق من الكوبون وقت العرض)، بس هيفقدوا الربط بمين كان الكوبون ده
  try {
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ data: { id, deleted: true } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    throw err;
  }
}
