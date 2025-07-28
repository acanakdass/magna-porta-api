import {PartialType} from "@nestjs/mapped-types";
import { CreateRoleDto } from "./ceate-role.dto";

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

