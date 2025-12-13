import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshTokenModel } from '../models/refresh-token.model';
import { RepositoryException } from 'src/common/exceptions/repository.exception';

export interface CriarRefreshTokenProps {
    token: string;
    usuarioAuthId: string;
    expiraEm: Date;
}

@Injectable()
export class RefreshTokenRepository {
    private readonly logger = new Logger(RefreshTokenRepository.name);

    constructor(
        @InjectRepository(RefreshTokenModel)
        private readonly repository: Repository<RefreshTokenModel>,
    ) {}

    async criar(dto: CriarRefreshTokenProps): Promise<RefreshTokenModel> {
        try {
            const refreshToken = this.repository.create(dto);
            return await this.repository.save(refreshToken);
        } catch (error) {
            this.logger.error(
                `Erro ao criar refresh token: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao criar refresh token');
        }
    }

    async buscarPorToken(token: string): Promise<RefreshTokenModel | null> {
        try {
            const result = await this.repository
                .createQueryBuilder('rt')
                .select([
                    'rt.id',
                    'rt.token',
                    'rt.usuarioAuthId',
                    'rt.expiraEm',
                    'rt.revogado',
                    'ua.id',
                    'ua.email',
                    'ua.role',
                    'u.id',
                ])
                .leftJoin('rt.usuarioAuth', 'ua')
                .leftJoin('ua.usuario', 'u')
                .where('rt.token = :token', { token })
                .getOne();

            return result;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar refresh token por token: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar refresh token');
        }
    }

    async revogarToken(tokenId: string): Promise<void> {
        try {
            await this.repository.update(tokenId, {
                revogado: true,
                revogadoEm: new Date(),
            });
        } catch (error) {
            this.logger.error(
                `Erro ao revogar token: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao revogar token');
        }
    }

    async revogarPorUsuario(usuarioAuthId: string): Promise<void> {
        try {
            await this.repository.update(
                { usuarioAuthId, revogado: false },
                {
                    revogado: true,
                    revogadoEm: new Date(),
                },
            );
        } catch (error) {
            this.logger.error(
                `Erro ao revogar tokens por usuário: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao revogar tokens');
        }
    }

    async revogarPorToken(token: string): Promise<void> {
        try {
            const tokenRecord = await this.buscarPorToken(token);
            if (tokenRecord) {
                await this.revogarToken(tokenRecord.id);
            }
        } catch (error) {
            this.logger.error(
                `Erro ao revogar token por token: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao revogar token');
        }
    }

    async limparExpirados(): Promise<void> {
        try {
            await this.repository.delete({
                expiraEm: LessThan(new Date()),
            });
        } catch (error) {
            this.logger.error(
                `Erro ao limpar tokens expirados: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao limpar tokens expirados');
        }
    }

    async limparRevogadosAntigos(dataLimite: Date): Promise<void> {
        try {
            await this.repository.delete({
                revogado: true,
                revogadoEm: LessThan(dataLimite),
            });
        } catch (error) {
            this.logger.error(
                `Erro ao limpar tokens revogados antigos: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(
                'Erro ao limpar tokens revogados antigos',
            );
        }
    }

    async contarAtivos(usuarioAuthId: string): Promise<number> {
        try {
            return await this.repository.count({
                where: {
                    usuarioAuthId,
                    revogado: false,
                    expiraEm: LessThan(new Date()),
                },
            });
        } catch (error) {
            this.logger.error(
                `Erro ao contar tokens ativos: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao contar tokens ativos');
        }
    }
}
