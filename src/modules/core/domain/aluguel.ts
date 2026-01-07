import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { AluguelStatus } from '../infra/models/aluguel.model';
import { Caucao } from './caucao';
import { Contrato } from './contrato';
import { Multa } from './multa';
import { Pessoa } from './pessoa';

export type SnapshotItem = {
    id: string;
    nome: string;
    descricao?: string;
    precoDiaria: number;
    precoHora?: number;
    fotoUrl?: string;
    capturadoEm: Date;
    versao: number;
    permiteAluguelPorHora: boolean;
    diasMinimosAluguel: number;
    diasMaximosAluguel: number;
    horasMinimosAluguel?: number;
    horasMaximosAluguel?: number;
    valorCaucao?: number;
    caucaoObrigatoria: boolean;
};

export type AluguelSnapshot = {
    itemSnapshot: SnapshotItem;
    observacoesLocatario?: string;
    motivoRecusaLocador?: string;
    criadoEm: Date;
};

export type AluguelProps = {
    locador: Pessoa;
    locatario: Pessoa;
    precoTotal: number;
    dataInicio: Date;
    dataFim: Date;
    status: AluguelStatus;
    criadoEm: Date;
    atualizadoEm: Date;

    itemId: string;
    itemSnapshot: SnapshotItem;
    snapshot?: AluguelSnapshot;
    caucao?: Caucao;
    multa: Multa;
    contrato: Contrato;
};

export type CriarAluguelProps = {
    locador: Pessoa;
    locatario: Pessoa;
    itemId: string;
    itemSnapshot: SnapshotItem;
    dataInicio: Date;
    dataFim: Date;
    observacoesLocatario?: string;
};

export class Aluguel {
    private readonly _id: string;
    private readonly props: AluguelProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as AluguelProps;
    }

    static criar(props: CriarAluguelProps): Aluguel {
        const domain = new Aluguel();
        domain.setLocador(props.locador);
        domain.setLocatario(props.locatario);
        domain.setItemId(props.itemId);
        domain.setItemSnapshot(props.itemSnapshot);
        domain.setDataInicio(props.dataInicio);
        domain.setDataFim(props.dataFim);
        domain.setStatus(AluguelStatus.SOLICITADO);

        domain.calcularPrecoTotal();

        return domain;
    }

    static carregar(props: AluguelProps, id: string): Aluguel {
        const domain = new Aluguel(id);
        domain.setLocador(props.locador);
        domain.setLocatario(props.locatario);
        domain.setItemId(props.itemId);
        domain.setItemSnapshot(props.itemSnapshot);
        domain.setPrecoTotal(props.precoTotal);
        domain.setCaucao(props.caucao);
        domain.setMulta(props.multa);
        domain.setContrato(props.contrato);
        domain.setDataInicio(props.dataInicio);
        domain.setDataFim(props.dataFim);
        domain.setStatus(props.status);
        domain.props.snapshot = props.snapshot;
        domain.props.criadoEm = props.criadoEm;
        domain.props.atualizadoEm = props.atualizadoEm;

        return domain;
    }

    private calcularPrecoTotal(): void {
        const totalMs =
            this.props.dataFim.getTime() - this.props.dataInicio.getTime();

        if (
            this.props.itemSnapshot.permiteAluguelPorHora &&
            this.props.itemSnapshot.precoHora
        ) {
            const horas = totalMs / (1000 * 60 * 60);
            const precoTotal = horas * this.props.itemSnapshot.precoHora;
            this.setPrecoTotal(Math.round(precoTotal * 100) / 100);
        } else {
            const dias = totalMs / (1000 * 60 * 60 * 24);
            const precoTotal = dias * this.props.itemSnapshot.precoDiaria;
            this.setPrecoTotal(Math.round(precoTotal * 100) / 100);
        }
    }

    private setLocador(locador: Pessoa): void {
        if (!locador) throw new InvalidPropsException('Locador é obrigatório.');
        this.props.locador = locador;
    }

    private setLocatario(locatario: Pessoa): void {
        if (!locatario)
            throw new InvalidPropsException('Locatário é obrigatório.');
        this.props.locatario = locatario;
    }

    private setItemId(itemId: string): void {
        if (!itemId) throw new InvalidPropsException('Item ID é obrigatório.');
        this.props.itemId = itemId;
    }

    private setItemSnapshot(snapshot: SnapshotItem): void {
        if (!snapshot)
            throw new InvalidPropsException('Snapshot do item é obrigatório.');
        this.props.itemSnapshot = snapshot;
    }

    private setPrecoTotal(precoTotal: number): void {
        if (precoTotal < 0)
            throw new InvalidPropsException(
                'Preço total do aluguel não pode ser negativo.',
            );
        this.props.precoTotal = precoTotal;
    }

    private setCaucao(caucao?: Caucao): void {
        this.props.caucao = caucao;
    }

    private setMulta(multa: Multa): void {
        if (!multa)
            throw new InvalidPropsException('Multa do aluguel é obrigatória.');
        this.props.multa = multa;
    }

    private setContrato(contrato: Contrato): void {
        if (!contrato)
            throw new InvalidPropsException(
                'Contrato do aluguel é obrigatório.',
            );
        this.props.contrato = contrato;
    }

    private setDataInicio(dataInicio: Date): void {
        if (!dataInicio)
            throw new InvalidPropsException('Data de início é obrigatória.');
        this.props.dataInicio = dataInicio;
    }

    private setDataFim(dataFim: Date): void {
        if (!dataFim)
            throw new InvalidPropsException('Data de fim é obrigatória.');

        if (dataFim < this.props.dataInicio)
            throw new InvalidPropsException(
                'Data de fim não pode ser anterior à data de início.',
            );
        this.props.dataFim = dataFim;
    }
    private setStatus(status: AluguelStatus): void {
        if (!Object.values(AluguelStatus).includes(status))
            throw new InvalidPropsException('Status do aluguel inválido.');
        this.props.status = status;
    }

    get id(): string {
        return this._id;
    }

    get locador(): Pessoa {
        return this.props.locador;
    }

    get locatario(): Pessoa {
        return this.props.locatario;
    }

    get itemId(): string {
        return this.props.itemId;
    }

    get itemSnapshot(): SnapshotItem {
        return this.props.itemSnapshot;
    }

    get snapshot(): AluguelSnapshot | undefined {
        return this.props.snapshot;
    }

    get caucao(): Caucao | undefined {
        return this.props.caucao;
    }

    get multa(): Multa {
        return this.props.multa;
    }

    get precoTotal(): number {
        return this.props.precoTotal;
    }

    get contrato(): Contrato {
        return this.props.contrato;
    }

    get dataInicio(): Date {
        return this.props.dataInicio;
    }

    get dataFim(): Date {
        return this.props.dataFim;
    }

    get status(): AluguelStatus {
        return this.props.status;
    }

    get criadoEm(): Date {
        return this.props.criadoEm;
    }

    get atualizadoEm(): Date {
        return this.props.atualizadoEm;
    }
}
