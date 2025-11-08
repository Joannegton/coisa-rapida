import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Aluguel } from '../../domain/Aluguel';
import { AluguelRepository } from '../../infra/repositories/Aluguel.repository';
import { CaucaoRepository } from '../../infra/repositories/Caucao.repository';
import { TransferenciaRepository } from '../../infra/repositories/Transferencia.repository';
import { MercadoPagoTransferService } from '../../infra/services/mercado-pago-transfer.service';
import { StatusCaucao } from '../../domain/Caucao';
import { Transferencia, TipoTransferencia, StatusTransferencia } from '../../domain/Transferencia';
import { FinalizarAluguelDto } from '../dtos/FinalizarAluguel.dto';

export interface FinalizarAluguelResponse {
  aluguelId: string;
  mensagem: string;
  detalhes: {
    taxaApp: number;
    valorLiquidoLocador: number;
    retornoLocatario: number;
    indenizacao?: number;
  };
  transferencias?: {
    transferLocadorId?: number;
    reembolsoLocatarioId?: number;
    status: string;
  };
}

@Injectable()
export class FinalizarAluguelUseCase {
  private readonly logger = new Logger(FinalizarAluguelUseCase.name);

  constructor(
    private readonly aluguelRepository: AluguelRepository,
    private readonly caucaoRepository: CaucaoRepository,
    private readonly transferenciaRepository: TransferenciaRepository,
    private readonly transferService: MercadoPagoTransferService,
  ) {}

  async executar(dto: FinalizarAluguelDto): Promise<FinalizarAluguelResponse> {
    this.logger.log(`Iniciando finalização do aluguel ${dto.aluguelId}`);

    // Buscar aluguel
    const aluguel = await this.aluguelRepository.buscarPorId(dto.aluguelId);
    
    if (!aluguel) {
      throw new NotFoundException('Aluguel não encontrado');
    }

    // Verificar se pode ser finalizado
    if (!aluguel.podeSerFinalizado()) {
      throw new BadRequestException(
        `Aluguel não pode ser finalizado. Status atual: ${aluguel.status}`
      );
    }

    // Buscar caução
    const caucao = await this.caucaoRepository.buscarPorAluguelId(aluguel.id);
    
    if (!caucao || !caucao.estaPaga()) {
      throw new BadRequestException('Caução não foi paga ou não existe');
    }

    // Calcular valores
    const taxaApp = aluguel.calcularTaxaApp();
    const valorLiquidoLocador = aluguel.calcularValorLiquidoLocador();
    
    let indenizacao = 0;
    
    if (dto.houveDano) {
      // Se houve dano, calcular indenização
      if (dto.valorIndenizacao !== undefined) {
        indenizacao = dto.valorIndenizacao;
      } else {
        // Indenização padrão: 70% do valor do aluguel (pode ajustar a regra)
        indenizacao = Math.min(aluguel.valorCaucao, aluguel.valorAluguel * 0.7);
      }

      this.logger.log(
        `Aluguel finalizado com dano. Indenização: R$ ${indenizacao.toFixed(2)}`
      );
    }

    const retornoLocatario = aluguel.calcularRetornoLocatario(indenizacao);

    // Validar que os valores são consistentes
    const totalReconciliado = valorLiquidoLocador + taxaApp + retornoLocatario + indenizacao;
    const diferencaValor = Math.abs(totalReconciliado - aluguel.valorCaucao);
    
    if (diferencaValor > 0.01) {
      this.logger.error(
        `Erro de reconciliação: Total ${totalReconciliado}, Caução ${aluguel.valorCaucao}`
      );
      throw new BadRequestException('Erro na reconciliação dos valores');
    }

    // Marcar aluguel como finalizado
    aluguel.marcarComoFinalizado(dto.houveDano, indenizacao);
    await this.aluguelRepository.atualizar(aluguel);

    // Atualizar status da caução
    caucao.atualizarStatus(StatusCaucao.DEVOLVIDA);
    await this.caucaoRepository.atualizar(caucao);

    this.logger.log(`Aluguel ${aluguel.id} finalizado com sucesso`);

    // Executar transferências reais via Mercado Pago
    const resultadoTransferencias = await this.executarTransferencias(
      aluguel,
      caucao,
      valorLiquidoLocador,
      indenizacao,
      retornoLocatario,
      taxaApp
    );

    // TODO: Enviar notificações para locador e locatário
    
    return {
      aluguelId: aluguel.id,
      mensagem: dto.houveDano 
        ? 'Aluguel finalizado com danos' 
        : 'Aluguel finalizado sem danos',
      detalhes: {
        taxaApp,
        valorLiquidoLocador,
        retornoLocatario,
        indenizacao: dto.houveDano ? indenizacao : undefined,
      },
      transferencias: resultadoTransferencias,
    };
  }

  /**
   * Executa as transferências de valores usando a API do Mercado Pago
   */
  private async executarTransferencias(
    aluguel: Aluguel,
    caucao: any,
    valorLiquidoLocador: number,
    indenizacao: number,
    retornoLocatario: number,
    taxaApp: number,
  ): Promise<{ transferLocadorId?: number; reembolsoLocatarioId?: number; status: string }> {
    
    this.logger.log('========== INICIANDO TRANSFERÊNCIAS ==========');
    this.logger.log(`Taxa da plataforma retida: R$ ${taxaApp.toFixed(2)}`);

    let transferLocadorId: number | undefined;
    let reembolsoLocatarioId: number | undefined;
    const erros: string[] = [];

    // 1. Transferir para o locador (aluguel líquido + indenização)
    const valorParaLocador = valorLiquidoLocador + indenizacao;
    
    if (valorParaLocador > 0 && aluguel.locador.contaMPId) {
      this.logger.log(`Transferindo R$ ${valorParaLocador.toFixed(2)} para locador ${aluguel.locador.nome}`);
      
      // Criar registro da transferência
      const transferenciaLocador = new Transferencia({
        id: uuidv4(),
        aluguelId: aluguel.id,
        tipo: indenizacao > 0 ? TipoTransferencia.INDENIZACAO : TipoTransferencia.PAGAMENTO_LOCADOR,
        valor: valorParaLocador,
        contaDestinoId: aluguel.locador.contaMPId,
        nomeDestino: aluguel.locador.nome,
        descricao: indenizacao > 0 
          ? `Aluguel + Indenização - ${aluguel.item.nome}` 
          : `Aluguel - ${aluguel.item.nome}`,
        status: StatusTransferencia.PROCESSANDO,
      });
      
      await this.transferenciaRepository.salvar(transferenciaLocador);
      
      const resultadoTransfer = await this.transferService.transferir({
        valor: valorParaLocador,
        contaDestinoId: aluguel.locador.contaMPId,
        descricao: transferenciaLocador.descricao,
        externalReference: `aluguel-${aluguel.id}-locador`,
      });

      if (resultadoTransfer.ehSucesso()) {
        transferLocadorId = resultadoTransfer.valor!.id;
        transferenciaLocador.marcarComoConcluida(transferLocadorId);
        await this.transferenciaRepository.atualizar(transferenciaLocador);
        this.logger.log(`✅ Transferência para locador realizada: ID ${transferLocadorId}`);
      } else {
        const erro = `Falha ao transferir para locador: ${resultadoTransfer.erro?.message}`;
        transferenciaLocador.marcarComoFalhou(erro);
        await this.transferenciaRepository.atualizar(transferenciaLocador);
        this.logger.error(erro);
        erros.push(erro);
      }
    } else if (!aluguel.locador.contaMPId) {
      const aviso = 'Locador não possui contaMPId cadastrada';
      this.logger.warn(aviso);
      erros.push(aviso);
    }

    // 2. Reembolsar locatário (valor restante da caução)
    if (retornoLocatario > 0 && caucao.paymentId) {
      this.logger.log(`Reembolsando R$ ${retornoLocatario.toFixed(2)} para locatário ${aluguel.locatario.nome}`);
      
      // Criar registro do reembolso
      const transferenciaLocatario = new Transferencia({
        id: uuidv4(),
        aluguelId: aluguel.id,
        tipo: TipoTransferencia.REEMBOLSO_LOCATARIO,
        valor: retornoLocatario,
        contaDestinoId: aluguel.locatario.id,
        nomeDestino: aluguel.locatario.nome,
        descricao: indenizacao > 0 
          ? `Devolução parcial da caução (com indenização) - ${aluguel.item.nome}`
          : `Devolução da caução - ${aluguel.item.nome}`,
        status: StatusTransferencia.PROCESSANDO,
      });
      
      await this.transferenciaRepository.salvar(transferenciaLocatario);
      
      const resultadoReembolso = await this.transferService.reembolsar({
        paymentId: caucao.paymentId,
        valor: retornoLocatario,
        motivo: transferenciaLocatario.descricao,
      });

      if (resultadoReembolso.ehSucesso()) {
        reembolsoLocatarioId = resultadoReembolso.valor!.id;
        transferenciaLocatario.marcarComoConcluida(undefined, reembolsoLocatarioId);
        await this.transferenciaRepository.atualizar(transferenciaLocatario);
        this.logger.log(`✅ Reembolso para locatário realizado: ID ${reembolsoLocatarioId}`);
      } else {
        const erro = `Falha ao reembolsar locatário: ${resultadoReembolso.erro?.message}`;
        transferenciaLocatario.marcarComoFalhou(erro);
        await this.transferenciaRepository.atualizar(transferenciaLocatario);
        this.logger.error(erro);
        erros.push(erro);
      }
    } else if (retornoLocatario <= 0) {
      this.logger.log('Sem valor a reembolsar para locatário (caução consumida totalmente)');
    }

    this.logger.log('========== RESUMO DAS TRANSFERÊNCIAS ==========');
    this.logger.log(`Locador recebeu: R$ ${valorParaLocador.toFixed(2)} ${transferLocadorId ? '✅' : '❌'}`);
    this.logger.log(`Locatário recebeu: R$ ${retornoLocatario.toFixed(2)} ${reembolsoLocatarioId ? '✅' : '❌'}`);
    this.logger.log(`Taxa retida: R$ ${taxaApp.toFixed(2)} ✅`);
    this.logger.log('================================================');

    if (erros.length > 0) {
      this.logger.warn(`⚠️  Transferências concluídas com ${erros.length} erro(s)`);
      return {
        transferLocadorId,
        reembolsoLocatarioId,
        status: 'parcial',
      };
    }

    return {
      transferLocadorId,
      reembolsoLocatarioId,
      status: 'sucesso',
    };
  }
}
