import { toNestErrors, validateFieldsNatively } from "@hookform/resolvers";
import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Resolver,
  ResolverOptions,
} from "react-hook-form";
import type { z } from "zod";

function parseErrorSchema(
  zodIssues: z.ZodIssue[],
  validateAllFieldCriteria: boolean,
): Record<string, FieldError> {
  const errors: Record<string, FieldError> = {};
  for (const error of zodIssues) {
    const path = error.path.join(".");

    if (!errors[path]) {
      errors[path] = { message: error.message, type: error.code };
    }

    if (validateAllFieldCriteria) {
      const types = errors[path].types as Record<string, string[]> | undefined;
      const messages = types?.[error.code];

      errors[path] = {
        ...errors[path],
        types: {
          ...(types as Record<string, string[]>),
          [error.code]: messages ? ([] as string[]).concat(messages, error.message) : error.message,
        },
      } as FieldError;
    }
  }

  return errors;
}

export function zodResolver<TFieldValues extends FieldValues = FieldValues>(
  schema: z.ZodType<TFieldValues>,
  _schemaOptions?: unknown,
  resolverOptions: { mode?: "async" | "sync"; raw?: boolean } = {},
): Resolver<TFieldValues> {
  return async (values, _, options) => {
    const result =
      resolverOptions.mode === "sync"
        ? schema.safeParse(values)
        : await schema.safeParseAsync(values);

    if (result.success) {
      if (options.shouldUseNativeValidation) {
        validateFieldsNatively({} as FieldErrors, options as ResolverOptions<FieldValues>);
      }
      return {
        errors: {} as Record<string, never>,
        values: (resolverOptions.raw ? Object.assign({}, values) : result.data) as TFieldValues,
      };
    }

    return {
      values: {} as Record<string, never>,
      errors: toNestErrors(
        parseErrorSchema(
          result.error.issues,
          !options.shouldUseNativeValidation && options.criteriaMode === "all",
        ),
        options as ResolverOptions<FieldValues>,
      ) as FieldErrors<TFieldValues>,
    };
  };
}
