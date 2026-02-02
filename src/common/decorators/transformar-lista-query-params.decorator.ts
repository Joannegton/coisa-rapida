import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator que captura os query params brutos (antes do NestJS parsear)
 * e transforma `categorias[]=X&categorias[]=Y` em `categorias: [X, Y]`
 */
export const TransformarListaQueryParams = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const queryString = request.url.split('?')[1] || '';

        const params: Record<string, any> = {};

        // Parse manual da query string
        new URLSearchParams(queryString).forEach((value, key) => {
            if (key.endsWith('[]')) {
                const cleanKey = key.replace('[]', '');
                if (!params[cleanKey]) {
                    params[cleanKey] = [];
                }
                params[cleanKey].push(value);
            } else {
                params[key] = value;
            }
        });

        return params;
    },
);
