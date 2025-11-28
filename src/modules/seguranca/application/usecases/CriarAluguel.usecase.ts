import { Injectable, Logger } from '@nestjs/common';
import { Aluguel, StatusAluguel } from '../../domain/Aluguel';
import { Caucao, StatusCaucao } from '../../domain/Caucao';
import { AluguelRepository } from '../../infra/repositories/Aluguel.repository';
import { CriarAluguelDto } from '../dtos/CriarAluguel.dto';
import { ResultadoAssincrono, ResultadoUtil } from 'src/shared/resultado';
import { MercadoPagoCheckoutService } from '../services/mercado-pago-checkout.service';

export interface CriarAluguelResponse {
  aluguelId: string;
  checkoutUrl?: string;
  message: string;
}

@Injectable()
export class CriarAluguelUseCase {
  private readonly logger = new Logger(CriarAluguelUseCase.name);

  constructor(
    private readonly aluguelRepository: AluguelRepository,
    private readonly mpCheckoutService: MercadoPagoCheckoutService,
  ) {}

  async executar(props: CriarAluguelDto): ResultadoAssincrono<CriarAluguelResponse, Error> {
    this.logger.log('Iniciando criação de aluguel');

    try {
      const statusInicial = props.caucao ? StatusAluguel.AGUARDANDO_CAUCAO : StatusAluguel.EM_ANDAMENTO;

      const aluguel = Aluguel.criar({
        item: props.item,
        locatario: props.locatario,
        locador: props.locador,
        valorAluguel: props.valorAluguel,
        taxaAppPercentual: props.taxaAppPercentual ?? 0.1,
        status: statusInicial,
      });

      if (aluguel.ehFalha()) {
        this.logger.error(`Erro ao criar aluguel: ${aluguel.erro?.message}`);
        return ResultadoUtil.falha(aluguel.erro!);
      }

      this.logger.log(`Aluguel criado (domínio): ${aluguel.valor!.id}`);

      // Se houver caução, criar a caução e associar
      let checkoutUrl: string | undefined;
      if (props.caucao) {
        this.logger.log(`Criando caução de R$ ${props.caucao}`);

        // Criar preferência no Mercado Pago para CAUÇÃO
        const mpResult = await this.mpCheckoutService.criarPreferenciaCaucao({
          aluguelId: aluguel.valor!.id,
          valorCaucao: props.caucao,
          itemNome: props.item.nome,
          locatarioEmail: props.locatario.email,
        });

        if (mpResult.ehFalha()) {
          this.logger.error(`Erro ao criar preferência MP: ${mpResult.erro?.message}`);
          return ResultadoUtil.falha(mpResult.erro!);
        }

        // Criar caução no domínio
        const caucaoResult = Caucao.criar({
          paymentId: mpResult.valor!.id?.toString() || 'pending',
          valor: props.caucao,
          checkoutUrl: mpResult.valor!.init_point || '',
          status: StatusCaucao.AGUARDANDO_PAGAMENTO,
        });

        if (caucaoResult.ehFalha()) {
          this.logger.error(`Erro ao criar caução: ${caucaoResult.erro?.message}`);
          return ResultadoUtil.falha(caucaoResult.erro!);
        }

        // Adicionar caução ao aluguel
        const adicionarCaucaoResult = aluguel.valor!.adicionarCaucao(caucaoResult.valor!);
        if (adicionarCaucaoResult.ehFalha()) {
          this.logger.error(`Erro ao adicionar caução ao aluguel: ${adicionarCaucaoResult.erro?.message}`);
          return ResultadoUtil.falha(adicionarCaucaoResult.erro!);
        }

        checkoutUrl = mpResult.valor!.init_point;
        this.logger.log(`Caução criada: ${caucaoResult.valor!.id}`);
      } else {
        // SEM CAUÇÃO: Criar preferência de ALUGUEL
        this.logger.log(`Criando preferência de pagamento do aluguel de R$ ${props.valorAluguel}`);

        const mpResult = await this.mpCheckoutService.criarPreferenciaAluguel({
          aluguelId: aluguel.valor!.id,
          valorAluguel: props.valorAluguel,
          itemNome: props.item.nome,
          locatarioEmail: props.locatario.email,
        });

        if (mpResult.ehFalha()) {
          this.logger.error(`Erro ao criar preferência MP: ${mpResult.erro?.message}`);
          return ResultadoUtil.falha(mpResult.erro!);
        }

        checkoutUrl = mpResult.valor!.init_point;
        this.logger.log(`Preferência de pagamento do aluguel criada`);
      }

      // Salvar aluguel (com ou sem caução)
      const salvarResult = await this.aluguelRepository.salvar(aluguel.valor!);
      if (salvarResult.ehFalha()) {
        this.logger.error(`Erro ao salvar aluguel: ${salvarResult.erro?.message}`);
        return ResultadoUtil.falha(salvarResult.erro!);
      }

      this.logger.log(`✅ Aluguel criado e salvo: ${aluguel.valor!.id}`);

      return ResultadoUtil.sucesso({
        aluguelId: aluguel.valor!.id,
        checkoutUrl,
        message: props.caucao
          ? 'Aluguel com caução criado. Redirecione para pagamento da CAUÇÃO.'
          : 'Aluguel criado. Redirecione para pagamento do ALUGUEL.',
      });
    } catch (error) {
      this.logger.error(`Erro inesperado ao criar aluguel: ${(error as Error).message}`);
      return ResultadoUtil.falha(error as Error);
    }
  }
}
