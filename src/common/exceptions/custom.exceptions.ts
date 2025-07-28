import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(errors: any[]) {
    super({
      message: 'Validation failed',
      errors,
      statusCode: HttpStatus.BAD_REQUEST,
    }, HttpStatus.BAD_REQUEST);
  }
}

export class BusinessLogicException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({
      message,
      statusCode,
    }, statusCode);
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string | number) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    
    super({
      message,
      statusCode: HttpStatus.NOT_FOUND,
    }, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized access') {
    super({
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Access forbidden') {
    super({
      message,
      statusCode: HttpStatus.FORBIDDEN,
    }, HttpStatus.FORBIDDEN);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = 'Resource conflict') {
    super({
      message,
      statusCode: HttpStatus.CONFLICT,
    }, HttpStatus.CONFLICT);
  }
} 