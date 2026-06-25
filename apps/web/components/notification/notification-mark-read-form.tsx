import { Button } from "@saptm/ui";

export type NotificationMarkReadFormProps = {
  notificationId: string;
  action: (formData: FormData) => Promise<void>;
};

export function NotificationMarkReadForm({
  notificationId,
  action,
}: NotificationMarkReadFormProps) {
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input name="notificationId" type="hidden" value={notificationId} />
      <Button size="sm" type="submit" variant="outline">
        Marcar como lida
      </Button>
    </form>
  );
}
