import {Module} from '@nestjs/common';
import {ExternalService} from "./external.service";
import {AwConnectedAccountsService} from "./air-wallex/services/aw-connected-accounts.service";
import {AwAccountService} from "./air-wallex/services/aw-account.service";
import {AwAuthService} from "./air-wallex/services/aw-auth.service";
import {AwConversionService} from "./air-wallex/services/aw-conversion.service";
import {BalanceService} from "./air-wallex/services/aw-balances.service";
import {AuthorizeService} from "./air-wallex/services/aw-authorization.service";
import {AwGlobalAccountService} from "./air-wallex/services/aw-global-account.service";
import {AwContactsService} from "./air-wallex/services/aw-contacts.service";
import {AwTransactionsService} from "./air-wallex/services/aw-transactions.service";
import {AwTransfersService} from "./air-wallex/services/aw-transfers.service";
import {AwScaService} from "./air-wallex/services/aw-sca.service";
import {AwConnectedAccountsController} from "./air-wallex/controllers/aw-connected-accounts.controller";
import {AwConversionController} from "./air-wallex/controllers/aw-conversion.controller";
import {AwBalancesController} from "./air-wallex/controllers/aw-balances.controller";
import {AwAccountController} from "./air-wallex/controllers/aw-account.controller";
import {AwAuthorizationController} from "./air-wallex/controllers/aw-authorization.controller";
import {AwGlobalAccountController} from "./air-wallex/controllers/aw-global-account.controller";
import {AwContactsController} from "./air-wallex/controllers/aw-contacts.controller";
import {AwTransactionsController} from "./air-wallex/controllers/aw-transactions.controller";
import {AwTransfersController} from "./air-wallex/controllers/aw-transfers.controller";
import {AwScaController} from "./air-wallex/controllers/aw-sca.controller";

@Module({
    providers: [ExternalService,
        AwConnectedAccountsService,
        AwAccountService,
        AwAuthService,
        AwConversionService,
        BalanceService,
        AuthorizeService,
        AwGlobalAccountService,
        AwContactsService,
        AwTransactionsService,
        AwTransfersService,
        AwScaService],
    exports: [
        ExternalService,
        AwConnectedAccountsService,
        AwAccountService,
        AwAuthService,
        AwConversionService,
        BalanceService,
        AuthorizeService,
        AwGlobalAccountService,
        AwContactsService,
        AwTransactionsService,
        AwTransfersService,
        AwScaService
    ],
    controllers:[
        AwConnectedAccountsController, 
        AwConversionController,
        AwBalancesController,
        AwAccountController,
        AwAuthorizationController,
        AwGlobalAccountController,
        AwContactsController,
        AwTransactionsController,
        AwTransfersController,
        AwScaController
    ]
})
export class ExternalModule {}