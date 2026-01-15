import { HttpException, HttpStatus } from '@nestjs/common';

export class RepositoryException extends HttpException {
    constructor(message: string = 'Repository error') {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                error: 'Repository',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
