import { HttpException, HttpStatus } from '@nestjs/common';

export class DisponibilidadeException extends HttpException {
    constructor(message: string = 'Disponibilidade error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'DisponibilidadeError',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
