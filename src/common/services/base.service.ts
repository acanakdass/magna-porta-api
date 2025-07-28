import {
    Repository,
    FindOptionsWhere,
    DeepPartial
} from 'typeorm';
import {BaseEntity} from "../entities/base.entity";
import {PaginatedResponseDto, PaginationDto} from "../models/pagination-dto";



export class BaseService<T extends BaseEntity> {
    constructor(private readonly repository: Repository<T>) {
    }

    // Find all with pagination and filtering
    async findAllWithPagination(
        params: PaginationDto,
    ): Promise<PaginatedResponseDto<T>> {
        const {page = 1, limit = 10, orderBy = 'createdAt', order = 'DESC', where = {}, relations = []} = params;
        const newWhere = {...where, isDeleted: false} as FindOptionsWhere<T>;

        const [data, total] = await this.repository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {[orderBy]: order} as any,
            where: newWhere,
            relations,
            select: params.select as any

        });
        const response = new PaginatedResponseDto<T>();
        response.data = data;
        response.meta = {
            totalItems: total,
            itemsPerPage: limit,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        };

        return response;
    }


    // Find one by dynamic conditions (with optional relations)
    async findOneDynamic(where: FindOptionsWhere<T>, relations?: string[]): Promise<T | null> {
        return this.repository.findOne({
            where,
            relations,
        });
    }

    // Find many by conditions
    async findBy(where: FindOptionsWhere<T>, relations?: string[]): Promise<T[]> {
        return this.repository.find({
            where,
            relations,
        });
    }

    // Create a new record
    async create(data: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    // Update a record by ID
    async update(id: number, data: DeepPartial<T>): Promise<T> {
        const entity = await this.findOneDynamic({id} as FindOptionsWhere<T>);
        if (!entity) {
            throw new Error(`Entity with ID ${id} not found`);
        }

        const updated = this.repository.merge(entity, data);
        return this.repository.save(updated);
    }

    // Soft Delete (update a record's isActive property or other soft delete field)
    async softDelete(id: number, softDeleteField = 'isDeleted'): Promise<T> {
        const entity = await this.findOneDynamic({id} as FindOptionsWhere<T>);
        if (!entity) {
            throw new Error(`Entity with ID ${id} not found`);
        }

        (entity as any)[softDeleteField] = false;
        return this.repository.save(entity);
    }

    // Hard delete from the database
    async delete(id: number): Promise<void> {
        const result = await this.repository.delete(id);
        if (result.affected === 0) {
            throw new Error(`Entity with ID ${id} not found`);
        }
    }

    // Count records by conditions
    async count(where: FindOptionsWhere<T> = {}): Promise<number> {
        return this.repository.count({
            where,
        });
    }

    // Check if an entity exists by conditions
    async exists(where: FindOptionsWhere<T>): Promise<boolean> {
        const count = await this.count(where);
        return count > 0;
    }
}