// app/api/proxy/[...path]/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

//Funcion proxy que recibe la request del frontend y la reenvía al backend, propagando las cookies de refreshToken y accessToken
//params: path: string[] - array de strings que representa la ruta del endpoint del backend al que se quiere acceder; ejemplo: ['profile', '123'] para acceder a /profile/123
async function proxy(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }, // ← Promise
) {
  const { path } = await params; // ← await obligatorio
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access-token")?.value;
  const pathString = path.join("/"); // convierte el array de strings en una ruta de string ejemplo ['profile', '123'] → 'profile/123'
  const url = new URL(request.url); // conserva query strings, ejemplo: /profile/123?includePosts=true

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_NESTJS_API_URL}/${pathString}${url.search}`,
    {
      method: request.method, // método dinámico (GET/POST/PUT/DELETE...)
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // ← el token que el browser NO puede leer
      },
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.text(),
    },
  );

  const data = await res.json();
  const nextRes = NextResponse.json(data, { status: res.status });
  const setCookieHeader = res.headers.get("set-cookie");
  if (setCookieHeader) nextRes.headers.set("set-cookie", setCookieHeader);
  return nextRes;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
