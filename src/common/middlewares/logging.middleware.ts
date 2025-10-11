import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogsService } from '../../logs/logs.service';
import { LogEntity } from '../../logs/log.entity';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    private readonly logger = new Logger(LoggingMiddleware.name);
    private readonly sensitiveFields = ['password', 'token', 'authorization', 'secret'];
    private readonly loggableEndpoints = [
        '/auth/login',
        '/auth/register',
        '/users',
        '/companies',
        '/airwallex',
        '/transfer-markup-rates'
    ];

    constructor(private readonly logsService: LogsService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        
        // Add request ID to request object
        (req as any).requestId = requestId;

        // Check if endpoint should be logged
        const shouldLog = this.shouldLogEndpoint(req.originalUrl);
        if (!shouldLog) {
            return next();
        }

        // Capture request data
        const requestData = this.captureRequestData(req);

        // Override response.send to capture response
        const originalSend = res.send;
        let responseBody: any;

        res.send = (body: any) => {
            try {
                responseBody = typeof body === 'string' ? JSON.parse(body) : body;
            } catch (error) {
                responseBody = body;
            }
            return originalSend.call(res, body);
        };

        // Log when response finishes
        res.on('finish', async () => {
            const executionTime = Date.now() - startTime;
            
            try {
                const logData = this.createLogData(
                    req, 
                    res, 
                    requestData, 
                    responseBody, 
                    executionTime, 
                    requestId
                );

                await this.logsService.createLog(logData);
                
                // Console log for development
                if (process.env.NODE_ENV === 'development') {
                    this.logToConsole(logData);
                }
            } catch (error) {
                this.logger.error('Failed to save log to database', error.stack);
            }
        });

        next();
    }

    private shouldLogEndpoint(url: string): boolean {
        return this.loggableEndpoints.some(endpoint => 
            url.startsWith(endpoint)
        );
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private captureRequestData(req: Request): any {
        return {
            headers: this.maskSensitiveData(req.headers),
            query: req.query,
            params: req.params,
            body: this.maskSensitiveData(req.body),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.method,
            url: req.originalUrl,
        };
    }

    private maskSensitiveData(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const masked = { ...data };
        
        for (const field of this.sensitiveFields) {
            if (masked[field]) {
                masked[field] = '***MASKED***';
            }
        }

        return masked;
    }

    private createLogData(
        req: Request, 
        res: Response, 
        requestData: any, 
        responseBody: any, 
        executionTime: number,
        requestId: string
    ): LogEntity {
        return {
            isDeleted: false,
            level: res.statusCode >= 500 ? 'error' : 
                   res.statusCode >= 400 ? 'warn' : 'info',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            ip: req.ip,
            message: `HTTP ${req.method} ${req.originalUrl} - ${res.statusCode}`,
            userAgent: req.headers['user-agent'] || null,
            serviceName: 'MagnaPortaBackend',
            environment: (process.env.NODE_ENV as any) || 'development',
            executionTime,
            metadata: {
                requestId,
                requestData,
                responseSize: JSON.stringify(responseBody).length,
                timestamp: new Date().toISOString(),
            },
            responseBody: this.maskSensitiveData(responseBody)
        };
    }

    private logToConsole(logData: LogEntity): void {
        const logMessage = `[${logData.level.toUpperCase()}] ${logData.method} ${logData.url} - ${logData.statusCode} (${logData.executionTime}ms)`;
        
        switch (logData.level) {
            case 'error':
                this.logger.error(logMessage);
                break;
            case 'warn':
                this.logger.warn(logMessage);
                break;
            default:
                this.logger.log(logMessage);
        }
    }
}