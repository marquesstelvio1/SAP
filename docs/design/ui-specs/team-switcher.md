# UI Spec: Team Switcher

> **Departamento:** Visual Design
> **Tipo:** UI Specification
> **Data:** 2026-07-02
> **Prioridade:** Alta (Sprint A)

## 1. Purpose

Allow users to switch between organizations and teams directly from the sidebar. Pattern inspired by Slack/Linear workspace switchers.

## 2. Status: ✅ Already Implemented

The `TeamSwitcher` component already exists at:
`apps/web/components/app-sidebar/team-switcher.tsx`

This document serves as **documentation of the current implementation** and identifies refinements.

## 3. Current Implementation

```tsx
<SidebarMenu>
  <SidebarMenuItem>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <span>SP</span>  {/* Org initials */}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Org Name</span>
            <span className="truncate text-xs">org-slug</span>
          </div>
          <ChevronsUpDownIcon className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Organizações</DropdownMenuLabel>
        {organizations.map(org => (
          <DropdownMenuItem key={org.id} onClick={() => switchOrg(org.id)}>
            <div className="flex size-6 items-center justify-center rounded-md border">
              <span>SP</span>
            </div>
            <span>{org.name}</span>
            {org.isActive && <CheckIcon />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <PlusIcon /> Criar organização
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </SidebarMenuItem>
</SidebarMenu>
```

## 4. States

### Single Organization (no dropdown)
```
┌────────────────────────────────────┐
│ [🔵 SP] SAPTM Transportes         │
│         saptm                      │
└────────────────────────────────────┘
→ Static display, no dropdown trigger
```

### Multiple Organizations (dropdown)
```
┌────────────────────────────────────┐
│ [🔵 SP] SAPTM Transportes    ▼    │
│         saptm                      │
├────────────────────────────────────┤
│ ▼ Organizações                     │
│ ┌──┐                              │
│ │SP│ SAPTM Transportes  ✓  saptm  │
│ ├──┤                              │
│ │PL│ Porto Logistics     │  plog  │
│ └──┘                              │
│ ─────────────────────              │
│ ＋ Criar organização               │
└────────────────────────────────────┘
```

### Loading State
```
┌────────────────────────────────────┐
│ ┌─────────────┐                   │
│ │ ████████░░  │  Skeleton         │
│ └─────────────┘  40px width       │
└────────────────────────────────────┘
```

### No Organizations
→ Hidden — team switcher is not rendered

## 5. Refinements Needed (Sprint B)

| Improvement | Priority | Description |
|-------------|----------|-------------|
| Team-level switcher | Medium | Switch between teams within an org, not just orgs |
| Visual indicator for active team | Medium | Badge or color coding |
| Keyboard shortcut | Low | `Ctrl+Shift+T` to open switcher |
| Recently used orgs | Low | Show last 3 used orgs at top |
| Search within switcher | Low | Type to filter orgs |
