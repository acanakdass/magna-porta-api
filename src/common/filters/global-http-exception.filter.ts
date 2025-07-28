import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { BaseApiResponse } from '../dto/api-response-dto';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Determine status code
        const status = this.getStatus(exception);
        
        // Get error message
        const message = this.getMessage(exception);
        
        // Get error details
        const errorDetails = this.getErrorDetails(exception, status);

        // Log error with context
        this.logError(exception, request, status);

        // Create error response
        const errorResponse: BaseApiResponse<any> = {
            success: false,
            message: message,
            data: errorDetails,
        };

        // Send response
        response.status(status).json(errorResponse);
    }

    private getStatus(exception: any): number {
        if (exception instanceof HttpException) {
            return exception.getStatus();
        }
        
        // Handle specific error types
        if (exception.code === 'ER_DUP_ENTRY') {
            return HttpStatus.CONFLICT;
        }
        
        if (exception.code === 'ER_NO_REFERENCED_ROW_2') {
            return HttpStatus.BAD_REQUEST;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private getMessage(exception: any): string {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'string') {
                return response;
            }
            return (response as any)?.message || exception.message;
        }
        
        // Handle database errors
        if (exception.code === 'ER_DUP_ENTRY') {
            return 'Duplicate entry found';
        }
        
        if (exception.code === 'ER_NO_REFERENCED_ROW_2') {
            return 'Referenced record not found';
        }

        return exception.message || 'Internal server error';
    }

    private getErrorDetails(exception: any, status: number): any {
        const details: any = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: exception.path || null,
        };

        // Add validation errors if available
        if (exception.response?.errors) {
            details.errors = exception.response.errors;
        }

        // Add error code if available
        if (exception.code) {
            details.code = exception.code;
        }

        // Add stack trace in development
        if (process.env.NODE_ENV === 'development') {
            details.stack = exception.stack;
        }

        return details;
    }

    private logError(exception: any, request: Request, status: number): void {
        const errorContext = {
            method: request.method,
            url: request.url,
            statusCode: status,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            userId: (request as any).user?.id || 'anonymous',
        };

        if (status >= 500) {
            this.logger.error(
                `Server Error: ${exception.message}`,
                exception.stack,
                errorContext
            );
        } else {
            this.logger.warn(
                `Client Error: ${exception.message}`,
                errorContext
            );
        }
    }
}