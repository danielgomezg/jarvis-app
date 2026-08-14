"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useHydrated } from "@/hooks/useHydrated";

export default function Home() {
  const { user } = useAuthStore();
  const hydrated = useHydrated();
  // Capitaliza el nombre del usuario de forma limpia
  const nombreUsuario = user?.firstName?.replace(/^\w/, (c) => c.toUpperCase());

  // Genera la fecha actual: "Viernes, 17 de julio"
  const obtenerFechaActual = () => {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };
    const fecha = new Date().toLocaleDateString("es-ES", opciones);
    return fecha.replace(/^\w/, (c) => c.toUpperCase());
  };

  if (!hydrated) return null;

  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Hola
              {nombreUsuario && `, ${nombreUsuario}`}!
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {obtenerFechaActual()} · ¿Qué cocinamos hoy?
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// <div className="bg-gray-50 border rounded p-4 text-sm space-y-1">
//         <p>
//           <span className="font-medium">Email:</span> {user?.email}
//         </p>
//         <p>
//           <span className="font-medium">Username:</span> {user?.userName}
//         </p>
//         <p>
//           <span className="font-medium">Nombre:</span> {user?.firstName}{" "}
//           {user?.lastName}
//         </p>
//       </div>
