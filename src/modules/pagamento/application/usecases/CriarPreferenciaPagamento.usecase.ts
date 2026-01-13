import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { MercadoPagoService } from '../../domain/services/mercado-pago.service';
import type { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PagamentoTipo } from '../../infra/models/pagamento.model';
import { Pagamento } from '../../domain/pagamento';
import type {
    AluguelResult,
    AluguelService,
} from '../../domain/services/aluguel.service';
import { PreferenciaPagamentoResponseDto } from '../dtos/preferencia-pagamento-response.dto';

type CriarPagamentoProps = {
    aluguelId: string;
    usuarioId: string;
    usuarioEmail: string;
};

@Injectable()
export class CriarPreferenciaPagamentoUsecase {
    private readonly logger = new Logger(CriarPreferenciaPagamentoUsecase.name);

    constructor(
        @Inject('AluguelService')
        private readonly aluguelService: AluguelService,
        @Inject('MercadoPagoService')
        private readonly mercadoPagoIntegration: MercadoPagoService,
        @Inject('PagamentoRepository')
        private readonly pagamentoRepository: PagamentoRepository,
    ) {}

    async execute(
        props: CriarPagamentoProps,
    ): Promise<PreferenciaPagamentoResponseDto> {
        const aluguel = await this.aluguelService.buscar(props.aluguelId);
        if (!aluguel) throw new NotFoundException('Aluguel não encontrado.');

        const tipoPagamento = this.determinarTipoPagamento(aluguel);

        const external_reference = `${props.aluguelId}, ${tipoPagamento}`;

        const preferencia =
            await this.mercadoPagoIntegration.criarPreferenciaPagamento({
                aluguelId: props.aluguelId,
                itemDescricao: aluguel.item.descricao,
                valor: aluguel.precoTotalComTaxa,
                itemNome: aluguel.item.nome,
                tipo: tipoPagamento,
                locatarioEmail: props.usuarioEmail,
                locatarioNome: aluguel.locatario.nome,
                externalReference: external_reference,
            });

        const pagamento = Pagamento.criar({
            tipo: PagamentoTipo.ALUGUEL,
            aluguelId: props.aluguelId,
            usuarioId: props.usuarioId,
            valor: aluguel.precoTotalComTaxa,
            metodoPagamento: 'mercado_pago',
            mercadoPagoPreferenciaId: preferencia.id!,
            dadosMercadoPago: {
                preferenciaId: preferencia.id,
                initPoint: preferencia.init_point,
                sandboxInitPoint: preferencia.sandbox_init_point,
                externalReference: external_reference,
                dataCriacao: new Date().toISOString(),
            },
        });

        await this.pagamentoRepository.salvar(pagamento);

        return {
            id: preferencia.id,
            init_point: preferencia.init_point,
            sandbox_init_point: preferencia.sandbox_init_point,
            aluguelId: props.aluguelId,
            pagamentoId: pagamento.id,
        };
    }

    private determinarTipoPagamento(
        aluguel: AluguelResult,
    ): 'aluguel' | 'venda' | 'caucao' | 'multa' {
        if (aluguel.caucao?.status === 'aguardando_pagamento') return 'caucao';
        if (aluguel.multa?.status === 'aguardando_pagamento') return 'multa';

        return 'aluguel';

        // implementar tipo venda
    }
}
