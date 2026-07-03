"use client";

import { toast } from "@saptm/ui";
import { useEffect, useRef } from "react";

type FormToastState = {
  status: "idle" | "success" | "error";
  message?: string;
};

type FormToastProps = {
  state: FormToastState;
  successTitle?: string;
  errorTitle?: string;
};

export function FormToast({
  state,
  successTitle = "Operação concluida",
  errorTitle = "Erro",
}: FormToastProps) {
  const prevStatus = useRef(state.status);

  useEffect(() => {
    if (state.status === "success" && prevStatus.current !== "success") {
      toast.success(state.message ?? successTitle);
    }
    if (state.status === "error" && prevStatus.current !== "error") {
      toast.error(state.message ?? errorTitle, { duration: 8_000 });
    }
    prevStatus.current = state.status;
  }, [state.status, state.message, successTitle, errorTitle]);

  return null;
}
