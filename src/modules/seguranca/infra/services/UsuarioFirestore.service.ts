import { Injectable } from '@nestjs/common';
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from '../../../../shared/resultado';
import { FirebaseConfigService } from '../../../../config/firebase.config';
import * as admin from 'firebase-admin';
import { ModeracaoStatus } from '../models/VerificacaoResidencia.model';

export interface UsuarioFirestore {
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  emailVerificado: boolean;
  verificado: boolean;
  statusEndereco: ModeracaoStatus;
  endereco: EnderecoFirestore
  criadoEm: Date;
  atualizadoEm: Date;
}

export type EnderecoFirestore = {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pais: string;
    complemento?: string;
    latitude?: number;
    longitude?: number;
};

@Injectable()
export class UsuarioFirestoreService {
  private db: admin.firestore.Firestore;

  constructor(private readonly firebaseConfig: FirebaseConfigService) {
    this.db = this.firebaseConfig.getFirestore();
  }

  async buscarPorId(id: string): ResultadoAssincrono<UsuarioFirestore | null, ServicoExcecao> {
    try {
      const doc = await this.db.collection('usuarios').doc(id).get();

      const data = doc.data() as Omit<UsuarioFirestore, 'id'> | undefined;

      if (!doc.exists || !data) {
        return ResultadoUtil.sucesso(null);
      }

      const usuario: UsuarioFirestore = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cpf: data.cpf,
        emailVerificado: data.emailVerificado ?? false,
        statusEndereco: data.statusEndereco,
        endereco: {
          rua: data.endereco.rua,
          numero: data.endereco.numero,
          bairro: data.endereco.bairro,
          cidade: data.endereco.cidade,
          estado: data.endereco.estado,
          cep: data.endereco.cep,
          complemento: data.endereco?.complemento,
          pais: data.endereco?.pais,
          latitude: data.endereco?.latitude,
          longitude: data.endereco?.longitude,
        },
        verificado: data.verificado || false,
        criadoEm: data.criadoEm || new Date(),
        atualizadoEm: data.atualizadoEm || new Date(),
      };

      return ResultadoUtil.sucesso(usuario);
    } catch (error) {
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao buscar usuário no Firestore'),
      );
    }
  }

  async listarAdmins(): ResultadoAssincrono<UsuarioFirestore[], ServicoExcecao> {
    try {
      const snapshot = await this.db
        .collection('usuarios')
        .where('isAdmin', '==', true)
        .get();

      const admins: UsuarioFirestore[] = snapshot.docs
        .map(doc => {
          const data = doc.data() as Omit<UsuarioFirestore, 'id'> | undefined;

          if (!data) {
            return null;
          }

          return {
            id: doc.id,
            ...data,
            nome: data.nome,
            email: data.email,
            telefone: data.telefone,
            cpf: data.cpf,
            emailVerificado: data.emailVerificado ?? false,
            admin: true,
            statusEndereco: data.statusEndereco,
            endereco: {
              rua: data.endereco.rua,
              numero: data.endereco.numero,
              bairro: data.endereco.bairro,
              cidade: data.endereco.cidade,
              estado: data.endereco.estado,
              cep: data.endereco.cep,
              complemento: data.endereco.complemento,
              latitude: data.endereco.latitude,
              longitude: data.endereco.longitude,
              pais: data.endereco.pais,
            },
            verificado: data.verificado,
            criadoEm: data.criadoEm || new Date(),
            atualizadoEm: data.atualizadoEm || new Date(),
          } as UsuarioFirestore;
        })
        .filter((admin): admin is UsuarioFirestore => admin !== null);

      return ResultadoUtil.sucesso(admins);
    } catch (error) {
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao listar admins no Firestore'),
      );
    }
  }

  async atualizarUsuario(
    id: string,
    dados: Partial<Omit<UsuarioFirestore, 'id'>>,
  ): ResultadoAssincrono<string, ServicoExcecao> {
    try {
      const updateData: any = { ...dados };

      if (dados.criadoEm) {
        updateData.criadoEm = admin.firestore.Timestamp.fromDate(dados.criadoEm);
      }
      if (dados.atualizadoEm) {
        updateData.atualizadoEm = admin.firestore.Timestamp.fromDate(dados.atualizadoEm);
      }

      await this.db.collection('usuarios').doc(id).update(updateData);

      return ResultadoUtil.sucesso('Usuário atualizado com sucesso');
    } catch (error) {
      console.log('Erro ao atualizar usuário no Firestore:', error);
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao atualizar usuário no Firestore'),
      );
    }
  }
}
