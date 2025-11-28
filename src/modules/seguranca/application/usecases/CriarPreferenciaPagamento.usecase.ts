import {
  ResultadoAssincrono,
  ResultadoUtil,
  ServicoExcecao,
} from 'src/shared/resultado';
import { CriarCheckoutDto } from '../dtos/Pagamento.dto';
import { MercadoPagoService } from 'src/modules/seguranca/infra/services/mercado-pago.service';
import { PagamentoRepository } from 'src/modules/seguranca/infra/repositories/pagamento.repository';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import {
  PagamentoTipoEnum,
  PagamentoMetodoEnum,
  PagamentoStatusEnum,
} from 'src/modules/seguranca/infra/typeorm/pagamento.entity';

type CriarPreferenciaPagamentoExceptions = ServicoExcecao | Error;

type PreferenciaPagamentoResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  aluguelId: string;
  pagamentoId: string;
};

@Injectable()
export class CriarCheckoutUsecase {
  private readonly logger = new Logger(CriarCheckoutUsecase.name);

  constructor(
    private readonly mercadoPagoIntegration: MercadoPagoService,
    private readonly pagamentoRepository: PagamentoRepository,
  ) {}

  async execute(
    props: CriarCheckoutDto,
  ): ResultadoAssincrono<
    PreferenciaPagamentoResponse,
    CriarPreferenciaPagamentoExceptions
  > {
    // Criar preferência no Mercado Pago
    const preferencia =
      await this.mercadoPagoIntegration.criarPreferenciaPagamento(props);
    if (preferencia.ehFalha()) return ResultadoUtil.falha(preferencia.erro!);

    // Criar registro de pagamento pendente no banco
    const pagamentoId = uuidv4();

    // Converter aluguelId (timestamp) para UUID válido usando namespace v5
    const NAMESPACE_ALUGUEL = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Namespace UUID padrão
    const aluguelUuid = uuidv5(props.aluguelId, NAMESPACE_ALUGUEL);

    try {
      await this.pagamentoRepository.criar({
        id: pagamentoId,
        tipo: PagamentoTipoEnum.ALUGUEL,
        aluguel_id: aluguelUuid, // Usar UUID convertido
        pagador_id: props.locatarioId, // ID do usuário (Firebase UID)
        recebedor_id: props.locadorId, // ID do usuário (Firebase UID)
        valor_bruto: props.valor,
        taxa_plataforma: 0,
        taxa_pagamento: 0,
        valor_liquido: props.valor,
        metodo: PagamentoMetodoEnum.MERCADO_PAGO,
        status: PagamentoStatusEnum.PENDENTE,
        gateway_provider: 'mercadopago',
        gateway_transacao_id: String(preferencia.valor?.id),
        gateway_response: preferencia.valor,
      });

      this.logger.log(
        `Pagamento pendente criado no banco: ${pagamentoId} com MP ID: ${preferencia.valor?.id} | Pagador: ${props.locatarioId} | Recebedor: ${props.locadorId}`,
      );
    } catch (error) {
      this.logger.error(`Erro ao criar pagamento no banco: ${error.message}`);
      // Continuar mesmo com erro, pois a preferência já foi criada
    }

    const preferenciaPagamentoDto = {
      id: preferencia.valor?.id,
      init_point: preferencia.valor?.init_point,
      sandbox_init_point: preferencia.valor?.sandbox_init_point,
      aluguelId: props.aluguelId,
      pagamentoId,
    };

    return ResultadoUtil.sucesso(preferenciaPagamentoDto);
  }
}
