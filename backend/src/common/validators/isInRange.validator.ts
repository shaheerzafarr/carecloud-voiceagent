import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export function IsInRange(
  minValue: number,
  maxValue: number,
  validationOptions?: ValidationOptions,
): (object: object, propertyName: string) => void {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isInRange',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [minValue, maxValue],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          const [min, max] = args.constraints;

          if (typeof value === 'number') return value >= min && value <= max;
          else return value?.length >= min && value?.length <= max;
        },
        defaultMessage(args: ValidationArguments): string {
          const [min, max] = args.constraints;
          return `${args.property} must be in range between ${min} and ${max}`;
        },
      },
    });
  };
}
