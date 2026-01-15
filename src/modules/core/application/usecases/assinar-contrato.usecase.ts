import { Inject, NotFoundException } from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import type { AssinaturaService } from '../../domain/services/assinatura.service';
import { Request } from 'express';
import { Utils, DataUtils } from 'src/shared/utils';
import { AssinarContratoDto } from '../dtos/assinar-contrato.dto';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

type AssinarContratoProps = AssinarContratoDto & {
    aluguelId: string;
    usuarioId: string;
    request: Request;
};

export class AssinarContratoUsecase {
    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject('AssinaturaService')
        private readonly assinaturaService: AssinaturaService,
        private readonly auditoriaFilaService: AuditoriaFilaService,
    ) {}

    async execute(props: AssinarContratoProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);
        if (!aluguel) throw new NotFoundException('Aluguel não encontrado');

        const ip = Utils.obterIpCliente(props.request);
        const enderecoIp = Utils.normalizarIp(ip);

        const userAgent = props.request.headers['user-agent'] || '';

        const isLocador = aluguel.locador.id === props.usuarioId;

        const assinaturaDigital = this.assinaturaService.gerarAssinaturaDigital(
            {
                aluguelId: props.aluguelId,
                usuarioId: props.usuarioId,
                usuarioTipo: isLocador ? 'locador' : 'locatario',
                enderecoIp: enderecoIp,
                userAgent: userAgent,
                dataHora: DataUtils.agoraDate(),
            },
        );

        aluguel.assinarContrato({
            assinaturaDigital: assinaturaDigital,
            enderecoIp: enderecoIp,
            userAgent: userAgent,
            latitude: props.latitude,
            longitude: props.longitude,
            usuarioId: props.usuarioId,
        });

        await this.aluguelRepository.salvar(aluguel);

        // Agenda auditoria na fila com retry automático
        await this.auditoriaFilaService.agendarAuditoria({
            timestamp: DataUtils.agoraDate(),
            usuarioId: props.usuarioId,
            acao: AuditoriaAcao.ASSINAR_CONTRATO,
            recurso: 'contrato',
            recursoId: props.aluguelId,
            descricao: `Assinatura digital de contrato de aluguel - ${isLocador ? 'Locador' : 'Locatário'}`,
            nivel: 'critico',
            ip: enderecoIp,
            userAgent: userAgent,
            estadoAntes: {
                contratoAssinado: aluguel.contrato.estaAssinado()
                    ? 'parcialmente'
                    : 'nao_assinado',
            },
            estadoDepois: {
                contratoAssinado: aluguel.contrato.estaAssinado()
                    ? 'totalmente'
                    : 'parcialmente',
                assinaturaDigitalHash:
                    assinaturaDigital.substring(0, 20) + '...',
                latitude: props.latitude,
                longitude: props.longitude,
            },
        });
    }
}
