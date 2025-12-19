import { HttpException, HttpStatus } from '@nestjs/common';

export class ItemException extends HttpException {
    constructor(message: string = 'Item error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'ItemError',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
