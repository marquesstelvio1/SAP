import { Spinner } from "@saptm/ui";

export default function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner />
    </div>
  );
}
