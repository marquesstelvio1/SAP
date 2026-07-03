"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@saptm/ui";
import { UsersIcon, KeyIcon, CpuIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AdminPageClient({
  overviewHeader,
  usersChildren,
  rolesChildren,
  capacityChildren,
}: {
  overviewHeader: ReactNode;
  usersChildren: ReactNode;
  rolesChildren: ReactNode;
  capacityChildren: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {overviewHeader}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="size-4" />
            Utilizadores
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <KeyIcon className="size-4" />
            Perfis
          </TabsTrigger>
          <TabsTrigger value="capacity" className="flex items-center gap-2">
            <CpuIcon className="size-4" />
            Capacidade
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de utilizadores</CardTitle>
              <CardDescription>
                Convide, atribua perfis e gerira o estado dos membros da organização.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">{usersChildren}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de perfis</CardTitle>
              <CardDescription>
                Crie, edite permissões e remova perfis de acesso da organização.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">{rolesChildren}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="capacity">
          <Card>
            <CardHeader>
              <CardTitle>Capacidade</CardTitle>
              <CardDescription>
                Registe recursos de capacidade para a organização.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">{capacityChildren}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
