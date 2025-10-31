import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { TwilioService } from '../../infra/services/Twilio.service';
import { UsuarioFirestoreService } from '../../infra/services/UsuarioFirestore.service';
import { NotificacaoService } from '../../infra/services/Notificacao.service';
import { ResultadoAssincrono, ResultadoUtil } from 'src/shared/resultado';

export interface VerificarCodigoSMSProps {
  telefone: string;
  codigo: string;
  usuarioId: string;
}

@Injectable()
export class VerificarCodigoSMSUseCase {
  private readonly logger = new Logger(VerificarCodigoSMSUseCase.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly usuarioFirestoreService: UsuarioFirestoreService,
    private readonly notificacaoService: NotificacaoService,
  ) {}

  async execute(props: VerificarCodigoSMSProps): ResultadoAssincrono<string, Error> {
    const { telefone, codigo, usuarioId } = props;

    try {
      // Formatar telefone para padrão internacional
      const telefoneInternacional = this.twilioService.formatarTelefone(telefone);

      // Verificar código via Twilio
      const resultado = await this.twilioService.verificarCodigo(telefoneInternacional, codigo);

      if (resultado.ehFalha()) {
        return ResultadoUtil.falha(resultado.erro || new Error('Código de verificação inválido'));
      }

      // Atualizar telefone do usuário no Firestore
      const atualizarUsuarioFirebase = await this.usuarioFirestoreService.atualizarUsuario(usuarioId, {
        telefone: telefoneInternacional,
      });

      if (atualizarUsuarioFirebase.ehFalha()) {
        return ResultadoUtil.falha(atualizarUsuarioFirebase.erro || new Error('Falha ao atualizar usuário no Firebase'));
      }
      // Criar notificação de sucesso
      await this.notificacaoService.enviar({
        destinatarioId: usuarioId,
        titulo: 'Telefone verificado com sucesso! ✅',
        mensagem: 'Seu número de telefone foi verificado',
        dados: {
          tipo: 'telefone_verificado',
          rota: '/perfil',
        },
      });

      return ResultadoUtil.sucesso('Telefone verificado com sucesso!');
    } catch (error: any) {
      this.logger.error('Erro ao verificar código SMS:', error);
      return ResultadoUtil.falha(error.message || 'Erro ao verificar código SMS');
    }
  }
}
