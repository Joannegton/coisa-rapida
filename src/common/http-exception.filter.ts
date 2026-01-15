import {
    ArgumentsHost,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type HttpExceptionResponse = {
    statusCode: number;
    message: string | string[];
    error: string;
};

export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const httpExceptionResponse = {} as HttpExceptionResponse;

        if (exception instanceof HttpException) {
            httpExceptionResponse.statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                httpExceptionResponse.message = exceptionResponse;
                httpExceptionResponse.error = exception.name;
            } else {
                httpExceptionResponse.message = (
                    exceptionResponse as any
                ).message;
                httpExceptionResponse.error = (exceptionResponse as any).error;
            }

            if (
                httpExceptionResponse.statusCode ===
                HttpStatus.INTERNAL_SERVER_ERROR
            ) {
                this.logger.error(
                    `HTTP ${httpExceptionResponse.statusCode} - ${
                        httpExceptionResponse.message
                    } - ${request.method} ${request.url}`,
                );
            }
        } else {
            httpExceptionResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            httpExceptionResponse.message = 'Internal server error';
            httpExceptionResponse.error = 'InternalServerError';

            this.logger.error(
                `HTTP ${httpExceptionResponse.statusCode} - ${
                    exception.message
                } - ${request.method} ${request.url}`,
            );
        }

        if (httpExceptionResponse.statusCode !== HttpStatus.NOT_FOUND) {
            this.logger.warn(
                `HTTP ${httpExceptionResponse.statusCode} - ${
                    httpExceptionResponse.message
                } - ${request.method} ${request.url}`,
            );
        }

        response
            .status(httpExceptionResponse.statusCode)
            .json(httpExceptionResponse);
    }
}
