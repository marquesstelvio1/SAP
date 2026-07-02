import { Controller, Get, Header, Inject, InternalServerErrorException } from "@nestjs/common";

import { Public } from "../auth/public.decorator.js";
import { OpenapiService } from "./openapi.service.js";

@Controller("api/docs")
@Public()
export class OpenapiController {
  constructor(
    @Inject(OpenapiService)
    private readonly openapiService: OpenapiService,
  ) {}

  @Get("spec.json")
  @Header("Content-Type", "application/json")
  @Header("Cache-Control", "public, max-age=60")
  async getSpec(): Promise<Record<string, unknown>> {
    const spec = this.openapiService.getSpec();

    if (spec === undefined) {
      throw new InternalServerErrorException("OpenAPI spec not yet generated");
    }

    return spec as unknown as Record<string, unknown>;
  }

  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  async getSwaggerUi(): Promise<string> {
    return SWAGGER_UI_HTML;
  }
}

const SWAGGER_UI_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SAPTM API — Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: '/api/docs/spec.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl,
        ],
      });
    </script>
  </body>
</html>`;
