import { Injectable } from '@nestjs/common';
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from '../../../../shared/resultado';
import * as admin from 'firebase-admin';

export type NotificacaoProps = {
    destinatarioId: string;
    titulo: string;
    mensagem: string;
    dados: DadosNotificacaoProps;
}

type DadosNotificacaoProps = {
    aluguelId?: string;
    tipo: string;
    rota: string;
}

@Injectable()
export class NotificacaoService {
  async enviar(props: NotificacaoProps): ResultadoAssincrono<string, ServicoExcecao> {
    try {
      const notificationSaveResult = await admin.firestore().collection('notificacoes').add({
        destinatarioId: props.destinatarioId,
        tipo: props.dados.tipo,
        titulo: props.titulo,
        mensagem: props.mensagem,
        dados: props.dados,
        dataCriacao: admin.firestore.FieldValue.serverTimestamp(),
        lida: false,
      });

      if (!notificationSaveResult.id) {
        throw new Error('Erro ao salvar notificação no Firestore');
      }

      // 2 - Buscar o token FCM do usuário
      const userDoc = await admin.firestore().collection('usuarios').doc(props.destinatarioId).get();

      if (!userDoc.exists) {
        return ResultadoUtil.falha(new ServicoExcecao('Usuário destinatário não encontrado'));
      }

      const fcmToken = userDoc.data()?.fcmToken;

      if (!fcmToken) {
        return ResultadoUtil.falha(new ServicoExcecao('Usuário não possui token FCM'));
      }

      // 3 - Enviar notificação push via Firebase Admin SDK
      const message = {
        token: fcmToken,
        notification: {
          title: props.titulo,
          body: props.mensagem,
        },
        data: {
          aluguelId: props.dados.aluguelId?.toString() || '',
          tipo: props.dados.tipo,
          rota: props.dados.rota,
          notificacaoId: notificationSaveResult.id,
        },
      };

      try {
        await admin.messaging().send(message);
      } catch (fcmError: any) {
        // Se o token FCM é inválido, remover do Firestore
        if (fcmError.code === 'messaging/registration-token-not-registered' ||
            fcmError.code === 'messaging/invalid-registration-token') {
          await admin.firestore().collection('usuarios').doc(props.destinatarioId).update({
            fcmToken: admin.firestore.FieldValue.delete()
          });
          return ResultadoUtil.falha(new ServicoExcecao('Token FCM inválido ou expirado. Token removido.'));
        }
        throw fcmError;
      }

      return ResultadoUtil.sucesso(notificationSaveResult.id);
    } catch (error: any) {
      return ResultadoUtil.falha(
        new ServicoExcecao(error?.message || 'Erro ao enviar notificação'),
      );
    }
  }
}