import { Injectable } from '@nestjs/common';
import { VerificacaoResidenciaModel, ModeracaoStatus } from '../models/VerificacaoResidencia.model';
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from '../../../../shared/resultado';
import { VerificacaoResidencia } from '../../domain/VerificacaoResidencia';
import { EnderecoModel } from '../models/Endereco.model';
import { Endereco } from '../../domain/Endereco';
import { UsuarioFirestoreService } from '../services/UsuarioFirestore.service';
import { Usuario } from '../../domain/Usuario';
import { UsuarioModel } from '../models/Usuario.model';

export interface CriarVerificacaoResidenciaDto {
  usuarioId: string;
  comprovanteUrl: string;
  enderecoId?: string;
  tipoComprovante?: string;
  observacoesUsuario?: string;
}

export interface AtualizarVerificacaoDto {
  status: ModeracaoStatus;
  moderadorId: string;
  observacoesModerador?: string;
  motivoRejeicao?: string;
}

@Injectable()
export class VerificacaoResidenciaRepository {
  constructor(private readonly usuarioFirestoreService: UsuarioFirestoreService) {}

  async salvar(
    props: VerificacaoResidencia,
  ): ResultadoAssincrono<string, ServicoExcecao> {
    try {
        const enderecoModel = EnderecoModel.criar({
            usuarioId: props.usuario.id, // retirar e testar se o typeorm salva sozinho
            rua: props.usuario.endereco.rua,
            cep: props.usuario.endereco.cep,
            numero: props.usuario.endereco.numero,
            bairro: props.usuario.endereco.bairro,
            cidade: props.usuario.endereco.cidade,
            estado: props.usuario.endereco.estado,
            latitude: props.usuario.endereco.latitude,
            longitude: props.usuario.endereco.longitude,
            pais: props.usuario.endereco.pais!
        })

        const usuarioModel = UsuarioModel.criar({
          email: props.usuario.email,
          nome: props.usuario.nome,
          endereco: enderecoModel,
          emailVerificado: props.usuario.emailVerificado,
          verificado: props.usuario.verificado,
          cpf: props.usuario.cpf,
          id: props.usuario.id
        })

        // futuramente usuario será uma entidade gerenciada por outro repository
        await usuarioModel.save();
        
        const verificacaoModel = VerificacaoResidenciaModel.criar({
            usuario: usuarioModel,
            comprovanteUrl: props.comprovanteUrl,
            observacoesUsuario: props.observacoesUsuario,
            tipoComprovante: props.tipoComprovante
        });

      const resultado = await verificacaoModel.save();

      return ResultadoUtil.sucesso(resultado.id);
    } catch (error) {
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao criar verificação'),
      );
    }
  }

  async atualizar(
    props: VerificacaoResidencia,
  ): ResultadoAssincrono<string, ServicoExcecao> {
    // futuramente usar typeorm para salvar com save()
    try {
      const verificacaoModel = await VerificacaoResidenciaModel.findOne({ where: { id: props.id } });
      if (!verificacaoModel) {
        return ResultadoUtil.falha(new ServicoExcecao('Verificação não encontrada para atualização'));
      }

      verificacaoModel.status = props.status;
      verificacaoModel.moderadorId = props.moderadorId;
      verificacaoModel.observacoesModerador = props.observacoesModerador;
      verificacaoModel.motivoRejeicao = props.motivoRejeicao;
      verificacaoModel.dataConclusao = props.dataConclusao;

      const resultado = await verificacaoModel.save();

      return ResultadoUtil.sucesso(resultado.id);
    } catch (error) {
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao atualizar verificação'),
      );
    }
  }

  async buscarPorId(id: string): ResultadoAssincrono<VerificacaoResidencia | null, ServicoExcecao> {
    try {
      const verificacao = await VerificacaoResidenciaModel.findOne({ 
        where: { id },
        relations: ['usuario', 'usuario.endereco']
      });

      if (!verificacao) {
        return ResultadoUtil.sucesso(null);
      }

      const enderecoDomain = Endereco.carregar({
        cep: verificacao.usuario.endereco.cep,
        rua: verificacao.usuario.endereco.rua,
        numero: verificacao.usuario.endereco.numero,
        complemento: verificacao.usuario.endereco.complemento,
        bairro: verificacao.usuario.endereco.bairro,
        cidade: verificacao.usuario.endereco.cidade,
        estado: verificacao.usuario.endereco.estado,
        pais: verificacao.usuario.endereco.pais,
        latitude: verificacao.usuario.endereco.latitude,
        longitude: verificacao.usuario.endereco.longitude,
      });

      const usuarioDomain = Usuario.carregar({
          nome: verificacao.usuario.nome,
          email: verificacao.usuario.email,
          cpf: verificacao.usuario.cpf,
          emailVerificado: verificacao.usuario.emailVerificado,
          atualizadoEm: verificacao.usuario.atualizadoEm,
          criadoEm: verificacao.usuario.criadoEm,
          verificado: verificacao.usuario.verificado,
          endereco: enderecoDomain,
          enderecoVerificado: verificacao.usuario.enderecoVerificado,
      }, verificacao.usuario.id);

      const verificacaoDomain = VerificacaoResidencia.carregar({
        comprovanteUrl: verificacao.comprovanteUrl,
        tipoComprovante: verificacao.tipoComprovante,
        status: verificacao.status,
        moderadorId: verificacao.moderadorId,
        observacoesUsuario: verificacao.observacoesUsuario,
        observacoesModerador: verificacao.observacoesModerador,
        motivoRejeicao: verificacao.motivoRejeicao,
        dataSubmissao: verificacao.createdAt,
        dataConclusao: verificacao.dataConclusao,
          usuario: usuarioDomain,
      }, verificacao.id);

      return ResultadoUtil.sucesso(verificacaoDomain);
    } catch (error) {
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao buscar verificação'),
      );
    }
  }

  async listarPendentes(
    limite: number = 50,
  ): ResultadoAssincrono<VerificacaoResidencia[], ServicoExcecao> {
    try {
      const verificacoes = await VerificacaoResidenciaModel.find({
        where: { status: ModeracaoStatus.EM_ANALISE },
        relations: ['usuario', 'usuario.endereco'], // JOIN com usuario e endereco
        order: { createdAt: 'ASC' },
        take: limite,
      });

      const verificacoesDomain: VerificacaoResidencia[] = [];
      for (const verificacao of verificacoes) {
        const enderecoDomain = Endereco.carregar({
          cep: verificacao.usuario.endereco.cep,
          rua: verificacao.usuario.endereco.rua,
          numero: verificacao.usuario.endereco.numero,
          complemento: verificacao.usuario.endereco.complemento,
          bairro: verificacao.usuario.endereco.bairro,
          cidade: verificacao.usuario.endereco.cidade,
          estado: verificacao.usuario.endereco.estado,
          pais: verificacao.usuario.endereco.pais,
          latitude: verificacao.usuario.endereco.latitude,
          longitude: verificacao.usuario.endereco.longitude,
        });

        const usuarioDomain = Usuario.carregar({
          nome: verificacao.usuario.nome,
          email: verificacao.usuario.email,
          cpf: verificacao.usuario.cpf,
          emailVerificado: verificacao.usuario.emailVerificado,
          atualizadoEm: verificacao.usuario.atualizadoEm,
          criadoEm: verificacao.usuario.criadoEm,
          verificado: verificacao.usuario.verificado,
          endereco: enderecoDomain,
          enderecoVerificado: verificacao.usuario.enderecoVerificado,
        }, verificacao.usuario.id);

        const verificacaoDomain = VerificacaoResidencia.carregar({
          comprovanteUrl: verificacao.comprovanteUrl,
          tipoComprovante: verificacao.tipoComprovante,
          status: verificacao.status,
          moderadorId: verificacao.moderadorId,
          observacoesUsuario: verificacao.observacoesUsuario,
          observacoesModerador: verificacao.observacoesModerador,
          motivoRejeicao: verificacao.motivoRejeicao,
          dataSubmissao: verificacao.createdAt,
          dataConclusao: verificacao.dataConclusao,
          usuario: usuarioDomain,
        }, verificacao.id);

        verificacoesDomain.push(verificacaoDomain);
      }

      return ResultadoUtil.sucesso(verificacoesDomain);
    } catch (error) {
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao listar verificações pendentes'),
      );
    }
  }

  async buscarPendentePorUsuarioId(usuarioId: string): ResultadoAssincrono<VerificacaoResidencia | null, ServicoExcecao> {
    try {
      const verificacao = await VerificacaoResidenciaModel.findOne({
        where: { usuario: { id: usuarioId }, status: ModeracaoStatus.EM_ANALISE },
        relations: ['usuario', 'usuario.endereco']
      });

      if (!verificacao) {
        return ResultadoUtil.falha(new Error('Nenhuma verificação pendente encontrada para este usuário'));
      }

      const enderecoDomain = Endereco.carregar({
        cep: verificacao.usuario.endereco.cep,
        rua: verificacao.usuario.endereco.rua,
        numero: verificacao.usuario.endereco.numero,
        complemento: verificacao.usuario.endereco.complemento,
        bairro: verificacao.usuario.endereco.bairro,
        cidade: verificacao.usuario.endereco.cidade,
        estado: verificacao.usuario.endereco.estado,
        pais: verificacao.usuario.endereco.pais,
        latitude: verificacao.usuario.endereco.latitude,
        longitude: verificacao.usuario.endereco.longitude,
      });

      const usuarioDomain = Usuario.carregar({
          nome: verificacao.usuario.nome,
          email: verificacao.usuario.email,
          cpf: verificacao.usuario.cpf,
          emailVerificado: verificacao.usuario.emailVerificado,
          atualizadoEm: verificacao.usuario.atualizadoEm,
          criadoEm: verificacao.usuario.criadoEm,
          verificado: verificacao.usuario.verificado,
          endereco: enderecoDomain,
          enderecoVerificado: verificacao.usuario.enderecoVerificado,
        }, verificacao.usuario.id);

      const verificacaoDomain = VerificacaoResidencia.carregar({
        comprovanteUrl: verificacao.comprovanteUrl,
        tipoComprovante: verificacao.tipoComprovante,
        status: verificacao.status,
        moderadorId: verificacao.moderadorId,
        observacoesUsuario: verificacao.observacoesUsuario,
        observacoesModerador: verificacao.observacoesModerador,
        motivoRejeicao: verificacao.motivoRejeicao,
        dataSubmissao: verificacao.createdAt,
        dataConclusao: verificacao.dataConclusao,
        usuario: usuarioDomain,
      }, verificacao.id);

      return ResultadoUtil.sucesso(verificacaoDomain);
    } catch (error) {
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao buscar verificação pendente'),
      );
    }
  }
}
