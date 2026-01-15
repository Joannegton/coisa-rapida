import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    Inject,
} from '@nestjs/common';
import { TwilioService } from '../../../infra/services/Twilio.service';
import type { UsuarioRepository } from 'src/modules/usuario/domain/repositories/usuario.repository';

export interface VerificarCodigoSMSProps {
    telefone: string;
    codigo: string;
    usuarioId: string;
}

export interface VerificarCodigoSMSResult {
    mensagem: string;
}

@Injectable()
export class VerificarCodigoSMSUseCase {
    private readonly logger = new Logger(VerificarCodigoSMSUseCase.name);

    constructor(
        private readonly twilioService: TwilioService,
        @Inject('UsuarioRepository')
        private readonly usuarioRepository: UsuarioRepository,
        // private readonly notificacaoService: NotificacaoService,
    ) {}

    async execute(
        props: VerificarCodigoSMSProps,
    ): Promise<VerificarCodigoSMSResult> {
        const telefoneInternacional =
            this.twilioService.formatarTelefoneParaInternacional(
                props.telefone,
            );

        const resultado = await this.twilioService.verificarCodigo(
            telefoneInternacional,
            props.codigo,
        );

        if (!resultado.valid)
            throw new BadRequestException('Código de verificação inválido');

        const usuario = await this.usuarioRepository.buscarPorId(
            props.usuarioId,
            true,
        );

        if (!usuario) throw new NotFoundException('Usuário não encontrado');

        usuario.verificarTelefone(telefoneInternacional);

        await this.usuarioRepository.salvar(usuario);

        //TODO
        //  await this.notificacaoService.enviar({
        //     destinatarioId: props.usuarioId,
        //     titulo: 'Telefone verificado com sucesso! ✅',
        //     mensagem: 'Seu número de telefone foi verificado',
        //     dados: {
        //         tipo: 'telefone_verificado',
        //         rota: '/perfil',
        //     },
        // });

        return { mensagem: 'Telefone verificado com sucesso' };
    }
}
