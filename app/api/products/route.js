import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis } from "../../../lib/redis";
import { SEED_PRODUCTS } from "../../../lib/seedProducts";

export const runtime = "nodejs";
const KEY = "korkam:products";

export async function GET() {
  try {
    let data = await redis.get(KEY);
    if (!data) {
      const seeded = SEED_PRODUCTS.map((p) => ({ ...p, id: randomUUID() }));
      await redis.set(KEY, seeded);
      data = seeded;
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Redis ulanmadi. Environment o'zgaruvchilarni tekshiring." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await redis.set(KEY, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Saqlab bo'lmadi." }, { status: 500 });
  }
}
