import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioModel } from '../models/usuario.model';
import { RepositoryException } from 'src/common/exceptions/repository.exception';
import { UsuarioMapper } from '../mappers/usuario.mapper';
import { Usuario } from '../../domain/usuario';

@Injectable()
export class UsuarioRepository {
    constructor(
        @InjectRepository(UsuarioModel)
        private readonly repository: Repository<UsuarioModel>,
        private readonly usuarioMapper: UsuarioMapper,
    ) {}

    async salvar(usuario: Usuario): Promise<Usuario> {
        try {
            const usuarioModel = this.usuarioMapper.domainToModel(usuario);
            const usuarioSalvo = await this.repository.save(usuarioModel);
            return this.usuarioMapper.modelToDomain(usuarioSalvo);
        } catch (error) {
            throw new RepositoryException(
                `Erro ao salvar usuário: ${error.message}`,
            );
        }
    }

    async buscarPorCPF(cpf: string): Promise<UsuarioModel | null> {
        try {
            const usuario = await this.repository.findOne({ where: { cpf } });
            return usuario || null;
        } catch (error) {
            throw new RepositoryException(
                `Erro ao buscar usuário por CPF: ${error.message}`,
            );
        }
    }

    async buscarPorId(id: string): Promise<UsuarioModel | null> {
        try {
            const usuario = await this.repository.findOne({ where: { id } });
            return usuario || null;
        } catch (error) {
            throw new RepositoryException(
                `Erro ao buscar usuário por ID: ${error.message}`,
            );
        }
    }
}
