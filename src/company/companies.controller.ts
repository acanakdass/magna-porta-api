
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';

import {PaginatedResponseDto, PaginationDto} from '../common/models/pagination-dto';

import {CompanyEntity} from "./company.entity";
import {CompaniesService} from "./companies.service";
import {CreateCompanyDto} from "./dtos/create-company-dto";
import {UpdateCompanyDto} from "./dtos/update-company-dto";
import {ApiTags} from "@nestjs/swagger";

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.service.findAllWithPagination({...paginationDto});
  }
  @Get('paginated')
  async findAllPaginated(@Query() paginationDto: PaginationDto) {
    return this.service.listCompaniesPaginated({...paginationDto});
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.service.findOneDynamic({ id });
  }

  @Post()
  async create(@Body() createDto: CreateCompanyDto) {
    return this.service.createCompany(createDto);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateDto: UpdateCompanyDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}