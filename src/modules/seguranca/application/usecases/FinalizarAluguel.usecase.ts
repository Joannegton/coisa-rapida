import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Aluguel } from '../../domain/Aluguel';
import { AluguelRepository } from '../../infra/repositories/Aluguel.repository';
import { MercadoPagoTransferService } from '../../infra/services/mercado-pago-transfer.service';
import { MetodoPagamentoService } from '../../domain/services/metodo-pagamento.service';
import { MetodoPagamento } from '../../domain/Caucao';
import { Transferencia, TipoTransferencia, StatusTransferencia } from '../../domain/Transferencia';
import { FinalizarAluguelDto } from '../dtos/FinalizarAluguel.dto';
import { ResultadoAssincrono, ResultadoUtil } from 'src/shared/resultado';

@Injectable()
export class FinalizarAluguelUseCase {
  private readonly logger = new Logger(FinalizarAluguelUseCase.name);

  constructor(
    private readonly aluguelRepository: AluguelRepository,
    private readonly transferService: MercadoPagoTransferService,
    private readonly metodoPagamentoService: MetodoPagamentoService,
  ) {}

  async executar(props: FinalizarAluguelDto): ResultadoAssincrono<void, Error> {
    this.logger.log(`Iniciando finalização do aluguel ${props.aluguelId}`);

    // Buscar aluguel
    const aluguel = await this.aluguelRepository.buscarPorId(props.aluguelId);
    if (aluguel.ehFalha()) {
      return ResultadoUtil.falha(new NotFoundException(`Aluguel ${props.aluguelId} não encontrado`));
    }

    if (!aluguel.valor!.podeSerFinalizado()) {
      return ResultadoUtil.falha(new BadRequestException(
        `Aluguel não pode ser finalizado. Status atual: ${aluguel.valor!.status}`
      ));
    }

    // Calcular valores
    const taxaApp = aluguel.valor!.calcularTaxaApp();
    const valorLiquidoLocador = aluguel.valor!.calcularValorLiquidoLocador();
    
    let indenizacao = 0;
    
    if (props.houveDano) {
      if (props.valorIndenizacao !== undefined) {
        indenizacao = props.valorIndenizacao;
      } else if(aluguel.valor!.caucao) {
        // Indenização padrão: Caução - 10% da taxa do aluguel
        const taxaDeDesconto = taxaApp * 0.1;
        indenizacao = aluguel.valor!.caucao.valor - taxaDeDesconto;
      } else {
        // Sem caução: 2x do valor do aluguel
        indenizacao = aluguel.valor!.valorAluguel * 2;
      }

      this.logger.log(
        `Aluguel finalizado com dano. Indenização: R$ ${indenizacao.toFixed(2)}`
      );
    }

    aluguel.valor!.marcarComoFinalizado(props.houveDano, indenizacao);

    // Executar transferências conforme cenário (com ou sem caução)
    const resultadoTransferencias = await this.definirEstrategiaTransferencia(
      aluguel.valor!,
      taxaApp,
      indenizacao
    );
    if (resultadoTransferencias.ehFalha()) {
      return ResultadoUtil.falha(resultadoTransferencias.erro!);
    }

    const salvarAluguelResult = await this.aluguelRepository.salvar(aluguel.valor!);
    if (salvarAluguelResult.ehFalha()) {
      return ResultadoUtil.falha(salvarAluguelResult.erro!);
    }

    // // TODO: Enviar notificações para locador e locatário
    // const mensagemReembolso = this.metodoPagamentoService.gerarMensagemReembolso(
    //     aluguel.valor!.caucao ? aluguel.valor!.caucao.metodoPagamento : undefined, 
    //     retornoLocatario.valor!
    //   );
    
    return ResultadoUtil.sucesso();
  }

  /**
   * Define estratégia de transferência conforme cenário
   * 
   * CENÁRIO 1 - COM CAUÇÃO:
   * - Locador já recebeu via pagamento de caução
   * - Locatário recebe reembolso da caução (se sobrou)
   * 
   * CENÁRIO 2 - SEM CAUÇÃO:
   * - Locatário é cobrado pelo aluguel
   * - Transferência manual necessária ao locador
   */
  private async definirEstrategiaTransferencia(
    aluguel: Aluguel,
    taxaApp: number,
    indenizacao: number,
  ): ResultadoAssincrono<void, Error> {
    
    if (aluguel.caucao && aluguel.caucao.estaPaga()) {
      // CENÁRIO COM CAUÇÃO: Caucao já foi paga como depósito
      const transferenciaComCaucaoResult = await this.executarTransferenciasComCaucao(aluguel, taxaApp, indenizacao);
      if (transferenciaComCaucaoResult.ehFalha()) {
        return ResultadoUtil.falha(transferenciaComCaucaoResult.erro!);
      }
      return ResultadoUtil.sucesso();
    } else {
      // CENÁRIO SEM CAUÇÃO: Locatário paga pelo aluguel
      const transferenciaSemCaucaoResult = await this.executarTransferenciasSemCaucao(
        aluguel,
        taxaApp,
        indenizacao
      );
      if (transferenciaSemCaucaoResult.ehFalha()) {
        return ResultadoUtil.falha(transferenciaSemCaucaoResult.erro!);
      }
      return ResultadoUtil.sucesso();
    }
  }

  /**
   * CENÁRIO 1: Com Caução (já paga)
   * 
   * Fluxo:
   * 1. Taxa app retida (já na nossa conta)
   * 2. Locador já recebeu via caução (pauta apenas ao finalizar)
   * 3. Locatário recebe reembolso da caução excedente (se houver)
   */
  private async executarTransferenciasComCaucao(
    aluguel: Aluguel,
    taxaApp: number,
    indenizacao: number,
  ): ResultadoAssincrono<void, Error> {
    
    this.logger.log('========== FINALIZAÇÃO COM CAUÇÃO ==========');
    this.logger.log(`💰 Taxa da plataforma retida: R$ ${taxaApp.toFixed(2)}`);
    this.logger.log(`📋 Cenário: Caução já paga - Reembolso do excedente`);
    
    const caucao = aluguel.caucao!;
    const retornoLocatario = aluguel.calcularRetornoLocatarioComIndenizacao(indenizacao);
    if (retornoLocatario.ehFalha())
      return ResultadoUtil.falha(retornoLocatario.erro!);
    
    let reembolsoLocatarioId: number | undefined;
    const erros: string[] = [];

    // Reembolsar locatário (valor restante da caução)
    if (retornoLocatario.valor! > 0 && caucao.paymentId) {
      this.logger.log(
        `💳 Reembolsando R$ ${retornoLocatario.valor!.toFixed(2)} para locatário ${aluguel.locatario.nome}`
      );
      
      const metodoPagamento = caucao.metodoPagamento;     

      const transferenciaLocatario = Transferencia.criar({
        aluguelId: aluguel.id,
        tipo: TipoTransferencia.REEMBOLSO_LOCATARIO,
        valor: retornoLocatario.valor!,
        contaDestinoId: aluguel.locatario.id,
        nomeDestino: aluguel.locatario.nome,
        descricao: indenizacao > 0 
          ? `Devolução parcial da caução (com indenização) - ${aluguel.item.nome}`
          : `Devolução da caução - ${aluguel.item.nome}`,
        status: StatusTransferencia.PROCESSANDO,
      });

      if (transferenciaLocatario.ehFalha()) {
        return ResultadoUtil.falha(transferenciaLocatario.erro!);
      }
      const adicionarTransferenciaLocatario = aluguel.adicionarTransferencia(transferenciaLocatario.valor!);
      if (adicionarTransferenciaLocatario.ehFalha()) {
        return ResultadoUtil.falha(adicionarTransferenciaLocatario.erro!);
      }
      
      // Estratégia de reembolso baseada no método de pagamento
      const resultadoReembolso = await this.processarReembolsoComMetodo(
        String(caucao.paymentId),
        retornoLocatario.valor!,
        metodoPagamento,
        aluguel.locatario,
        transferenciaLocatario.valor!.descricao
      );

      if (resultadoReembolso.ehFalha()) {
        return ResultadoUtil.falha(resultadoReembolso.erro!);
      }
      reembolsoLocatarioId = resultadoReembolso.valor!.id;
      
      // Marcar transferência como processando
      const marcarProcessando = aluguel.atualizarStatusTransferencia(
        transferenciaLocatario.valor!.id,
        StatusTransferencia.PROCESSANDO
      );
      if (marcarProcessando.ehFalha()) {
        return ResultadoUtil.falha(marcarProcessando.erro!);
      }
      
      this.logger.log(`✅ Reembolso para locatário realizado: ID ${reembolsoLocatarioId}`);
    } else if (retornoLocatario.valor! <= 0) {
      this.logger.log('Sem valor a reembolsar para locatário (caução consumida totalmente)');
    }

    return ResultadoUtil.sucesso();
  }

  /**
   * CENÁRIO 2: Sem Caução
   * 
   * Fluxo:
   * 1. Locatário é cobrado pelo aluguel
   * 2. Taxa app retida
   * 3. Locador recebe valor líquido (manual ou automático conforme Pix)
   */
  private async executarTransferenciasSemCaucao(
    aluguel: Aluguel,
    valorLiquidoLocador: number,
    indenizacao: number,
  ): ResultadoAssincrono<void, Error> {
    
    this.logger.log('========== FINALIZAÇÃO SEM CAUÇÃO ==========');
    this.logger.log(`💰 Locatário deve pagar: R$ ${aluguel.valorAluguel.toFixed(2)}`);
    this.logger.log(`📋 Cenário: Sem caução - Transferência manual ao locador`);
    
    let transferLocadorId: string | undefined;

    // Gerar instruções para transferência manual ao locador
    const valorParaLocador = valorLiquidoLocador + indenizacao;
    
    if (valorParaLocador > 0) {
      this.logger.log(`📤 Gerando instruções para transferência de R$ ${valorParaLocador.toFixed(2)} ao locador ${aluguel.locador.nome}`);
      
      // Criar registro da transferência MANUAL
      const transferenciaLocador = Transferencia.criar({
        aluguelId: aluguel.id,
        tipo: indenizacao > 0 ? TipoTransferencia.INDENIZACAO : TipoTransferencia.PAGAMENTO_LOCADOR,
        valor: valorParaLocador,
        contaDestinoId: aluguel.locador.id,
        nomeDestino: aluguel.locador.nome,
        chavePix: aluguel.locador.chavePix,
        descricao: indenizacao > 0 
          ? `Aluguel + Indenização - ${aluguel.item.nome}` 
          : `Aluguel - ${aluguel.item.nome}`,
        status: StatusTransferencia.PENDENTE,
      });

      if (transferenciaLocador.ehFalha()) {
        return ResultadoUtil.falha(transferenciaLocador.erro!);
      }
      
      transferLocadorId = transferenciaLocador.valor!.id;
      const adicionarTransferenciaLocador = aluguel.adicionarTransferencia(transferenciaLocador.valor!);
      if (adicionarTransferenciaLocador.ehFalha()) {
        return ResultadoUtil.falha(adicionarTransferenciaLocador.erro!);
      }
        
      // Gerar instruções de transferência manual
      const instrucoesTransfer = this.transferService.gerarInstrucoesTransferenciaManual({
        valor: valorParaLocador,
        destinatario: aluguel.locador.nome,
        chavePix: aluguel.locador.chavePix,
        descricao: transferenciaLocador.valor!.descricao,
      });

      // Atualizar transferência através do agregado com instruções
      const marcarAguardandoManual = aluguel.marcarTransferenciaAguardandoManual(
        transferenciaLocador.valor!.id,
        instrucoesTransfer.instrucoes
      );
      if (marcarAguardandoManual.ehFalha()) {
        return ResultadoUtil.falha(marcarAguardandoManual.erro!);
      }

      this.logger.log(`📝 Instruções geradas: ${instrucoesTransfer.instrucoes}`);
      this.logger.log(`⏳ Transferência aguardando execução manual`);

      return ResultadoUtil.sucesso();
    }

    this.logger.log('Sem valor a transferir ao locador');
    
    return ResultadoUtil.sucesso();
  }

  /**
   * Processa reembolso considerando o método de pagamento
   */
  private async processarReembolsoComMetodo(
    paymentId: string,
    valor: number,
    metodo: MetodoPagamento,
    locatario: any,
    descricao: string,
  ) {
    // Validações por método
    if (this.metodoPagamentoService.precisaUsarPixParaDevolver(metodo)) {
      // Cartão de crédito: precisa de Pix para devolver
      if (!locatario.chavePix && metodo === MetodoPagamento.CARTAO_CREDITO) {
        this.logger.warn(
          `⚠️  Locatário pagou via cartão de crédito mas não tem chavePix registrada. ` +
          `Tentando reembolso automático mesmo assim.`
        );
      }
    }

    // Executar reembolso automático
    return this.transferService.reembolsar({
      paymentId,
      valor,
      motivo: descricao,
    });
  }
}
