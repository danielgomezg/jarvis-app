"use client";

import { useEffect, useState } from "react";

//Hook personalizado para verificar si el componente se ha hidratado, hidratado = true significa que el componente se ha renderizado en el cliente y podemos acceder a las propiedades del usuario.
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  return hydrated;
}
