import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioAuthModel } from '../models/usuario-auth.model';
import { Repository, DataSource } from 'typeorm';
import { RepositoryException } from 'src/common/exceptions/repository.exception';
import { UsuarioModel } from 'src/modules/usuario/infra/models/usuario.model';

@Injectable()
export class AuthRepository {
    constructor(
        @InjectRepository(UsuarioAuthModel)
        private readonly repository: Repository<UsuarioAuthModel>,
        private readonly dataSource: DataSource,
    ) {}
    async salvar(usuario: UsuarioAuthModel): Promise<UsuarioAuthModel> {
        try {
            return await this.repository.save(usuario);
        } catch (error) {
            throw new RepositoryException(
                `Erro ao salvar usuário: ${error.message}`,
            );
        }
    }

    async registrarUsuarioAtomico(dados: {
        email: string;
        hashSenha: string;
        nome: string;
    }): Promise<{
        usuarioAuth: UsuarioAuthModel;
        usuario: UsuarioModel;
    }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');

        try {
            const usuarioAuth = await queryRunner.manager.save(
                UsuarioAuthModel,
                {
                    email: dados.email,
                    hashSenha: dados.hashSenha,
                    dataUltimoLogin: new Date(),
                },
            );

            const usuario = await queryRunner.manager.save(UsuarioModel, {
                nome: dados.nome,
                auth: usuarioAuth,
                telefoneVerificado: false,
                emailVerificado: false,
                verificado: false,
            });

            await queryRunner.commitTransaction();

            return { usuarioAuth, usuario };
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(
                `Erro ao registrar usuário: ${error.message}`,
            );
        } finally {
            await queryRunner.release();
        }
    }

    async buscarPorEmail(email: string): Promise<UsuarioAuthModel | null> {
        try {
            const usuario = await this.repository.findOne({ where: { email } });
            return usuario || null;
        } catch (error) {
            throw new RepositoryException(
                `Erro ao buscar usuário por email: ${error.message}`,
            );
        }
    }

    async buscarPorEmailComSenha(
        email: string,
    ): Promise<UsuarioAuthModel | null> {
        try {
            const usuario = await this.repository
                .createQueryBuilder('ua')
                .where('ua.email = :email', { email })
                .addSelect('ua.hashSenha')
                .getOne();
            return usuario || null;
        } catch (error) {
            throw new RepositoryException(
                `Erro ao buscar usuário por email: ${error.message}`,
            );
        }
    }

    async buscarUsuarioPorAuthId(authId: string): Promise<UsuarioModel | null> {
        try {
            const usuario = await this.dataSource
                .getRepository(UsuarioModel)
                .findOne({
                    where: { auth: { id: authId } },
                });
            return usuario || null;
        } catch (error) {
            throw new RepositoryException(
                `Erro ao buscar usuário por auth ID: ${error.message}`,
            );
        }
    }
}
