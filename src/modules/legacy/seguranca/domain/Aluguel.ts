import { Resultado, ResultadoUtil } from 'src/shared/utils/resultado';
import { Caucao, CaucaoDto, MetodoPagamento, StatusCaucao } from './Caucao';
import {
    Transferencia,
    TransferenciaDto,
    TipoTransferencia,
    StatusTransferencia,
} from './Transferencia';
import { PagamentoStatusResponse } from '../infra/services/mercado-pago.service';
import { v4 as uuidv4 } from 'uuid';

export type AluguelDto = {
    id: string;
    item: ItemAluguel;
    locatario: ParticipanteAluguel;
    locador: ParticipanteAluguel;
    caucao?: CaucaoDto;
    valorAluguel: number;
    taxaAppPercentual: number;
    status: StatusAluguel;
    mpPaymentId?: string;
    indenizacao?: number;
    transferencias: TransferenciaDto[];
    criadoEm?: Date;
    finalizadoEm?: Date;
};

export enum StatusAluguel {
    AGUARDANDO_CAUCAO = 'aguardando_caucao',
    CAUCAO_PAGA = 'caucao_paga',
    EM_ANDAMENTO = 'em_andamento',
    FINALIZADO_SEM_DANOS = 'finalizado_sem_danos',
    FINALIZADO_COM_DANOS = 'finalizado_com_danos',
    CANCELADO = 'cancelado',
}

export interface ItemAluguel {
    id: string;
    nome: string;
    descricao?: string;
}

export interface ParticipanteAluguel {
    id: string;
    nome: string;
    email: string;
    contaMPId?: string;
    chavePix?: string;
    telefonePix?: string;
    cpfPix?: string;
}

export type AluguelProps = {
    item: ItemAluguel;
    locatario: ParticipanteAluguel;
    locador: ParticipanteAluguel;
    caucao?: Caucao;
    valorAluguel: number;
    taxaAppPercentual: number;
    status: StatusAluguel;
    mpPaymentId?: string;
    indenizacao?: number;
    transferencias: Transferencia[];
    criadoEm?: Date;
    finalizadoEm?: Date;
};

type CriarAluguelProps = Omit<
    AluguelProps,
    | 'indenizacao'
    | 'mpPaymentId'
    | 'transferencias'
    | 'caucao'
    | 'criadoEm'
    | 'finalizadoEm'
>;

export class Aluguel {
    private _id: string;
    private props: AluguelProps;

    constructor(id?: string) {
        this._id = id || '';
        this.props = {} as AluguelProps;
    }

    static criar(props: CriarAluguelProps): Resultado<Aluguel, Error> {
        const instancia = new Aluguel();
        instancia._id = uuidv4(); // ✅ Gerar ID automaticamente

        const resultadoItem = instancia.setItem(props.item);
        const resultadoLocatario = instancia.setLocatario(props.locatario);
        const resultadoLocador = instancia.setLocador(props.locador);
        const resultadoValorAluguel = instancia.setValorAluguel(
            props.valorAluguel,
        );
        const resultadoTaxaAppPercentual = instancia.setTaxaAppPercentual(
            props.taxaAppPercentual,
        );
        const setStatus = instancia.setStatus(props.status);

        return ResultadoUtil.resultados(
            [
                resultadoItem,
                resultadoLocatario,
                resultadoLocador,
                resultadoValorAluguel,
                resultadoTaxaAppPercentual,
                setStatus,
            ],
            instancia,
        );
    }

    static carregar(props: AluguelProps, id: string): Aluguel {
        const instancia = new Aluguel(id);
        instancia.props = props;
        return instancia;
    }

    adicionarCaucao(caucao: Caucao): Resultado<void, Error> {
        const setCaucao = this.setCaucao(caucao);
        if (setCaucao.ehFalha()) {
            return ResultadoUtil.falha(setCaucao.erro!);
        }

        return ResultadoUtil.sucesso();
    }

    calcularTaxaApp(): number {
        return this.valorAluguel * this.taxaAppPercentual;
    }

    calcularValorLiquidoLocador(): number {
        return this.valorAluguel - this.calcularTaxaApp();
    }

    calcularRetornoLocatarioComIndenizacao(
        indenizacao: number,
    ): Resultado<number, Error> {
        if (this.caucao && this.caucao.valor < indenizacao) {
            return ResultadoUtil.falha(
                new Error(
                    'Indenização não pode ser maior que o valor da caução',
                ),
            );
        }

        if (this.caucao && this.caucao.valor > indenizacao) {
            return ResultadoUtil.sucesso(this.caucao.valor - indenizacao);
        }
        return ResultadoUtil.sucesso(0);
    }

    podeSerFinalizado(): boolean {
        return (
            this.status === StatusAluguel.CAUCAO_PAGA ||
            this.status === StatusAluguel.EM_ANDAMENTO
        );
    }

    marcarComoFinalizado(houveDano: boolean, indenizacao?: number): void {
        if (!this.podeSerFinalizado()) {
            throw new Error('Aluguel não pode ser finalizado neste status');
        }

        if (houveDano) {
            this.props.status = StatusAluguel.FINALIZADO_COM_DANOS;
            this.props.indenizacao = indenizacao ?? 0;
        } else {
            this.props.status = StatusAluguel.FINALIZADO_SEM_DANOS;
            this.props.indenizacao = 0;
        }

        this.props.finalizadoEm = new Date();
    }

    atualizarStatusPagamento(mpPaymentId: string): void {
        this.props.mpPaymentId = mpPaymentId;
        this.props.status = StatusAluguel.CAUCAO_PAGA;
    }

    atualizarStatusPagamentoCaucao(
        status: StatusCaucao,
        mpPayment: PagamentoStatusResponse,
    ): void {
        this.props.caucao?.atualizarStatus(status, mpPayment);
    }

    definirMetodoPagamentoCaucao(metodoPagamento: MetodoPagamento): void {
        this.props.caucao?.definirMetodoPagamento(metodoPagamento);
    }

    get id(): string {
        return this._id;
    }

    get item(): ItemAluguel {
        return this.props.item;
    }

    get locatario(): ParticipanteAluguel {
        return this.props.locatario;
    }

    get locador(): ParticipanteAluguel {
        return this.props.locador;
    }

    get caucao(): Caucao | undefined {
        return this.props.caucao;
    }

    get valorAluguel(): number {
        return this.props.valorAluguel;
    }

    get taxaAppPercentual(): number {
        return this.props.taxaAppPercentual;
    }

    get status(): StatusAluguel {
        return this.props.status;
    }

    get mpPaymentId(): string | undefined {
        return this.props.mpPaymentId;
    }

    get indenizacao(): number | undefined {
        return this.props.indenizacao;
    }

    get criadoEm(): Date | undefined {
        return this.props.criadoEm;
    }

    get finalizadoEm(): Date | undefined {
        return this.props.finalizadoEm;
    }

    get transferencias(): Transferencia[] {
        return this.props.transferencias;
    }

    private setItem(item: ItemAluguel): Resultado<void, Error> {
        if (!item.id || !item.nome) {
            return ResultadoUtil.falha(new Error('Item inválido'));
        }
        this.props.item = item;
        return ResultadoUtil.sucesso();
    }

    private setLocatario(
        locatario: ParticipanteAluguel,
    ): Resultado<void, Error> {
        if (!locatario.id || !locatario.nome || !locatario.email) {
            return ResultadoUtil.falha(new Error('Locatário inválido'));
        }
        this.props.locatario = locatario;
        return ResultadoUtil.sucesso();
    }

    private setLocador(locador: ParticipanteAluguel): Resultado<void, Error> {
        if (!locador.id || !locador.nome || !locador.email) {
            return ResultadoUtil.falha(new Error('Locador inválido'));
        }
        this.props.locador = locador;
        return ResultadoUtil.sucesso();
    }

    private setCaucao(caucao: Caucao): Resultado<void, Error> {
        if (!caucao || caucao.valor <= 0) {
            return ResultadoUtil.falha(new Error('Caução inválida'));
        }
        this.props.caucao = caucao;
        return ResultadoUtil.sucesso();
    }

    private setValorAluguel(valorAluguel: number): Resultado<void, Error> {
        if (valorAluguel <= 0) {
            return ResultadoUtil.falha(
                new Error('Valor do aluguel deve ser maior que zero'),
            );
        }
        this.props.valorAluguel = valorAluguel;
        return ResultadoUtil.sucesso();
    }

    private setTaxaAppPercentual(
        taxaAppPercentual: number,
    ): Resultado<void, Error> {
        if (taxaAppPercentual < 0 || taxaAppPercentual > 1) {
            return ResultadoUtil.falha(
                new Error('Taxa do app deve estar entre 0 e 1'),
            );
        }
        this.props.taxaAppPercentual = taxaAppPercentual;
        return ResultadoUtil.sucesso();
    }

    private setStatus(status: StatusAluguel): Resultado<void, Error> {
        this.props.status = status;
        return ResultadoUtil.sucesso();
    }

    private setMpPaymentId(mpPaymentId: string): Resultado<void, Error> {
        this.props.mpPaymentId = mpPaymentId;
        return ResultadoUtil.sucesso();
    }

    private setIndenizacao(indenizacao?: number): Resultado<void, Error> {
        if (indenizacao && indenizacao < 0) {
            return ResultadoUtil.falha(
                new Error('Indenização não pode ser negativa'),
            );
        }
        this.props.indenizacao = indenizacao;
        return ResultadoUtil.sucesso();
    }

    private setFinalizadoAt(finalizadoEm?: Date): Resultado<void, Error> {
        this.props.finalizadoEm = finalizadoEm;
        return ResultadoUtil.sucesso();
    }

    private setTransferencias(
        transferencias: Transferencia[],
    ): Resultado<void, Error> {
        if (!transferencias) {
            return ResultadoUtil.falha(
                new Error('Transferências não podem ser nulas'),
            );
        }
        this.props.transferencias = transferencias;
        return ResultadoUtil.sucesso();
    }

    adicionarTransferencia(
        transferencia: Transferencia,
    ): Resultado<void, Error> {
        const transferencias: Transferencia[] = this.transferencias || [];
        for (const t of this.props.transferencias) {
            if (t.id === transferencia.id) {
                return ResultadoUtil.falha(
                    new Error('Transferência já existe neste aluguel'),
                );
            }
            transferencias.push(transferencia);
        }

        this.setTransferencias(transferencias);
        return ResultadoUtil.sucesso();
    }

    /**
     * Atualizar o status de uma transferência existente
     * Padrão: Modificações através do agregado raiz
     */
    atualizarStatusTransferencia(
        transferenciaId: string,
        novoStatus: StatusTransferencia,
    ): Resultado<void, Error> {
        const transferencia = this.props.transferencias.find(
            (t) => t.id === transferenciaId,
        );
        if (!transferencia) {
            return ResultadoUtil.falha(
                new Error(
                    `Transferência ${transferenciaId} não encontrada neste aluguel`,
                ),
            );
        }

        if (novoStatus === StatusTransferencia.PROCESSANDO) {
            transferencia.marcarComoProcessando();
        } else if (novoStatus === StatusTransferencia.CONCLUIDA) {
            transferencia.marcarComoConcluida();
        } else if (novoStatus === StatusTransferencia.FALHOU) {
            transferencia.marcarComoFalhou('');
        }

        return ResultadoUtil.sucesso();
    }

    /**
     * Marcar transferência como concluída com IDs do Mercado Pago
     */
    marcarTransferenciasComoConcluida(
        transferenciaId: string,
        mpTransferenciaId?: number,
        mpRefundId?: number,
    ): Resultado<void, Error> {
        const transferencia = this.props.transferencias.find(
            (t) => t.id === transferenciaId,
        );
        if (!transferencia) {
            return ResultadoUtil.falha(
                new Error(`Transferência ${transferenciaId} não encontrada`),
            );
        }

        transferencia.marcarComoConcluida(mpTransferenciaId, mpRefundId);
        return ResultadoUtil.sucesso();
    }

    /**
     * Marcar transferência como falhada com mensagem de erro
     */
    marcarTransferenciaComoFalhada(
        transferenciaId: string,
        errorMessage: string,
    ): Resultado<void, Error> {
        const transferencia = this.props.transferencias.find(
            (t) => t.id === transferenciaId,
        );
        if (!transferencia) {
            return ResultadoUtil.falha(
                new Error(`Transferência ${transferenciaId} não encontrada`),
            );
        }

        transferencia.marcarComoFalhou(errorMessage);
        return ResultadoUtil.sucesso();
    }

    /**
     * Marcar transferência como aguardando transferência manual
     */
    marcarTransferenciaAguardandoManual(
        transferenciaId: string,
        instrucoes: string,
    ): Resultado<void, Error> {
        const transferencia = this.props.transferencias.find(
            (t) => t.id === transferenciaId,
        );
        if (!transferencia) {
            return ResultadoUtil.falha(
                new Error(`Transferência ${transferenciaId} não encontrada`),
            );
        }

        transferencia.marcarComoAguardandoTransferenciaManual(instrucoes);
        return ResultadoUtil.sucesso();
    }

    /**
     * Obter transferência por ID
     */
    obterTransferenciaPorId(
        transferenciaId: string,
    ): Transferencia | undefined {
        return this.props.transferencias.find((t) => t.id === transferenciaId);
    }

    obterTransferenciasPorTipo(tipo: TipoTransferencia): Transferencia[] {
        return this.props.transferencias.filter((t) => t.tipo === tipo);
    }

    obterTransferenciasPendentes(): Transferencia[] {
        return this.props.transferencias.filter(
            (t) => t.status === StatusTransferencia.PENDENTE,
        );
    }

    toDto(): AluguelDto {
        return {
            id: this.id,
            item: this.item,
            locatario: this.locatario,
            locador: this.locador,
            caucao: this.caucao?.toDto(),
            valorAluguel: this.valorAluguel,
            taxaAppPercentual: this.taxaAppPercentual,
            status: this.status,
            mpPaymentId: this.mpPaymentId,
            indenizacao: this.indenizacao,
            transferencias: this.transferencias.map((t) => t.toDto()),
            criadoEm: this.criadoEm,
            finalizadoEm: this.finalizadoEm,
        };
    }
}
