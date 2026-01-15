import { HttpException, HttpStatus } from '@nestjs/common';

export class PrecoException extends HttpException {
    constructor(message: string = 'Preço error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'PrecoError',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
