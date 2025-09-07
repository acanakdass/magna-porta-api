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
import { ConflictException } from '@nestjs/common';

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
        console.log('email', email);
        console.log('pass', pass);
        const user = await this.usersService.findOneDynamic(
            {email: email, isActive: true},
            ['role', 'role.permissions'],
        );
        console.log('user', user);
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
        console.log('user', user);
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

   

    async register(createUserDto: RegisterDto): Promise<BaseApiResponse<RegisterResponseDto>> {

        const companyExists = await this.companyService.findOneDynamic({name:createUserDto.companyName});
        const userWithPhoneExists = await this.usersService.findOneDynamic({phoneNumber:createUserDto.phoneNumber});
        if(companyExists){
            throw new ConflictException(`Company with name '${createUserDto.companyName}' already exists`);
        }
        if(userWithPhoneExists){
            throw new ConflictException(`User with phone '${createUserDto.phoneNumber}' already exists`);
        }
        // Check if role exists
        const role = await this.rolesService.findOneDynamic({key:"customer"});

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
            console.log(awResponse);
            if(awResponse.success){
                airwallexAccountId = awResponse.data.id;
            }else{
                throw new Error('Failed to create Airwallex account');
            }
            console.log('Airwallex account created successfully:', airwallexAccountId);
        } catch (awError) {
            console.error('Error creating Airwallex account:', awError.message);
            throw new Error(`Failed to create Airwallex account: ${awError.message}`);
        }

        let createdCompany:CompanyEntity=null;
        try {
            console.log('Creating company...');
            console.log(airwallexAccountId,createUserDto.companyName);
            const companyToCreate :CreateCompanyDto={
                name:createUserDto.companyName,
                airwallex_account_id:airwallexAccountId
            }
            var companyCreateRes = await this.companyService.createCompany(companyToCreate);
            console.log(companyCreateRes);
            createdCompany = companyCreateRes.data;
            console.log('Company created successfully:', createdCompany);
        }catch (err){
            console.error('Error creating company:', err.message);
            if (err instanceof ConflictException) {
                throw new ConflictException(`Company with name '${createUserDto.companyName}' already exists`);
            }
            throw new Error('Failed to create Company Record');
        }

        // Create the user in the local database
        try {
            const createRes = await this.usersService.createUser({
                ...createUserDto,
                password: createUserDto.password,
                roleEntity: role,
                isActive:true,
                companyId:createdCompany.id
            });

            return {
                message: "Register Success",
                success: true,
                data: {
                    email: createRes.email,
                    roleName: role.name,
                    company:createdCompany
                     // airwallexAccountId // Return the Airwallex account ID with the response
                }
            };
        } catch (userError) {
            console.error('Error creating user:', userError.message);
            throw userError;
        }
    }

}