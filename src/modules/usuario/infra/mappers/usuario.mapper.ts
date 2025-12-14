import { Injectable } from '@nestjs/common';
import { Usuario } from '../../domain/usuario';
import { UsuarioModel } from '../models/usuario.model';
import { EnderecoMapper } from './Endereco.mapper';
import { ComprovanteResidenciaMapper } from './ComprovanteResidencia.mapper';

@Injectable()
export class UsuarioMapper {
    constructor(
        private readonly enderecoMapper: EnderecoMapper,
        private readonly comprovanteResidenciaMapper: ComprovanteResidenciaMapper,
    ) {}

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
                endereco: model.endereco
                    ? this.enderecoMapper.modelToDomain(model.endereco)
                    : undefined,
                comprovantesResidencia: model.comprovantesResidencia
                    ? this.comprovanteResidenciaMapper.modelToDomainList(
                          model.comprovantesResidencia,
                      )
                    : undefined,
            },
            model.id,
        );
        return usuario;
    }

    domainToModel(domain: Usuario): UsuarioModel {
        const usuarioModel = UsuarioModel.criar({
            id: domain.id,
            nome: domain.nome,
            telefone: domain.telefone,
            cpf: domain.cpf,
            emailVerificado: domain.emailVerificado,
            telefoneVerificado: domain.telefoneVerificado,
            verificado: domain.verificado,
            fotoUrl: domain.fotoUrl,
            endereco: domain.endereco
                ? this.enderecoMapper.domainToModel(domain.endereco)
                : undefined,
            comprovantesResidencia: domain.comprovantesResidencia
                ? this.comprovanteResidenciaMapper.domainToModelList(
                      domain.comprovantesResidencia,
                  )
                : undefined,
        });

        return usuarioModel;
    }
}
