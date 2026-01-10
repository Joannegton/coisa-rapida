import { Inject, NotFoundException } from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import type { AssinaturaService } from '../../domain/services/assinatura.service';
import { Request } from 'express';
import { Utils, DataUtils } from 'src/shared/utils';
import { AssinarContratoDto } from '../dtos/assinar-contrato.dto';

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
    }
}
