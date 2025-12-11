import { HttpException, HttpStatus } from '@nestjs/common';

export class ServiceException extends HttpException {
    constructor(message: string = 'Service error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'Service',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
