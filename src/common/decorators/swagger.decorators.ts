import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export function Authenticated() {
    return applyDecorators(ApiBearerAuth('access-token'));
}

export function RefreshAuthenticated() {
    return applyDecorators(ApiBearerAuth('refresh-token'));
}
