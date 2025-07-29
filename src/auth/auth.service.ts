import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {UsersService} from '../users/users.service';
import {LoginDto} from "./dto/login.dto";
import {RegisterDto} from "./dto/register.dto";
import {RegisterResponseDto} from "./dto/register-response.dto";
import {RolesService} from "../role/roles.service";
import {BaseApiResponse} from "../common/dto/api-response-dto";
import {AwAccountService} from "../external/air-wallex/services/aw-account.service";
import {CompaniesService} from "../company/companies.service";
import {CompanyEntity} from "../company/company.entity";
import {CreateCompanyDto} from "../company/dtos/create-company-dto";
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService,
                private jwtService: JwtService,
                private rolesService: RolesService,
                private awAccountService: AwAccountService,
                private companyService: CompaniesService
    ) {
    }

    async validateUser(email: string, pass: string) {
        const user = await this.usersService.findOneDynamic(
            {email: email, isActive: true},
            ['role', 'role.permissions'],
        );
        if (user) {
            let isHashMatched = await bcrypt.compare(pass, user.password)
            if (isHashMatched) {
                return user;
            }
        }
        throw new UnauthorizedException('Invalid credentials');
    }

    async login(dto: LoginDto): Promise<BaseApiResponse<LoginResponseDto>> {
        const user = await this.validateUser(dto.email, dto.password);
        // console.log('JWT Secret:', process.env.JWT_SECRET);
        const payload = {email: user.email, sub: user.id};
        return {
            message: "Login Success",
            success: true,
            data: {
                access_token: this.jwtService.sign(payload)
            }
        };
    }

    async registerold(createUserDto: RegisterDto): Promise<BaseApiResponse<RegisterResponseDto>> {
        const role = await this.rolesService.findOne(createUserDto.roleId);

        if (!role) {
            throw new Error('Role not found');
        }
        let createRes = await this.usersService.createUser({
            ...createUserDto,
            roleEntity: role,
        });

        return {
            message: "Register Success",
            success: true,
            data: {
                email: createRes.email,
                roleName: role.name
            }
        };
    }

    async register(createUserDto: RegisterDto): Promise<BaseApiResponse<RegisterResponseDto>> {
        // Check if role exists
        const role = await this.rolesService.findOne(createUserDto.roleId);

        if (!role) {
            throw new Error('Role not found');
        }

        // Create the Airwallex account
        const currentTimestamp = new Date().toISOString();
        const accountCreationRequest = {
            account_details: {
                business_details: {
                    business_name: createUserDto.companyName,
                }
            },
            customer_agreements: {
                agreed_to_data_usage: true,
                agreed_to_terms_and_conditions: true,
                terms_and_conditions: {
                    agreed_at: currentTimestamp,
                    device_data: {
                        ip_address: '127.0.0.1', //todo fetch ipaddress
                        user_agent: '127.0.0.1', //todo fetch user agent
                    },
                    service_agreement_type: 'FULL'
                }
            },
            primary_contact: {
                email: createUserDto.email
            }
        };

        let airwallexAccountId = null;

        try {
            const awResponse = await this.awAccountService.createAccount(accountCreationRequest);
            if(awResponse.success){
                airwallexAccountId = awResponse.data.id;
            }else{
                throw new Error('Failed to create Airwallex account');
            }
            console.log('Airwallex account created successfully:', airwallexAccountId);
        } catch (awError) {
            console.error('Error creating Airwallex account:', awError.message);
            throw new Error('Failed to create Airwallex account');
        }

        let createdCompany:CompanyEntity=null;
        try {
            const companyToCreate :CreateCompanyDto={
                name:createUserDto.companyName,
                airwallex_account_id:airwallexAccountId
            }
            var companyCreateRes = await this.companyService.createCompany(companyToCreate);
            createdCompany = companyCreateRes.data;
            console.log('Company created successfully:', createdCompany);
        }catch (err){
            console.error('Error creating Airwallex account:', err.message);
            throw new Error('Failed to create Company Record');
        }


        // Create the user in the local database
        const createRes = await this.usersService.createUser({
            ...createUserDto,
            password: createUserDto.password,
            roleEntity: role,
            companyId:createdCompany.id
        });

        return {
            message: "Register Success",
            success: true,
            data: {
                email: createRes.email,
                roleName: role.name
                 // airwallexAccountId // Return the Airwallex account ID with the response
            }
        };
    }

}