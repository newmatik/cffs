import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, phone, address, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Check for existing user with same email
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A member with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 12);

  const member = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "MEMBER",
      phone: phone || "",
      address: address || "",
    },
  });

  return NextResponse.json(
    { id: member.id, name: member.name, email: member.email },
    { status: 201 }
  );
}
