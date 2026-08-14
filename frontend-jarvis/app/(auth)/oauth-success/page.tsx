"use client";
import { useEffect } from "react";
import { useRefresh } from "@/hooks/auth/useRefresh";
import SpinnerCustom from "@/components/SpinnerCustom";

export default function OAuthSuccessPage() {
  const { refresh } = useRefresh();

  const userLoad = async () => {
    try {
      await refresh();
      //setUser(res);
      window.location.href = "/";
    } catch (error) {
      //si hubo algun error en el refresh, se redirige a la pagina de login
      console.error("Error al refrescar tokens:", error);
      window.location.href = "/login";
    }
  };
  useEffect(() => {
    userLoad();
  }, []);

  return <SpinnerCustom classNameSpinner="size-16" />;
}
