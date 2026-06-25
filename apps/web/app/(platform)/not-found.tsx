import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4">
      <Card>
        <CardHeader className="gap-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <span className="font-bold text-2xl text-muted-foreground">404</span>
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Pagina nao encontrada</CardTitle>
            <CardDescription>
              O recurso que procura nao existe ou foi movido. Verifique o URL ou volte ao inicio.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href={"/app" as Route}>Voltar ao inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
