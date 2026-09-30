import { Redis } from "@upstash/redis";

// Vercel Marketplace'dagi Upstash Redis integratsiyasi loyihaga quyidagi
// environment o'zgaruvchilarni avtomatik qo'shadi. Agar nomlar boshqacha bo'lsa
// (masalan KV_REST_API_URL / KV_REST_API_TOKEN), Project Settings > Environment
// Variables bo'limida shu ikki nomga moslab qo'shing:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
