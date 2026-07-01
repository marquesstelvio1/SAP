export type CursorPaginationInput = {
  cursor?: string;
  limit: number;
  order?: "asc" | "desc";
};

export type CursorPaginationResult<T> = {
  items: T[];
  nextCursor: string | undefined;
  hasMore: boolean;
};

export type FindManyCursorArgs<TSelect, TInclude> = {
  take: number;
  skip?: number;
  cursor?: { id: string };
  orderBy: Record<string, "asc" | "desc">[];
  where?: Record<string, unknown>;
  select?: TSelect;
  include?: TInclude;
};

export async function paginateWithCursor<T, TSelect, TInclude>(
  findMany: (args: FindManyCursorArgs<TSelect, TInclude>) => Promise<T[]>,
  input: CursorPaginationInput,
  options: {
    where?: Record<string, unknown>;
    select?: TSelect;
    include?: TInclude;
    orderByField?: string;
  } = {},
): Promise<CursorPaginationResult<T>> {
  const limit = Math.min(Math.max(input.limit, 1), 1000);
  const order = input.order ?? "desc";
  const orderByField = options.orderByField ?? "createdAt";

  const records = await findMany({
    take: limit + 1,
    ...(input.cursor !== undefined ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ [orderByField]: order }, { id: order }],
    ...(options.where !== undefined ? { where: options.where } : {}),
    ...(options.select !== undefined ? { select: options.select } : {}),
    ...(options.include !== undefined ? { include: options.include } : {}),
  });

  const hasMore = records.length > limit;
  const items: T[] = hasMore ? records.slice(0, limit) : records;
  const nextCursor = hasMore ? (items[items.length - 1] as { id?: string })?.id : undefined;

  return { items, nextCursor, hasMore };
}
