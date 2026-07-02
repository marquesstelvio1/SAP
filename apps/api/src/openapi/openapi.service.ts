import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { type OpenAPI, OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { PlatformRpcProvider } from "../rpc/platform-rpc.provider.js";
import type { PlatformRpcRouter } from "../rpc/platform-rpc.router.js";

@Injectable()
export class OpenapiService implements OnModuleInit {
  private readonly logger = new Logger(OpenapiService.name);
  private spec: OpenAPI.Document | undefined;

  constructor(
    @Inject(PlatformRpcProvider)
    private readonly platformRpcProvider: PlatformRpcProvider,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.generateSpec();
  }

  async generateSpec(): Promise<OpenAPI.Document> {
    if (this.spec !== undefined) {
      return this.spec;
    }

    const router: PlatformRpcRouter = this.platformRpcProvider.router;

    const generator = new OpenAPIGenerator({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    });

    const spec = await generator.generate(router, {
      info: {
        title: "SAPTM API",
        version: "1.0.0",
        description:
          "Enterprise logistics platform API for rail/port cargo operations. " +
          "All communication uses RPC via oRPC protocol.",
      },
      servers: [
        {
          url: "/rpc",
          description: "RPC endpoint (v1 compatible)",
        },
      ],
      security: [
        {
          bearerAuth: [],
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            description: "Better Auth session token. Obtain via /api/auth/sign-in or OAuth flow.",
          },
        },
      },
    });

    this.spec = spec;
    this.logger.log(`OpenAPI spec generated: ${Object.keys(spec.paths ?? {}).length} paths`);

    return spec;
  }

  getSpec(): OpenAPI.Document | undefined {
    return this.spec;
  }
}
