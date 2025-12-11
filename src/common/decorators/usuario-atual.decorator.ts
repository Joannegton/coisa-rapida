import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const usuarioAtual = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const usuario = request.usuario;

    return data ? usuario?.[data] : usuario;
  },
);
