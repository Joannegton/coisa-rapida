import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioAuthModel } from '../models/usuario-auth.model';
import { Repository } from 'typeorm';
import { ResultadoAssincrono, ResultadoUtil } from 'src/shared/resultado';

export class AuthRepository {
    constructor(
        @InjectRepository(UsuarioAuthModel)
        private readonly repository: Repository<UsuarioAuthModel>,
    ) {}

    async registrar(
        usuario: UsuarioAuthModel,
    ): ResultadoAssincrono<Error, void> {
        try {
            await this.repository.save(usuario);
            return ResultadoUtil.sucesso();
        } catch (error) {
            return ResultadoUtil.falha(error.message);
        }
    }
}
