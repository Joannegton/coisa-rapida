import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidPropsException extends HttpException {
    constructor(message: string = 'Invalid properties') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'InvalidProps',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}