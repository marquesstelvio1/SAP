# Pattern: Service Layer

**Category:** architecture
**Approved:** 2026-06-23
**Status:** active

## Context
When implementing business logic in `@saptm/api`, always use the Service layer pattern.

## Structure

```
Controller/Handler → Service → Repository → Prisma
```

### Service
```typescript
@Injectable()
export class CargoService {
  constructor(
    private readonly cargoRepository: CargoRepository,
    private readonly auditService: AuditService,
  ) {}

  async registerCargo(input: RegisterCargoInput, orgId: string) {
    // 1. Business validation
    // 2. Call repository
    // 3. Create audit record
    // 4. Return result
  }
}
```

### Repository
```typescript
@Injectable()
export class CargoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, orgId: string) {
    return this.prisma.cargo.findFirst({
      where: { id, organizationId: orgId },
    })
  }
}
```

## Rules
- Business logic NEVER in controllers or handlers
- Services NEVER access Prisma directly
- Repositories handle ONLY data access
- Always scope queries to organizationId
