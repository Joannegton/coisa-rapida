import { HttpException, HttpStatus } from '@nestjs/common';

export class UsuarioException extends HttpException {
    constructor(message: string = 'Usuario error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'UsuarioError',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
