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
            relations: ['users'],
            where: {},
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
}
