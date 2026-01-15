import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
    UsuarioResult,
    CoreUsuarioService,
} from '../../domain/services/usuario.service';
import type { UsuarioRepository } from 'src/modules/usuario/domain/repositories/usuario.repository';

@Injectable()
export class CoreUsuarioServiceImpl implements CoreUsuarioService {
    constructor(
        @Inject('UsuarioRepository')
        private readonly usuarioRepository: UsuarioRepository,
    ) {}

    async buscar(usuarioId: string): Promise<UsuarioResult> {
        const usuario = await this.usuarioRepository.buscarPorId(
            usuarioId,
            false,
        );
        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado');
        }

        const usuarioResult: UsuarioResult = {
            verificado: usuario.verificado,
            nome: usuario.nome,
            id: usuario.id,
        };

        if (usuario.endereco) {
            usuarioResult.endereco = {
                cep: usuario.endereco.cep,
                rua: usuario.endereco.rua,
                numero: usuario.endereco.numero,
                complemento: usuario.endereco.complemento,
                bairro: usuario.endereco.bairro,
                cidade: usuario.endereco.cidade,
                estado: usuario.endereco.estado,
                latitude: usuario.endereco.latitude,
                longitude: usuario.endereco.longitude,
            };
        }

        return usuarioResult;
    }
}
