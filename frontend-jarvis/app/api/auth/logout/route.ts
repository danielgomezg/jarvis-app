// Este archivo es un endpoint de logout que se encarga de invalidar el refreshToken en el backend y borrar las cookies de acceso y refreshToken en el frontend.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  const accessToken = cookieStore.get("access-token")?.value;
  //console.log("refresh logout ", accessToken);

  // Avisás al backend para que invalide el refreshToken en DB
  if (refreshToken) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_NESTJS_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Cookie: `refreshToken=${refreshToken}`,
        },
      });
    } catch {
      // Si el backend falla, igual borramos las cookies locales
      console.error("Error al cerrar sesión en el backend");
    }
  }

  // Borrás ambas cookies
  cookieStore.delete("access-token");
  cookieStore.delete("refreshToken");

  return NextResponse.json({ ok: true });
}
