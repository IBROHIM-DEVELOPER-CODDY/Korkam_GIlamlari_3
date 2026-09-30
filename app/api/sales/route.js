import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

export const runtime = "nodejs";
const KEY = "korkam:sales";

export async function GET() {
  try {
    const data = await redis.get(KEY);
    return NextResponse.json(data || []);
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
