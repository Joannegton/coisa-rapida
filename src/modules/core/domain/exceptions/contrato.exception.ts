import { HttpException, HttpStatus } from '@nestjs/common';

export class ContratoException extends HttpException {
    constructor(message: string = 'Contrato error') {
        super(
            {
                statusCode: HttpStatus.CONFLICT,
                message,
                error: 'ContratoError',
            },
            HttpStatus.CONFLICT,
        );
    }
}
