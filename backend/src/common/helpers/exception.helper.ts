import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { IExceptionResponse } from '../constants/interfaces/interface';
import { returnArray } from './helper';

export const httpExceptionHelper = (
  exception: any,
  request: Request,
): IExceptionResponse => {
  let httpStatusCode: number;
  let message: string[];
  switch (exception.name) {
    case 'NotFoundException':
      httpStatusCode = HttpStatus.NOT_FOUND;
      message = ['Provided URL not found: ' + request.url];
      break;

    case 'UnauthorizedException':
      httpStatusCode = HttpStatus.UNAUTHORIZED;
      message = exception.message
        ? returnArray(exception.message)
        : ['Please provide valid credentials.'];
      break;

    case 'ForbiddenException':
      httpStatusCode = HttpStatus.FORBIDDEN;
      message = ['You are not authorized to access this resource.'];
      break;

    case 'BadRequestException':
      httpStatusCode = HttpStatus.BAD_REQUEST;
      message = exception.message
        ? returnArray(exception.message)
        : ['Bad request.'];
      break;

    case 'PayloadTooLargeException':
      httpStatusCode = HttpStatus.PAYLOAD_TOO_LARGE;
      message = [
        'error: ' + exception.message + ' should not be greater than 10 mb.',
      ];
      break;

    case 'ThrottlerException':
      httpStatusCode = HttpStatus.TOO_MANY_REQUESTS;
      message = ['Too many requests.'];
      break;

    default:
      httpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = ['Internal server error.'];
  }

  return { httpStatusCode, message } as IExceptionResponse;
};

const normalWord = (word: string): string =>
  word?.replaceAll(/([A-Z]+)/g, ' $1').replaceAll(/([A-Z][a-z])/g, '$1');

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/);

  const messages = Object.keys(err.keyValue).map(
    (key) =>
      `Duplicate field ${
        normalWord(key) || 'value'
      }: ${value}. Please use another ${normalWord(key) || 'value'}`,
  );
  return messages;
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map(
    (el: any) => `Invalid input: ${el?.message}`,
  );

  return errors;
};

const handleCastErrorDB = (err: any) => [`Invalid ${err.path}: ${err.value}.`];

export const MongoErrorHandlingFn = (
  err: any,
): {
  error: { status: string; message: { error: string[] } };
  httpStatusCode: number;
} => {
  let error: any = {};
  let httpStatusCode: number;

  if (err.code === 11000) {
    error = {
      status: 'fail',
      message: { error: handleDuplicateFieldsDB(err) },
    };
    httpStatusCode = HttpStatus.CONFLICT;
  } else if (err.name === 'ValidationError') {
    error = {
      status: 'fail',
      message: { error: handleValidationErrorDB(err) },
    };
    httpStatusCode = HttpStatus.BAD_REQUEST;
  } else if ('CastError' == err.name) {
    error = { status: 'fail', message: { error: handleCastErrorDB(err) } };
    httpStatusCode = HttpStatus.NOT_FOUND;
  } else {
    error = {
      status: 'fail',
      message: {
        error: Array.isArray(err?.message) ? err.message : [err.message],
      },
    };
    httpStatusCode = err.status || HttpStatus.BAD_REQUEST;
  }

  return { error, httpStatusCode };
};

const constraintRecursion = (error: any) => {
  if (error.children.length) {
    return error.children.map((e) => {
      return constraintRecursion(e);
    });
  }
  return Object.values(error.constraints);
};

export const exceptionFactoryFn = (errors: any) => {
  const error = errors.map((error) => {
    return {
      property: error.property,
      constraints: constraintRecursion(error),
    };
  });
  const err = error
    ?.map((error) => {
      return `${error.constraints.join(', ')}`;
    })
    .join(', ');

  return new BadRequestException(err);
};
