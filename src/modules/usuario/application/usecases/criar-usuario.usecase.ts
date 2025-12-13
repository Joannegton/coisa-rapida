import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';

@Injectable()
export class CriarUsuarioUsecase {
    constructor(
        @Inject('UsuarioRepository')
        private readonly usuarioRepository: UsuarioRepository,
    ) {}

    // async execute(nome: string, usuarioAuthId: string): Promise<UsuarioModel> {
    //     const usuario = Usuario.criar(nome, usuarioAuthId);
    //     return await this.usuarioRepository.salvar(usuario);
    // }
}
