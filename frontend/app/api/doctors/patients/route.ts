import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const res = await fetch("http://localhost:8080/doctors/patients", {
    headers: { Authorization: auth },
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
