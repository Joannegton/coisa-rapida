import { Injectable, Logger } from '@nestjs/common';
import { TwilioService } from '../../infra/services/Twilio.service';
import { ResultadoAssincrono, ResultadoUtil } from 'src/shared/utils/resultado';

export interface EnviarCodigoSMSProps {
    telefone: string;
    usuarioId?: string;
}

@Injectable()
export class EnviarCodigoSMSUseCase {
    private readonly logger = new Logger(EnviarCodigoSMSUseCase.name);

    constructor(private readonly twilioService: TwilioService) {}

    async execute(
        props: EnviarCodigoSMSProps,
    ): ResultadoAssincrono<string, Error> {
        const { telefone, usuarioId } = props;
        // validar usuario antes para n fechar somente a aplicação

        const telefoneInternacional =
            this.twilioService.formatarTelefone(telefone);

        // Enviar código via Twilio
        const resultado = await this.twilioService.enviarCodigoVerificacao(
            telefoneInternacional,
        );

        if (resultado.ehFalha()) {
            return ResultadoUtil.falha(
                resultado.erro ||
                    new Error('Falha ao enviar código de verificação'),
            );
        }

        return ResultadoUtil.sucesso('Código de verificação enviado por SMS');
    }
}
