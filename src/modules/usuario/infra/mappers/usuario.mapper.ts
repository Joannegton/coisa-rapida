import { Usuario } from '../../domain/usuario';
import { UsuarioModel } from '../models/usuario.model';

export class UsuarioMapper {
    modelToDomain(model: UsuarioModel): Usuario {
        const usuario = Usuario.carregar(
            {
                nome: model.nome,
                cpf: model.cpf,
                telefone: model.telefone,
                telefoneVerificado: model.telefoneVerificado,
                emailVerificado: model.emailVerificado,
                verificado: model.verificado,
                fotoUrl: model.fotoUrl,
                criadoEm: model.criadoEm,
                atualizadoEm: model.atualizadoEm,
                endereco: model.endereco,
                comprovanteResidencia: model.comprovanteResidencia,
            },
            model.id,
        );
        return usuario;
    }

    domainToModel(domain: Usuario): UsuarioModel {
        const usuarioModel = UsuarioModel.criar({
            nome: domain.nome,
        });

        return usuarioModel;
    }
}
