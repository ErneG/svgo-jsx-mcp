import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

export async function GET() {
  const response = await fetch(`${API_URL}/admin/keys`, {
    headers: {
      "X-Admin-Secret": ADMIN_SECRET,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await fetch(`${API_URL}/admin/keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": ADMIN_SECRET,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
