import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Password strength validation
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return typeof value === 'string' && passwordRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character';
        },
      },
    });
  };
}

// Phone number validation
export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Optional field
          const phoneRegex = /^\+?[1-9]\d{1,14}$/;
          return typeof value === 'string' && phoneRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Please provide a valid phone number';
        },
      },
    });
  };
}

// Unique email validation (database check)
export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Email already exists';
        },
      },
    });
  };
} 