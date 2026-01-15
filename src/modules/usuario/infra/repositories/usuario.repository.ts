import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioModel } from '../models/usuario.model';
import { RepositoryException } from 'src/common/exceptions/repository.exception';
import { UsuarioMapper } from '../mappers/usuario.mapper';
import { Usuario } from '../../domain/usuario';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { EnderecoModel } from '../models/endereco.value-objct';

@Injectable()
export class UsuarioRepositoryImpl implements UsuarioRepository {
    private readonly logger = new Logger(UsuarioRepositoryImpl.name);
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
            this.logger.error(
                `Erro ao salvar usuário: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(`Erro ao salvar usuário`);
        }
    }

    async buscarPorCPF(cpf: string): Promise<Usuario | null> {
        try {
            const usuario = await this.repository.findOne({ where: { cpf } });
            return usuario ? this.usuarioMapper.modelToDomain(usuario) : null;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar usuário por CPF: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(`Erro ao buscar usuário`);
        }
    }

    async buscarPorId(
        id: string,
        carregarRelacoes: boolean = true,
    ): Promise<Usuario | null> {
        try {
            const usuario = await this.repository.findOne({
                where: { id },
                relations: carregarRelacoes ? ['comprovantesResidencia'] : [],
            });
            return usuario ? this.usuarioMapper.modelToDomain(usuario) : null;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar usuário por ID: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(`Erro ao buscar usuário`);
        }
    }

    // Queries
    async buscarVerificacaoEEndereco(
        id: string,
    ): Promise<{ verificado: boolean; endereco?: EnderecoModel } | null> {
        try {
            const usuario = await this.repository.findOne({
                where: { id },
                select: [
                    'verificado',
                    'endereco.cep',
                    'endereco.rua',
                    'endereco.numero',
                    'endereco.complemento',
                    'endereco.bairro',
                    'endereco.cidade',
                    'endereco.estado',
                    'endereco.pais',
                    'endereco.latitude',
                    'endereco.longitude',
                ] as any,
            });

            if (!usuario) return null;

            return {
                verificado: usuario.verificado,
                endereco: usuario.endereco,
            };
        } catch (error) {
            this.logger.error(
                `Erro ao buscar verificação e endereço: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(`Erro ao buscar dados do usuário`);
        }
    }
}
