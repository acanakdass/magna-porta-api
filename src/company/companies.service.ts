import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PaginatedResponseDto, PaginationDto} from 'src/common/models/pagination-dto';
import {CompanyEntity} from './company.entity';
import {BaseService} from "../common/services/base.service";
import {CreateCompanyDto} from "./dtos/create-company-dto";
import {BaseApiResponse} from "../common/dto/api-response-dto";

@Injectable()
export class CompaniesService extends BaseService<CompanyEntity> {
    constructor(
        @InjectRepository(CompanyEntity)
        private readonly repo: Repository<CompanyEntity>,
    ) {
        super(repo);
    }


    async listCompaniesPaginated(paginationDto: PaginationDto): Promise<PaginatedResponseDto<CompanyEntity>> {
        return await this.findAllWithPagination({
            ...paginationDto,
            select: [],
            relations: ['users', 'plan'],
            where: { isDeleted: false },
        });
    }

    async createCompany(createCompanyDto: CreateCompanyDto): Promise<BaseApiResponse<CompanyEntity>> {

        // console.log(createCompanyDto)
        const entity = Object.assign(new CompanyEntity(), createCompanyDto);
        entity.isVerified = false;
        entity.airwallex_account_id = createCompanyDto.airwallex_account_id;
        entity.isActive = false;
        entity.createdAt = new Date()
        const createRes = await super.create(entity);
        const result = {
            success: true,
            message: "Company created successfully",
            data: createRes
        } as BaseApiResponse<CompanyEntity>;
        
        if (!createRes)
            result.success = false;
        return result;
    }

    /**
     * Airwallex account_id ile company bulur
     */
    async findByAirwallexAccountId(accountId: string): Promise<CompanyEntity | null> {
        return await this.repo.findOne({
            where: { airwallex_account_id: accountId },
            relations: ['users', 'plan'],
        });
    }

    async getCompanyWithPlan(id: number): Promise<CompanyEntity | null> {
        return await this.repo.findOne({
            where: { id },
            relations: ['users', 'plan'],
        });
    }

    async updateCompanyPlan(companyId: number, planId: number | null): Promise<BaseApiResponse<CompanyEntity>> {
        const company = await this.repo.findOne({ where: { id: companyId } });
        
        if (!company) {
            return {
                success: false,
                message: `Company with ID ${companyId} not found`,
                data: null
            } as BaseApiResponse<CompanyEntity>;
        }

        company.planId = planId;
        const updatedCompany = await this.repo.save(company);

        return {
            success: true,
            message: `Company plan updated successfully`,
            data: updatedCompany
        } as BaseApiResponse<CompanyEntity>;
    }

    // Soft delete method
    async softDeleteCompany(id: number): Promise<BaseApiResponse<CompanyEntity>> {
        const company = await this.repo.findOne({ where: { id, isDeleted: false } });
        
        if (!company) {
            return {
                success: false,
                message: `Company with ID ${id} not found`,
                data: null
            } as BaseApiResponse<CompanyEntity>;
        }

        company.isDeleted = true;
        company.updatedAt = new Date();
        const deletedCompany = await this.repo.save(company);

        return {
            success: true,
            message: `Company deleted successfully`,
            data: deletedCompany
        } as BaseApiResponse<CompanyEntity>;
    }

    // Restore deleted company
    async restore(id: number): Promise<BaseApiResponse<CompanyEntity>> {
        const company = await this.repo.findOne({ where: { id, isDeleted: true } });
        
        if (!company) {
            return {
                success: false,
                message: `Deleted company with ID ${id} not found`,
                data: null
            } as BaseApiResponse<CompanyEntity>;
        }

        company.isDeleted = false;
        company.updatedAt = new Date();
        const restoredCompany = await this.repo.save(company);

        return {
            success: true,
            message: `Company restored successfully`,
            data: restoredCompany
        } as BaseApiResponse<CompanyEntity>;
    }
}
