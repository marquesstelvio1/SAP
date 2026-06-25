"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBreadcrumbs } from "../../lib/breadcrumbs";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const items = buildBreadcrumbs(pathname);

  if (items.length <= 1) {
    return <span className="text-muted-foreground text-xs">UI/Auth/App Shell Foundation</span>;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <BreadcrumbItem key={item.href ?? item.label}>
              {isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href as Route}>{item.label}</Link>
                </BreadcrumbLink>
              )}
              {!isLast ? <BreadcrumbSeparator /> : null}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
