
interface PaginationResult<T> {
    data: T[];
    total: number;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'ASC' | 'DESC';
    where?: Record<string, any>;
}

export async function paginate<T>(
    repository,
    options: PaginationParams
): Promise<PaginationResult<T>> {
    const { page = 1, limit = 10, orderBy = 'createdAt', order = 'DESC', where = {} } = options;

    const [data, total] = await repository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { [orderBy]: order },
        where,
    });

    return { data, total };
}