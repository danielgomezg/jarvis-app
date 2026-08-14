// middleware que corre en el servidor y se ejecuta antes de cada request, para proteger rutas privadas y públicas según el token de acceso
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que NO requieren estar logueado
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/verify-email",
  "/verificated", // tu ruta de verificación de token
  "/oauth-success",
];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("access-token")?.value;
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname.includes(route), //pathname.startsWith(route),
  );

  /*console.log("Middleware: token", token);
  console.log("Middleware: isPublicRoute", isPublicRoute);
  console.log("Middleware: path ", pathname);*/

  // Sin token intentando acceder a ruta privada → login
  if (!token && !isPublicRoute) {
    //console.log("Middleware: opcion 1");
    const refreshTokenExist = request.cookies.get("refreshToken")?.value;
    if (refreshTokenExist) {
      //console.log("Middleware: refreshToken existe, redirigiendo a /api/auth/refresh",);
      //ACA
      const refreshResponse = await tryRefreshToken(request, refreshTokenExist);
      //console.log("Middleware: refreshResponse");
      if (refreshResponse?.ok) {
        console.log("Middleware: refreshResponse RENOVADO");
        return NextResponse.next();
      } else {
        console.log("Middleware: refreshResponse FALLIDO");
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Con token intentando acceder a ruta pública → dashboard
  if (token && isPublicRoute) {
    //console.log("Middleware: opcion 2");
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // En qué rutas corre el middleware
  // Este matcher excluye archivos estáticos, imágenes, y APIs
  //matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|assets|.well-known).*)",
  ],
};

async function tryRefreshToken(request: NextRequest, refreshToken: string) {
  try {
    // console.log("Middleware: tryRefreshToken");
    const res = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
    });

    return res;
  } catch {
    //console.log("Middleware: tryRefreshToken error");
    return null;
  }
}
