import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';

export interface DataBloqueada {
    dataInicio: Date;
    dataFim: Date;
    motivo?: string;
}

export interface DisponibilidadeProps {
    disponivel: boolean;
    dataDisponibilidade?: Date;
    diasMinimosAluguel: number;
    diasMaximosAluguel: number;
    permitAluguelsConsecutivos: boolean;
    aprovacaoAutomatica: boolean;
    datasBloqueadas?: DataBloqueada[];
    permiteAluguelPorHora?: boolean;
    horasMinimosAluguel?: number;
    horasMaximosAluguel?: number;
}

type CriarDisponibilidadeProps = {
    diasMinimosAluguel?: number;
    diasMaximosAluguel?: number;
    permitAluguelsConsecutivos?: boolean;
    aprovacaoAutomatica?: boolean;
    permiteAluguelPorHora?: boolean;
    horasMinimosAluguel?: number;
    horasMaximosAluguel?: number;
};

export type AtualizarDisponibilidadeProps = Omit<
    DisponibilidadeProps,
    'datasBloqueadas' | 'dataDisponibilidade' | 'disponivel'
>;

export class Disponibilidade {
    private readonly _id: string;
    private readonly props: DisponibilidadeProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as DisponibilidadeProps;
    }

    static criar(props: CriarDisponibilidadeProps): Disponibilidade {
        const domain = new Disponibilidade();
        domain.setDisponivel(true);
        domain.setDiasMinimosAluguel(props.diasMinimosAluguel || 1);
        domain.setDiasMaximosAluguel(props.diasMaximosAluguel || 365);
        domain.setPermitAluguelsConsecutivos(props.permitAluguelsConsecutivos);
        domain.setAprovacaoAutomatica(props.aprovacaoAutomatica || false);
        if (props.permiteAluguelPorHora !== undefined) {
            domain.setPermiteAluguelPorHora(props.permiteAluguelPorHora);
            domain.setHorasMinimosAluguel(props.horasMinimosAluguel || 1);
            domain.setHorasMaximosAluguel(props.horasMaximosAluguel || 24);
        }
        return domain;
    }

    static carregar(props: DisponibilidadeProps, id: string): Disponibilidade {
        const domain = new Disponibilidade(id);
        domain.setDisponivel(props.disponivel);
        domain.setDataDisponibilidade(props.dataDisponibilidade);
        domain.setDiasMinimosAluguel(props.diasMinimosAluguel);
        domain.setDiasMaximosAluguel(props.diasMaximosAluguel);
        domain.setPermitAluguelsConsecutivos(props.permitAluguelsConsecutivos);
        domain.setAprovacaoAutomatica(props.aprovacaoAutomatica);
        domain.setDatasBloqueadas(props.datasBloqueadas);
        domain.setPermiteAluguelPorHora(!!props.permiteAluguelPorHora);
        domain.setHorasMinimosAluguel(props.horasMinimosAluguel);
        domain.setHorasMaximosAluguel(props.horasMaximosAluguel);
        return domain;
    }

    atualizar(props: AtualizarDisponibilidadeProps): void {
        if (props.diasMinimosAluguel !== undefined) {
            this.setDiasMinimosAluguel(props.diasMinimosAluguel);
        }
        if (props.diasMaximosAluguel !== undefined) {
            this.setDiasMaximosAluguel(props.diasMaximosAluguel);
        }
        if (props.permitAluguelsConsecutivos !== undefined) {
            this.setPermitAluguelsConsecutivos(
                props.permitAluguelsConsecutivos,
            );
        }
        if (props.permiteAluguelPorHora !== undefined) {
            this.setPermiteAluguelPorHora(props.permiteAluguelPorHora);
        }
        if (props.horasMinimosAluguel !== undefined) {
            this.setHorasMinimosAluguel(props.horasMinimosAluguel);
        }
        if (props.horasMaximosAluguel !== undefined) {
            this.setHorasMaximosAluguel(props.horasMaximosAluguel);
        }
        if (props.aprovacaoAutomatica !== undefined) {
            this.setAprovacaoAutomatica(props.aprovacaoAutomatica);
        }
    }

    adicionarDataBloqueio(bloqueio: DataBloqueada): void {
        const bloqueiosAtuais = this.props.datasBloqueadas || [];

        const bloqueioJaExiste = bloqueiosAtuais.some(
            (b) =>
                b.dataInicio.getTime() === bloqueio.dataInicio.getTime() &&
                b.dataFim.getTime() === bloqueio.dataFim.getTime(),
        );

        if (bloqueioJaExiste) {
            return;
        }

        bloqueiosAtuais.push(bloqueio);
        this.setDatasBloqueadas(bloqueiosAtuais);
    }

    removerDataBloqueio(bloqueio: DataBloqueada): void {
        const bloqueiosAtuais = this.props.datasBloqueadas || [];
        const bloqueiosFiltrados = bloqueiosAtuais.filter(
            (b) =>
                !(
                    b.dataInicio.getTime() === bloqueio.dataInicio.getTime() &&
                    b.dataFim.getTime() === bloqueio.dataFim.getTime()
                ),
        );
        this.setDatasBloqueadas(bloqueiosFiltrados);
    }

    get id(): string {
        return this._id;
    }

    get disponivel(): boolean {
        return this.props.disponivel;
    }

    get dataDisponibilidade(): Date | undefined {
        return this.props.dataDisponibilidade;
    }

    get diasMinimosAluguel(): number {
        return this.props.diasMinimosAluguel;
    }

    get diasMaximosAluguel(): number {
        return this.props.diasMaximosAluguel;
    }

    get permitAluguelsConsecutivos(): boolean {
        return this.props.permitAluguelsConsecutivos;
    }

    get aprovacaoAutomatica(): boolean {
        return this.props.aprovacaoAutomatica;
    }

    get datasBloqueadas(): DataBloqueada[] | undefined {
        return this.props.datasBloqueadas;
    }

    get permiteAluguelPorHora(): boolean {
        return !!this.props.permiteAluguelPorHora;
    }

    get horasMinimosAluguel(): number | undefined {
        return this.props.horasMinimosAluguel;
    }

    get horasMaximosAluguel(): number | undefined {
        return this.props.horasMaximosAluguel;
    }

    private setDisponivel(value: boolean) {
        if (value === undefined || value === null)
            throw new InvalidPropsException('disponivel é obrigatório');
        this.props.disponivel = value;
    }

    private setDataDisponibilidade(value?: Date) {
        this.props.dataDisponibilidade = value;
    }

    private setDiasMinimosAluguel(value: number) {
        if (value === undefined || value === null)
            throw new InvalidPropsException('diasMinimosAluguel é obrigatório');
        this.props.diasMinimosAluguel = value;
    }

    private setDiasMaximosAluguel(value: number) {
        if (value === undefined || value === null)
            throw new InvalidPropsException('diasMaximosAluguel é obrigatório');
        this.props.diasMaximosAluguel = value;
    }

    private setPermitAluguelsConsecutivos(value?: boolean) {
        if (value === undefined || value === null)
            throw new InvalidPropsException(
                'permitAluguelsConsecutivos é obrigatório',
            );
        this.props.permitAluguelsConsecutivos = value;
    }

    private setAprovacaoAutomatica(value: boolean) {
        if (value === undefined || value === null)
            throw new InvalidPropsException(
                'aprovacaoAutomatica é obrigatório',
            );
        this.props.aprovacaoAutomatica = value;
    }

    private setDatasBloqueadas(value?: DataBloqueada[]) {
        if (value) {
            for (const intervalo of value) {
                if (intervalo.dataInicio >= intervalo.dataFim) {
                    throw new InvalidPropsException(
                        'dataInicio deve ser menor que dataFim em bloqueios de datas',
                    );
                }
            }
        }
        this.props.datasBloqueadas = value;
    }

    private setPermiteAluguelPorHora(value: boolean) {
        this.props.permiteAluguelPorHora = value;
    }

    private setHorasMinimosAluguel(value?: number) {
        if (value !== undefined && value !== null && value < 1) {
            throw new InvalidPropsException(
                'horasMinimosAluguel deve ser maior que zero',
            );
        }
        this.props.horasMinimosAluguel = value;
    }

    private setHorasMaximosAluguel(value?: number) {
        if (value !== undefined && value !== null && value < 1) {
            throw new InvalidPropsException(
                'horasMaximosAluguel deve ser maior que zero',
            );
        }
        this.props.horasMaximosAluguel = value;
    }
}
