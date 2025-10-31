import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from 'src/shared/resultado';
import twilio from 'twilio';

export type EnviarSMSResult = {
  sid?: string;
  status?: string;
}

export type VerificarSMSResult = {
  status?: string;
  valid: boolean;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: twilio.Twilio;
  private verifySid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.verifySid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

    this.client = twilio(accountSid, authToken);
  }

  async enviarCodigoVerificacao(telefone: string): ResultadoAssincrono<EnviarSMSResult, ServicoExcecao> {
    try {
      const verification = await this.client.verify.v2
        .services(this.verifySid)
        .verifications.create({
          to: telefone,
          channel: 'sms',
          locale: 'pt-BR',
        });


      return ResultadoUtil.sucesso({
        sid: verification.sid,
        status: verification.status,
      });
    } catch (error) {
      this.logger.error('Erro ao enviar SMS via Twilio:', error);
      
      // Erro 60200: numero invalido
      if (error.code === 60200) {
        return ResultadoUtil.falha(new ServicoExcecao('Número de telefone inválido ou não suportado'));
      }

      return ResultadoUtil.falha(new ServicoExcecao(`Erro ao enviar SMS: ${error.message || 'Erro desconhecido'}`));
    }
  }

  async verificarCodigo(telefone: string, codigo: string): ResultadoAssincrono<VerificarSMSResult, ServicoExcecao> {
    try {
      this.logger.log(`Verificando código para ${telefone}`);
      
      const verificationCheck = await this.client.verify.v2
        .services(this.verifySid)
        .verificationChecks.create({
          to: telefone,
          code: codigo,
        });

      this.logger.log(`Verificação concluída. Status: ${verificationCheck.status}`);

      const isValid = verificationCheck.status === 'approved';

      return ResultadoUtil.sucesso({
        status: verificationCheck.status,
        valid: isValid,
      });
    } catch (error) {
      this.logger.error('Erro ao verificar código SMS:', error);
      
      // Se o código estiver errado, o Twilio retorna status 404
      if (error.status === 404 || error.code === 20404) {
        return ResultadoUtil.falha(new ServicoExcecao('Código de verificação inválido'));
      }

      throw new InternalServerErrorException(
        `Erro ao verificar código: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  /**
   * Formata telefone brasileiro para padrão internacional
   * Exemplo: 11987654321 -> +5511987654321
   * Exemplo: 1187654321 -> +551187654321
   */
  formatarTelefone(telefone: string): string {
    // Remove caracteres não numéricos
    const numeroLimpo = telefone.replace(/\D/g, '');

    // Valida se é um telefone brasileiro válido (10 ou 11 dígitos)
    if (!/^\d{10,11}$/.test(numeroLimpo)) {
      throw new Error('Telefone inválido. Use formato com DDD (10 ou 11 dígitos)');
    }

    return `+55${numeroLimpo}`;
  }
}
