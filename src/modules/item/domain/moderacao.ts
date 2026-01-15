import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { ItemModeracaoStatus } from '../infra/models/moderacao-item.model';

export interface ModeracaoProps {
    status: ItemModeracaoStatus;
    contemPalavrasProibidas?: boolean;
    contemLinksExternos?: boolean;
    contemTelefone?: boolean;
    requerAprovacaoManual?: boolean;
    motivoBloqueio?: string;
    moderadorId?: string;
    observacoesModeração?: string;
    criadoEm: Date;
    atualizadoEm: Date;
    dataResolucao?: Date;
}

export type CriarModeracaoProps = {
    status?: ItemModeracaoStatus;
    requerAprovacaoManual?: boolean;
    contemPalavrasProibidas?: boolean;
    contemLinksExternos?: boolean;
    contemTelefone?: boolean;
    motivoBloqueio?: string;
    dataResolucao?: Date;
};

export class Moderacao {
    private readonly _id: string;
    private readonly props: ModeracaoProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as ModeracaoProps;
    }

    static criar(props: CriarModeracaoProps): Moderacao {
        const domain = new Moderacao();
        domain.setStatus(props.status ?? ItemModeracaoStatus.PENDENTE);
        domain.setContemPalavrasProibidas(props.contemPalavrasProibidas);
        domain.setContemLinksExternos(props.contemLinksExternos);
        domain.setContemTelefone(props.contemTelefone);
        domain.setRequerAprovacaoManual(props.requerAprovacaoManual);
        domain.setMotivoBloqueio(props.motivoBloqueio);
        domain.setDataResolucao(props.dataResolucao);
        return domain;
    }

    static carregar(props: ModeracaoProps, id?: string): Moderacao {
        const domain = new Moderacao(id);
        domain.setStatus(props.status);
        domain.setContemPalavrasProibidas(props.contemPalavrasProibidas);
        domain.setContemLinksExternos(props.contemLinksExternos);
        domain.setContemTelefone(props.contemTelefone);
        domain.setRequerAprovacaoManual(props.requerAprovacaoManual);
        domain.setMotivoBloqueio(props.motivoBloqueio);
        domain.setModeradorId(props.moderadorId);
        domain.setObservacoesModeração(props.observacoesModeração);
        domain.setDataResolucao(props.dataResolucao);
        domain.props.criadoEm = props.criadoEm;
        domain.props.atualizadoEm = props.atualizadoEm;
        return domain;
    }

    get id(): string {
        return this._id;
    }

    get status(): ItemModeracaoStatus {
        return this.props.status;
    }

    get contemPalavrasProibidas(): boolean | undefined {
        return this.props.contemPalavrasProibidas;
    }

    get contemLinksExternos(): boolean | undefined {
        return this.props.contemLinksExternos;
    }

    get contemTelefone(): boolean | undefined {
        return this.props.contemTelefone;
    }

    get requerAprovacaoManual(): boolean | undefined {
        return this.props.requerAprovacaoManual;
    }

    get motivoBloqueio(): string | undefined {
        return this.props.motivoBloqueio;
    }

    get moderadorId(): string | undefined {
        return this.props.moderadorId;
    }

    get observacoesModeração(): string | undefined {
        return this.props.observacoesModeração;
    }

    get criadoEm(): Date {
        return this.props.criadoEm;
    }

    get atualizadoEm(): Date {
        return this.props.atualizadoEm;
    }

    get dataResolucao(): Date | undefined {
        return this.props.dataResolucao;
    }

    private setStatus(value: ItemModeracaoStatus) {
        if (!value) throw new InvalidPropsException('status é obrigatório');
        this.props.status = value;
    }

    private setContemPalavrasProibidas(value?: boolean) {
        this.props.contemPalavrasProibidas = value;
    }

    private setContemLinksExternos(value?: boolean) {
        this.props.contemLinksExternos = value;
    }

    private setContemTelefone(value?: boolean) {
        this.props.contemTelefone = value;
    }

    private setRequerAprovacaoManual(value?: boolean) {
        this.props.requerAprovacaoManual = value;
    }

    private setMotivoBloqueio(value?: string) {
        this.props.motivoBloqueio = value;
    }

    private setModeradorId(value?: string) {
        this.props.moderadorId = value;
    }

    private setObservacoesModeração(value?: string) {
        this.props.observacoesModeração = value;
    }

    private setDataResolucao(value?: Date) {
        this.props.dataResolucao = value;
    }
}
