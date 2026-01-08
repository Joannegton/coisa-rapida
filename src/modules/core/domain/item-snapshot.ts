import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { DatasBloqueadas, ItemResult } from './services/item.service';

export interface ItemSnapshotProps {
    nome: string;
    descricao?: string;
    precoDiaria: number;
    precoHora?: number;
    fotoUrl?: string;
    capturadoEm: Date;
    versao: number;
    permiteAluguelPorHora?: boolean;
    diasMinimosAluguel?: number;
    diasMaximosAluguel?: number;
    horasMinimosAluguel?: number;
    horasMaximosAluguel?: number;
    valorCaucao?: number;
    caucaoObrigatoria: boolean;
    disponivel: boolean;
    datasBloqueadas?: DatasBloqueadas[];
}

type CarregarItemSnapshotProps = Omit<
    ItemSnapshotProps,
    'disponivel' | 'datasBloqueadas'
>;

export class ItemSnapshot {
    private readonly props: ItemSnapshotProps;

    private constructor() {
        this.props = {} as ItemSnapshotProps;
    }

    static criar(props: ItemResult): ItemSnapshot {
        const domain = new ItemSnapshot();
        domain.setNome(props.nome);
        domain.setDescricao(props.descricao);
        domain.setPrecoDiaria(props.precoDiaria);
        domain.setPrecoHora(props.precoHora);
        domain.setFotoUrl(props.fotoUrl);
        domain.setCapturadoEm(new Date());
        domain.setVersao(props.versao);
        domain.setPermiteAluguelPorHora(
            props.disponibilidade.permiteAluguelPorHora,
        );
        domain.setDiasMinimosAluguel(props.disponibilidade.diasMinimosAluguel);
        domain.setDiasMaximosAluguel(props.disponibilidade.diasMaximosAluguel);
        domain.setHorasMinimosAluguel(
            props.disponibilidade.horasMinimosAluguel,
        );
        domain.setHorasMaximosAluguel(
            props.disponibilidade.horasMaximosAluguel,
        );
        domain.setDisponivel(props.disponibilidade.disponivel);
        domain.setValorCaucao(props.valorCaucao);
        domain.setCaucaoObrigatoria(props.caucaoObrigatoria);
        domain.setDatasBloqueadas(props.disponibilidade.datasBloqueadas || []);

        return domain;
    }

    static carregar(props: CarregarItemSnapshotProps): ItemSnapshot {
        const domain = new ItemSnapshot();
        domain.setNome(props.nome);
        domain.setDescricao(props.descricao);
        domain.setPrecoDiaria(props.precoDiaria);
        domain.setPrecoHora(props.precoHora);
        domain.setFotoUrl(props.fotoUrl);
        domain.setCapturadoEm(props.capturadoEm);
        domain.setVersao(props.versao);
        domain.setPermiteAluguelPorHora(props.permiteAluguelPorHora);
        domain.setDiasMinimosAluguel(props.diasMinimosAluguel);
        domain.setDiasMaximosAluguel(props.diasMaximosAluguel);
        domain.setHorasMinimosAluguel(props.horasMinimosAluguel);
        domain.setHorasMaximosAluguel(props.horasMaximosAluguel);
        domain.setValorCaucao(props.valorCaucao);
        domain.setCaucaoObrigatoria(props.caucaoObrigatoria);

        return domain;
    }

    private setNome(nome: string) {
        if (!nome || nome.trim().length === 0)
            throw new InvalidPropsException('Nome do item é obrigatório.');
        this.props.nome = nome;
    }

    private setDescricao(descricao?: string) {
        this.props.descricao = descricao;
    }

    private setPrecoDiaria(precoDiaria: number) {
        if (precoDiaria <= 0)
            throw new InvalidPropsException(
                'Preço da diária deve ser maior que zero.',
            );
        this.props.precoDiaria = precoDiaria;
    }

    private setPrecoHora(precoHora?: number) {
        if (precoHora !== undefined && precoHora <= 0)
            throw new InvalidPropsException(
                'Preço da hora deve ser maior que zero.',
            );
        this.props.precoHora = precoHora;
    }

    private setFotoUrl(fotoUrl?: string) {
        this.props.fotoUrl = fotoUrl;
    }

    private setCapturadoEm(capturadoEm: Date) {
        this.props.capturadoEm = capturadoEm;
    }

    private setVersao(versao: number) {
        if (versao < 0)
            throw new InvalidPropsException('Versão deve ser não negativa.');
        this.props.versao = versao;
    }

    private setPermiteAluguelPorHora(permite?: boolean) {
        this.props.permiteAluguelPorHora = permite;
    }

    private setDiasMinimosAluguel(dias?: number) {
        if (dias !== undefined && dias < 0)
            throw new InvalidPropsException(
                'Dias mínimos de aluguel devem ser não negativos.',
            );
        this.props.diasMinimosAluguel = dias;
    }

    private setDiasMaximosAluguel(dias?: number) {
        if (dias !== undefined && dias < 0)
            throw new InvalidPropsException(
                'Dias máximos de aluguel devem ser não negativos.',
            );
        this.props.diasMaximosAluguel = dias;
    }

    private setHorasMinimosAluguel(horas?: number) {
        if (horas !== undefined && horas < 0)
            throw new InvalidPropsException(
                'Horas mínimas de aluguel devem ser não negativas.',
            );
        this.props.horasMinimosAluguel = horas;
    }

    private setHorasMaximosAluguel(horas?: number) {
        if (horas !== undefined && horas < 0)
            throw new InvalidPropsException(
                'Horas máximas de aluguel devem ser não negativas.',
            );
        this.props.horasMaximosAluguel = horas;
    }

    private setValorCaucao(valor?: number) {
        if (valor !== undefined && valor < 0)
            throw new InvalidPropsException(
                'Valor da caução deve ser não negativo.',
            );
        this.props.valorCaucao = valor;
    }

    private setCaucaoObrigatoria(obrigatoria: boolean) {
        this.props.caucaoObrigatoria = obrigatoria;
    }

    private setDisponivel(disponivel: boolean) {
        this.props.disponivel = disponivel;
    }

    private setDatasBloqueadas(datas: DatasBloqueadas[]) {
        this.props.datasBloqueadas = datas;
    }

    get nome(): string {
        return this.props.nome;
    }

    get descricao(): string | undefined {
        return this.props.descricao;
    }

    get precoDiaria(): number {
        return this.props.precoDiaria;
    }

    get precoHora(): number | undefined {
        return this.props.precoHora;
    }

    get fotoUrl(): string | undefined {
        return this.props.fotoUrl;
    }

    get capturadoEm(): Date {
        return this.props.capturadoEm;
    }

    get versao(): number {
        return this.props.versao;
    }

    get permiteAluguelPorHora(): boolean | undefined {
        return this.props.permiteAluguelPorHora;
    }

    get diasMinimosAluguel(): number | undefined {
        return this.props.diasMinimosAluguel;
    }

    get diasMaximosAluguel(): number | undefined {
        return this.props.diasMaximosAluguel;
    }

    get horasMinimosAluguel(): number | undefined {
        return this.props.horasMinimosAluguel;
    }

    get horasMaximosAluguel(): number | undefined {
        return this.props.horasMaximosAluguel;
    }

    get valorCaucao(): number | undefined {
        return this.props.valorCaucao;
    }

    get caucaoObrigatoria(): boolean {
        return this.props.caucaoObrigatoria;
    }

    get disponivel(): boolean {
        return this.props.disponivel;
    }

    get datasBloqueadas(): DatasBloqueadas[] | undefined {
        return this.props.datasBloqueadas;
    }
}
