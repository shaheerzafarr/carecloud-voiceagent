import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LogService } from 'src/shared/log.service';
import {
  httpExceptionHelper,
  MongoErrorHandlingFn,
} from '../helpers/exception.helper';
import { returnArray } from '../helpers/helper';

interface IErrorResponse {
  status: string;
  message: { error: string[] };
}

const MONGO_ERRORS = new Set([
  'MongoServerError',
  'ValidationError',
  'CastError',
]);

@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
  constructor(private readonly logService: LogService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let httpStatusCode: number;
    let error: IErrorResponse;

    /**
     * Handle NestJS HTTP Exceptions
     */
    if (exception instanceof HttpException) {
      const res = httpExceptionHelper(exception, request);

      httpStatusCode = res.httpStatusCode;
      error = {
        status: 'fail',
        message: { error: res.message },
      };
    } else if (exception instanceof Error && MONGO_ERRORS.has(exception.name)) {
      /**
       * Handle MongoDB Errors
       */
      const rs = MongoErrorHandlingFn(exception);

      httpStatusCode = rs.httpStatusCode;
      error = rs.error;
    } else {
      /**
       * Handle Unknown Errors
       */
      httpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      const message =
        exception instanceof Error && exception.message
          ? returnArray(exception.message)
          : ['Internal server error.'];

      error = {
        status: 'fail',
        message: { error: message },
      };
    }

    /**
     * Logging
     */
    this.logService.logError(
      error.message.error.join(', '),
      'AnyExceptionFilter',
      exception instanceof Error ? exception.stack : undefined,
    );

    /**
     * Send Response — ensures standard { data: null, error: ... } envelope
     */
    response.status(httpStatusCode).json({
      data: null,
      error: error.message.error.join(', '),
      ...error,
      statusCode: httpStatusCode,
    });
  }
}
