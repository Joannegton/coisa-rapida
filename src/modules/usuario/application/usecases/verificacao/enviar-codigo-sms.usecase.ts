import { Injectable } from '@nestjs/common';
import { TwilioService } from '../../../infra/services/Twilio.service';
import { EnviarCodigoSMSDto } from '../../dtos/verificacao/verificacao-sms.dto';

export interface EnviarCodigoSMSResponse {
    mensagem: string;
}

@Injectable()
export class EnviarCodigoSMSUseCase {
    constructor(private readonly twilioService: TwilioService) {}

    async execute(props: EnviarCodigoSMSDto): Promise<EnviarCodigoSMSResponse> {
        const telefoneInternacional =
            this.twilioService.formatarTelefoneParaInternacional(
                props.telefone,
            );

        await this.twilioService.enviarCodigoVerificacao(telefoneInternacional);

        return { mensagem: 'Código de verificação enviado com sucesso' };
    }
}
