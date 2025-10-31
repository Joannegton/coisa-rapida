import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { PagamentoModel, PagamentoStatusEnum, PagamentoTipoEnum, PagamentoMetodoEnum } from '../typeorm/pagamento.entity';

export interface CreatePagamentoDto {
  id: string;
  tipo: PagamentoTipoEnum;
  aluguel_id?: string | null;
  multa_id?: string | null;
  pagador_id: string;
  recebedor_id: string;
  valor_bruto: number;
  taxa_plataforma?: number;
  taxa_pagamento?: number;
  valor_liquido: number;
  metodo: PagamentoMetodoEnum;
  status?: PagamentoStatusEnum;
  gateway_provider?: string;
  gateway_transacao_id?: string;
  gateway_response?: Record<string, any>;
  pix_chave?: string;
  pix_qrcode?: string;
  boleto_url?: string;
  boleto_codigo_barras?: string;
  cartao_ultimos_digitos?: string;
  cartao_bandeira?: string;
  data_vencimento?: Date;
  data_pagamento?: Date;
  data_compensacao?: Date;
  reembolsado?: boolean;
  data_reembolso?: Date;
  motivo_reembolso?: string;
}

export interface UpdatePagamentoDto {
  status?: PagamentoStatusEnum;
  gateway_transacao_id?: string;
  gateway_response?: Record<string, any>;
  data_pagamento?: Date;
  data_compensacao?: Date;
  reembolsado?: boolean;
  data_reembolso?: Date;
  motivo_reembolso?: string;
}

@Injectable()
export class PagamentoRepository {
  private repository: Repository<PagamentoModel>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(PagamentoModel);
  }

  /**
   * Criar novo pagamento
   */
  async criar(dados: CreatePagamentoDto): Promise<PagamentoModel> {
    const pagamento = PagamentoModel.criar({
      ...dados,
      status: dados.status || PagamentoStatusEnum.PENDENTE,
    });
    return this.repository.save(pagamento);
  }

  /**
   * Buscar pagamento por ID
   */
  async buscarPorId(id: string): Promise<PagamentoModel | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['pagador', 'recebedor'],
    });
  }

  /**
   * Buscar pagamento por ID de transação do Mercado Pago
   */
  async buscarPorMercadoPagoId(mercadoPagoId: string): Promise<PagamentoModel | null> {
    return this.repository.findOne({
      where: { gateway_transacao_id: mercadoPagoId },
      relations: ['pagador', 'recebedor'],
    });
  }

  /**
   * Buscar pagamentos de um aluguel
   */
  async buscarPorAluguelId(aluguelId: string): Promise<PagamentoModel[]> {
    return this.repository.find({
      where: { aluguel_id: aluguelId },
      relations: ['pagador', 'recebedor'],
      order: { criadoEm: 'DESC' },
    });
  }

  /**
   * Buscar pagamentos de um usuário (como pagador)
   */
  async buscarPorPagadorId(pagadorId: string, status?: PagamentoStatusEnum): Promise<PagamentoModel[]> {
    const query = this.repository
      .createQueryBuilder('pagamento')
      .where('pagamento.pagador_id = :pagadorId', { pagadorId });

    if (status) {
      query.andWhere('pagamento.status = :status', { status });
    }

    return query
      .leftJoinAndSelect('pagamento.pagador', 'pagador')
      .leftJoinAndSelect('pagamento.recebedor', 'recebedor')
      .orderBy('pagamento.criadoEm', 'DESC')
      .getMany();
  }

  /**
   * Buscar pagamentos de um usuário (como recebedor)
   */
  async buscarPorRecebedorId(recebedorId: string, status?: PagamentoStatusEnum): Promise<PagamentoModel[]> {
    const query = this.repository
      .createQueryBuilder('pagamento')
      .where('pagamento.recebedor_id = :recebedorId', { recebedorId });

    if (status) {
      query.andWhere('pagamento.status = :status', { status });
    }

    return query
      .leftJoinAndSelect('pagamento.pagador', 'pagador')
      .leftJoinAndSelect('pagamento.recebedor', 'recebedor')
      .orderBy('pagamento.criadoEm', 'DESC')
      .getMany();
  }

  /**
   * Buscar pagamentos pendentes
   */
  async buscarPendentes(limite: number = 50): Promise<PagamentoModel[]> {
    return this.repository.find({
      where: { status: PagamentoStatusEnum.PENDENTE },
      relations: ['pagador', 'recebedor'],
      order: { criadoEm: 'ASC' },
      take: limite,
    });
  }

  /**
   * Atualizar pagamento
   */
  async atualizar(id: string, dados: UpdatePagamentoDto): Promise<PagamentoModel | null> {
    await this.repository.update(id, dados);
    return this.buscarPorId(id);
  }

  /**
   * Atualizar status do pagamento
   */
  async atualizarStatus(id: string, status: PagamentoStatusEnum): Promise<PagamentoModel | null> {
    await this.repository.update(id, { status });
    return this.buscarPorId(id);
  }

  /**
   * Marcar como reembolsado
   */
  async reembolsar(id: string, motivo: string): Promise<PagamentoModel | null> {
    await this.repository.update(id, {
      reembolsado: true,
      data_reembolso: new Date(),
      motivo_reembolso: motivo,
      status: PagamentoStatusEnum.REEMBOLSADO,
    });
    return this.buscarPorId(id);
  }

  /**
   * Deletar pagamento (soft delete)
   */
  async deletar(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Contar pagamentos por status
   */
  async contarPorStatus(status: PagamentoStatusEnum): Promise<number> {
    return this.repository.count({
      where: { status },
    });
  }

  /**
   * Somar valores pagos no período
   */
  async somarPagamentosNoPeríodo(dataInicio: Date, dataFim: Date): Promise<number> {
    const resultado = await this.repository
      .createQueryBuilder('pagamento')
      .select('SUM(pagamento.valor_liquido)', 'total')
      .where('pagamento.status = :status', { status: PagamentoStatusEnum.APROVADO })
      .andWhere('pagamento.data_pagamento >= :dataInicio', { dataInicio })
      .andWhere('pagamento.data_pagamento <= :dataFim', { dataFim })
      .getRawOne();

    return parseFloat(resultado?.total || 0);
  }

  /**
   * Buscar com paginação
   */
  async buscarComPaginacao(
    pagina: number = 1,
    limite: number = 20,
    filtros?: {
      status?: PagamentoStatusEnum;
      tipo?: PagamentoTipoEnum;
      pagadorId?: string;
      recebedorId?: string;
    },
  ): Promise<{ dados: PagamentoModel[]; total: number; paginas: number }> {
    const query = this.repository.createQueryBuilder('pagamento');

    if (filtros?.status) {
      query.andWhere('pagamento.status = :status', { status: filtros.status });
    }

    if (filtros?.tipo) {
      query.andWhere('pagamento.tipo = :tipo', { tipo: filtros.tipo });
    }

    if (filtros?.pagadorId) {
      query.andWhere('pagamento.pagador_id = :pagadorId', { pagadorId: filtros.pagadorId });
    }

    if (filtros?.recebedorId) {
      query.andWhere('pagamento.recebedor_id = :recebedorId', { recebedorId: filtros.recebedorId });
    }

    const skip = (pagina - 1) * limite;
    const [dados, total] = await query
      .leftJoinAndSelect('pagamento.pagador', 'pagador')
      .leftJoinAndSelect('pagamento.recebedor', 'recebedor')
      .orderBy('pagamento.criadoEm', 'DESC')
      .skip(skip)
      .take(limite)
      .getManyAndCount();

    return {
      dados,
      total,
      paginas: Math.ceil(total / limite),
    };
  }
}
