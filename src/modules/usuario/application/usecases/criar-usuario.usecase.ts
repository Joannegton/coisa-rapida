import { ConflictException, Injectable } from '@nestjs/common';
import { UsuarioRepository } from '../../infra/repositories/usuario.repository';
import { UsuarioModel } from '../../infra/models/usuario.model';
import { Usuario } from '../../domain/usuario';

@Injectable()
export class CriarUsuarioUsecase {
    constructor(private readonly usuarioRepository: UsuarioRepository) {}

    // async execute(nome: string, usuarioAuthId: string): Promise<UsuarioModel> {
    //     const usuario = Usuario.criar(nome, usuarioAuthId);
    //     return await this.usuarioRepository.salvar(usuario);
    // }
}
