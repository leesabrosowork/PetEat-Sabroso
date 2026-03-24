import { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const res = await fetch(`${API_URL}/doctors/patients`, {
    headers: { Authorization: auth },
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
