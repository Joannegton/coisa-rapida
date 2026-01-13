import { HttpException, HttpStatus } from '@nestjs/common';

export class TransferenciaException extends HttpException {
    constructor(message: string = 'Transferencia error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'TransferenciaError',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
