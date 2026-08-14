// Este endpoint es un proxy que recibe la request del frontend y la reenvía al backend.
// Luego, propaga la cookie refreshToken que viene del backend al navegador y guarda el accessToken en cookie HttpOnly desde Next.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("Login route: request received");
  const body = await request.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_NESTJS_API_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include", // importante para que la cookie del backend se propague
    },
  );

  if (!res.ok) {
    const error = await res.json();
    return NextResponse.json(error, { status: res.status });
  }

  const data = await res.json(); // { accessToken, email, userName, firstName, lastName }

  // Reenviás la cookie refreshToken que vino del backend al navegador
  const setCookieHeader = res.headers.get("set-cookie");
  //console.log("Login route: setCookieHeader", setCookieHeader);

  const nextRes = NextResponse.json({
    email: data.email,
    userName: data.userName,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  // Guardás el accessToken en cookie HttpOnly desde Next
  const cookieStore = await cookies();
  cookieStore.set("access-token", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutos (igual que tu JWT de NestJS)
    path: "/",
  });
  console.log(
    "Login route: access-token cookie set",
    cookieStore.get("access-token")?.value,
  );

  // Propagás la cookie refreshToken que seteó NestJS
  if (setCookieHeader) {
    nextRes.headers.set("set-cookie", setCookieHeader);
  }

  return nextRes;
}
