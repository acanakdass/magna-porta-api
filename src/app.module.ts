import {MiddlewareConsumer, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule} from '@nestjs/config';
import {AuthModule} from './auth/auth.module';
import {UsersModule} from './users/users.module';
import {LogsModule} from './logs/logs.module';
import {PermissionModule} from "./permission/permission.module";
import {RolesModule} from "./role/roles.module";
import {ExternalModule} from "./external/external.module";
import {CompaniesModule} from "./company/companies.module";
import {CurrencyModule} from "./currency/currency.module";
import {WebhookModule} from "./webhook/webhook.module";
import {MailModule} from "./mail/mail.module";
import {AdminModule} from "./admin/admin.module";
import {APP_FILTER} from "@nestjs/core";
import {GlobalHttpExceptionFilter} from "./common/filters/global-http-exception.filter";
import {LoggingMiddleware} from "./common/middlewares/logging.middleware";

@Module({
    providers:[
        {
            provide:APP_FILTER,
            useClass:GlobalHttpExceptionFilter
        }
    ],
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            autoLoadEntities: true,
            synchronize: false,
            logging: false
        }),
        AuthModule,
        UsersModule,
        LogsModule,
        ExternalModule,
        PermissionModule,
        RolesModule,
        CompaniesModule,
        CurrencyModule,
        WebhookModule,
        MailModule,
        AdminModule
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggingMiddleware).forRoutes('*'); // For all routes
    }
}
