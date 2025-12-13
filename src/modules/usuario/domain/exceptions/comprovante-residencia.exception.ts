import { HttpException, HttpStatus } from '@nestjs/common';

export class ComprovanteResidenciaException extends HttpException {
    constructor(message: string = 'ComprovanteResidencia error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'ComprovanteResidenciaError',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
