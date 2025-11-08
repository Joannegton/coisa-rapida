import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Aluguel, StatusAluguel } from '../../domain/Aluguel';
import { Caucao, StatusCaucao } from '../../domain/Caucao';
import { AluguelRepository } from '../../infra/repositories/Aluguel.repository';
import { CaucaoRepository } from '../../infra/repositories/Caucao.repository';
import { MercadoPagoCheckoutService } from '../../infra/services/mercado-pago-checkout.service';
import { CriarCaucaoDto } from '../dtos/CriarCaucao.dto';

export interface CriarCaucaoResponse {
  aluguelId: string;
  paymentId: string;
  checkoutUrl: string;
  message: string;
}

@Injectable()
export class CriarCaucaoAluguelUseCase {
  private readonly logger = new Logger(CriarCaucaoAluguelUseCase.name);

  constructor(
    private readonly aluguelRepository: AluguelRepository,
    private readonly caucaoRepository: CaucaoRepository,
    private readonly mercadoPagoService: MercadoPagoCheckoutService,
  ) {}

  async executar(dto: CriarCaucaoDto): Promise<CriarCaucaoResponse> {
    this.logger.log(`Iniciando criação de caução para item: ${dto.item.nome}`);

    // Criar entidade de domínio Aluguel
    const aluguel = new Aluguel({
      id: uuidv4(),
      item: dto.item,
      locatario: dto.locatario,
      locador: dto.locador,
      valorCaucao: dto.valorCaucao,
      valorAluguel: dto.valorAluguel,
      taxaAppPercentual: dto.taxaAppPercentual ?? 0.1,
      status: StatusAluguel.AGUARDANDO_CAUCAO,
    });

    // Persistir aluguel
    await this.aluguelRepository.salvar(aluguel);
    this.logger.log(`Aluguel ${aluguel.id} criado com sucesso`);

    // Criar preferência de pagamento no Mercado Pago
    const resultadoPreferencia = await this.mercadoPagoService.criarPreferenciaCaucao({
      aluguelId: aluguel.id,
      valorCaucao: aluguel.valorCaucao,
      locatarioEmail: aluguel.locatario.email,
      itemNome: aluguel.item.nome,
    });

    if (resultadoPreferencia.ehFalha()) {
      this.logger.error('Falha ao criar preferência', resultadoPreferencia.erro?.message);
      throw new Error('Erro ao criar preferência de pagamento');
    }

    const preferencia = resultadoPreferencia.valor!;

    // Criar entidade de domínio Caucao
    const caucao = new Caucao({
      id: uuidv4(),
      aluguelId: aluguel.id,
      paymentId: preferencia.id!,
      valor: aluguel.valorCaucao,
      status: StatusCaucao.AGUARDANDO_PAGAMENTO,
      checkoutUrl: preferencia.init_point!,
      mpResponse: preferencia,
    });

    // Persistir caução
    await this.caucaoRepository.salvar(caucao);
    this.logger.log(`Caução ${caucao.id} criada com payment ID: ${preferencia.id}`);

    return {
      aluguelId: aluguel.id,
      paymentId: preferencia.id!,
      checkoutUrl: preferencia.init_point!,
      message: 'Caução criada com sucesso. Realize o pagamento via checkout.',
    };
  }
}
