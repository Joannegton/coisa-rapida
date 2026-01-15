import { HttpException, HttpStatus } from '@nestjs/common';

export class PagamentoException extends HttpException {
    constructor(message: string = 'Pagamento error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'PagamentoError',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
