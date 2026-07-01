function formatJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  return JSON.stringify(value, null, 2);
}

export type JsonBlockProps = {
  label: string;
  value: unknown;
};

export function JsonBlock({ label, value }: JsonBlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">{label}</span>
      <pre className="max-h-56 overflow-auto rounded-lg border bg-background p-3 text-xs">
        {formatJson(value)}
      </pre>
    </div>
  );
}
