import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const usuarioAtual = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const usuario = request.user;

        return data ? usuario?.[data] : usuario;
    },
);
