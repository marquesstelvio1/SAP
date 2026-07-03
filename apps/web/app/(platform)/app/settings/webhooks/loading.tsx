import { Spinner } from "@saptm/ui";

export default function Loading() {
  return (
    <div className="flex min-h-[var(--layout-content-min-height)] items-center justify-center">
      <Spinner />
    </div>
  );
}
