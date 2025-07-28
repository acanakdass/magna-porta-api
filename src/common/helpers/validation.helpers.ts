import {Repository} from "typeorm";
import {ConflictException} from "@nestjs/common";

export class ValidationHelper {
    static async checkDuplicates(
        repository: Repository<any>,
        fieldsToCheck: { [key: string]: any },
    ): Promise<void> {
        for (const [field, value] of Object.entries(fieldsToCheck)) {
            const existingEntity = await repository.findOne({ where: { [field]: value } });
            if (existingEntity) {
                throw new ConflictException(`${field} already exists`);
            }
        }
    }
}
