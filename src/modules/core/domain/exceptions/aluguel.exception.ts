import { HttpException, HttpStatus } from '@nestjs/common';

export class AluguelException extends HttpException {
    constructor(message: string = 'Aluguel error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'AluguelError',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
