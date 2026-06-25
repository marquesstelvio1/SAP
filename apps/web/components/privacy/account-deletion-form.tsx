"use client";

import { privacyDeleteInputSchema, privacyDeleteOutputSchema } from "@saptm/rpc";
import { Button, Field, FieldDescription, FieldError, FieldGroup, Input } from "@saptm/ui";
import { useState } from "react";
import { rpcPost } from "../../lib/rpc-client";

const REQUIRED_CONFIRMATION = "CONFIRM_DELETE_MY_ACCOUNT";

type Feedback = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export type AccountDeletionFormProps = {
  viewerEmail: string;
};

export function AccountDeletionForm({ viewerEmail }: AccountDeletionFormProps) {
  const [confirmation, setConfirmation] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({
    status: "idle",
    message: `Conta: ${viewerEmail}. Digite CONFIRM_DELETE_MY_ACCOUNT para solicitar a eliminacao permanente.`,
  });

  const isConfirmed = confirmation === REQUIRED_CONFIRMATION;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isConfirmed) return;

    setFeedback({ status: "loading", message: "A processar pedido..." });

    const result = await rpcPost(
      "/rpc/privacy/delete",
      privacyDeleteOutputSchema,
      privacyDeleteInputSchema.parse({ confirmation }),
    );

    if (result.status !== "ok") {
      setFeedback({
        status: "error",
        message: result.message,
      });
      return;
    }

    setFeedback({
      status: "success",
      message: `${result.data.message} (${result.data.scheduledAt})`,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldDescription>
            Para confirmar, escreva{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">
              {REQUIRED_CONFIRMATION}
            </code>{" "}
            no campo abaixo.
          </FieldDescription>
        </Field>
        <Field>
          <Input
            placeholder={REQUIRED_CONFIRMATION}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={feedback.status === "loading" || feedback.status === "success"}
          />
        </Field>
        <Field>
          {feedback.status === "error" ? (
            <FieldError>{feedback.message}</FieldError>
          ) : (
            <p className="text-muted-foreground text-sm">{feedback.message}</p>
          )}
        </Field>
      </FieldGroup>
      <div className="mt-4">
        <Button
          disabled={!isConfirmed || feedback.status === "loading" || feedback.status === "success"}
          type="submit"
          variant="destructive"
        >
          {feedback.status === "loading"
            ? "A processar..."
            : feedback.status === "success"
              ? "Pedido registado"
              : "Solicitar eliminacao"}
        </Button>
      </div>
    </form>
  );
}
