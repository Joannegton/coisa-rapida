import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { AluguelStatus } from '../infra/models/aluguel.model';
import { Caucao } from './caucao';
import { Contrato } from './contrato';
import { Multa } from './multa';
import { Pessoa } from './pessoa';
import { ItemSnapshot } from './item-snapshot';
import { DatasBloqueadas, ItemResult } from './services/item.service';
import { UsuarioResult } from './services/usuario.service';
import { AluguelDto } from '../application/dtos/results/Aluguel.dto';
import { ForbiddenException } from '@nestjs/common';
import { DinheiroUtils, DataUtils } from '../../../shared/utils';
import { AluguelException } from './exceptions/aluguel.exception';

export type AluguelProps = {
    locador: Pessoa;
    locatario: Pessoa;
    precoTotal: number;
    precoTotalComTaxa: number;
    dataInicio: Date;
    dataFim: Date;
    status: AluguelStatus;
    observacoesLocatario?: string;
    motivoRecusaLocador?: string;
    criadoEm: Date;
    atualizadoEm: Date;

    itemId: string;
    itemSnapshot: ItemSnapshot;
    caucao?: Caucao;
    multa?: Multa;
    contrato: Contrato;
};

export type CriarAluguelProps = {
    locadorData: UsuarioResult;
    locatarioData: UsuarioResult;
    dataInicio: string;
    dataFim: string;
    observacoesLocatario?: string;
    itemData: ItemResult;
};

type AssinarContratoProps = {
    usuarioId: string;
    assinaturaDigital: string;
    enderecoIp: string;
    userAgent: string;
    latitude?: number;
    longitude?: number;
};

type ConfirmarAluguelProps = {
    usuarioId: string;
    enderecoIp: string;
    assinaturaDigital: string;
    userAgent: string;
    latitude?: number;
    longitude?: number;
};

export class Aluguel {
    private readonly _id: string;
    private readonly props: AluguelProps;
    private readonly taxaApp = Number.parseFloat(
        process.env.PERCENTUAL_TAXA_APP as string,
    );

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as AluguelProps;
    }

    static criar(props: CriarAluguelProps): Aluguel {
        const domain = new Aluguel();
        domain.setDataInicio(props.dataInicio);
        domain.setDataFim(props.dataFim);

        const locador = Pessoa.criar({
            id: props.locadorData.id,
            nome: props.locadorData.nome,
        });

        const locatario = Pessoa.criar({
            id: props.locatarioData.id,
            nome: props.locatarioData.nome,
        });

        const itemSnapshot = ItemSnapshot.criar(props.itemData);
        domain.setItemId(props.itemData.id);
        domain.setItemSnapshot(itemSnapshot);

        if (!domain.itemSnapshot.disponivel) {
            throw new AluguelException(
                'Item não está disponível para aluguel.',
            );
        }

        const bloqueiosSobrepostos = domain.obterBloqueiosSobrepostos(
            domain.dataInicio,
            domain.dataFim,
            domain.itemSnapshot.datasBloqueadas,
        );

        if (bloqueiosSobrepostos.length > 0) {
            throw new AluguelException(
                `Item indisponível nas datas selecionadas.`,
            );
        }

        //TODO criar caucaoo se for obrigatorio

        domain.validarPeriodoAluguel();

        domain.setLocador(locador);
        domain.setLocatario(locatario);
        domain.setStatus(AluguelStatus.SOLICITADO);
        domain.setObservacoesLocatario(props.observacoesLocatario);

        domain.calcularPrecoTotal();

        return domain;
    }

    static carregar(props: AluguelProps, id: string): Aluguel {
        const domain = new Aluguel(id);
        Object.assign(domain.props, props);
        return domain;
    }

    confirmar(props: ConfirmarAluguelProps): void {
        if (this.locador.id !== props.usuarioId) {
            throw new ForbiddenException(
                `Você não tem permissão para confirmar este aluguel.`,
            );
        }

        if (this.status !== AluguelStatus.SOLICITADO) {
            throw new AluguelException(`Aluguel não pode ser confirmado.`);
        }

        if (!this.contrato.aceiteLocatario) {
            throw new AluguelException(`Locatário não assinou o contrato.`);
        }

        this.assinarContrato({
            usuarioId: this.locador.id,
            enderecoIp: props.enderecoIp,
            assinaturaDigital: props.assinaturaDigital,
            userAgent: props.userAgent,
            latitude: props.latitude,
            longitude: props.longitude,
        });

        this.setStatus(AluguelStatus.CONFIRMADO);
    }

    cancelar(usuarioId: string, motivo?: string): void {
        if (this.locatario.id !== usuarioId) {
            throw new ForbiddenException(
                `Somente o locatário pode cancelar este aluguel.`,
            );
        }

        if (
            ![
                AluguelStatus.SOLICITADO,
                AluguelStatus.ATIVO,
                AluguelStatus.CONFIRMADO,
            ].includes(this.status)
        ) {
            throw new AluguelException(
                `Aluguel não pode ser cancelado do status ${this.status}`,
            );
        }

        if (!this.podeSerCancelado()) {
            throw new AluguelException(
                'Este aluguel não pode ser cancelado no status atual',
            );
        }

        // Aplicar multa se cancelamento após confirmação e < 12h antes da data início
        if (this.status === AluguelStatus.CONFIRMADO) {
            const horasAteInicio = DataUtils.diferencaEmHoras(
                DataUtils.agoraDate(),
                this.props.dataInicio,
            );

            if (horasAteInicio < 48) {
                const multaValue = DinheiroUtils.aplicarPercentual(
                    this.props.precoTotal,
                    25,
                );
                const multa = Multa.criar({
                    valorTotal: multaValue,
                    motivo: 'Cancelamento com menos de 12h de antecedência',
                });

                this.setMulta(multa);
            }
        }

        this.setStatus(AluguelStatus.CANCELADO);
        this.setMotivoRecusaLocador(motivo ?? 'Cancelado pelo usuário');
    }

    recusar(motivo: string, usuarioId: string): void {
        if (this.locador.id !== usuarioId) {
            throw new ForbiddenException(
                'Apenas o proprietário pode recusar a solicitação',
            );
        }

        if (this.status !== AluguelStatus.SOLICITADO) {
            throw new AluguelException(
                `Aluguel não pode ser recusado do status ${this.status}. Apenas solicitações pendentes podem ser recusadas.`,
            );
        }

        if (!this.podeSerRecusado()) {
            throw new AluguelException(
                'Esta solicitação não pode ser recusada no status atual',
            );
        }

        this.setStatus(AluguelStatus.RECUSADO);

        if (!motivo || motivo.trim().length === 0) {
            throw new InvalidPropsException('Motivo da recusa é obrigatório.');
        }
        this.setMotivoRecusaLocador(motivo);
    }

    voltarParaSolicitado(): void {
        if (this.status !== AluguelStatus.CONFIRMADO) {
            throw new AluguelException(
                `Aluguel não pode voltar para SOLICITADO do status ${this.status}`,
            );
        }

        this.setStatus(AluguelStatus.SOLICITADO);
    }

    finalizar(usuarioId: string): void {
        if (this.locatario.id !== usuarioId) {
            throw new ForbiddenException(
                `Você não tem permissão para finalizar este aluguel.`,
            );
        }

        if (this.status !== AluguelStatus.ATIVO) {
            throw new AluguelException(
                `Aluguel não pode ser finalizado do status ${this.status}`,
            );
        }

        this.setStatus(AluguelStatus.CONCLUIDO);
    }

    assinarContrato(props: AssinarContratoProps): void {
        if (
            this.locador.id !== props.usuarioId &&
            this.locatario.id !== props.usuarioId
        ) {
            throw new ForbiddenException(
                `Você não tem permissão para assinar este contrato.`,
            );
        }

        const isLocador = this.locador.id === props.usuarioId;

        if (!this.contrato) {
            const contrato = Contrato.criar();
            contrato.assinarContrato({
                usuarioTipo: isLocador ? 'locador' : 'locatario',
                assinaturaDigital: props.assinaturaDigital,
                dataHora: DataUtils.agoraDate(),
                enderecoIp: props.enderecoIp,
                userAgent: props.userAgent,
                latitude: props.latitude,
                longitude: props.longitude,
            });
        }

        this.contrato.assinarContrato({
            usuarioTipo: isLocador ? 'locador' : 'locatario',
            assinaturaDigital: props.assinaturaDigital,
            dataHora: DataUtils.agoraDate(),
            enderecoIp: props.enderecoIp,
            userAgent: props.userAgent,
            latitude: props.latitude,
            longitude: props.longitude,
        });
    }

    private calcularPrecoTotal(): void {
        if (
            this.props.itemSnapshot.permiteAluguelPorHora &&
            this.props.itemSnapshot.precoHora
        ) {
            const horas = DataUtils.calcularHoras(
                this.props.dataInicio,
                this.props.dataFim,
            );

            const precoTotal = DinheiroUtils.multiplicar(
                horas,
                this.props.itemSnapshot.precoHora,
            );
            this.setPrecoTotal(precoTotal);
            this.setPrecoTotalComTaxa(this.calcularPrecoTotalComTaxa());
        } else {
            // Para aluguel por dia: calcula dias exatos com precisão decimal
            // Exemplo: 2.375 dias = 2 dias + 9 horas = 2.375 diárias
            const diasExatos = DataUtils.calcularDias(
                this.props.dataInicio,
                this.props.dataFim,
            );

            const precoTotal = DinheiroUtils.multiplicar(
                diasExatos,
                this.props.itemSnapshot.precoDiaria,
            );

            this.setPrecoTotal(precoTotal);
            this.setPrecoTotalComTaxa(this.calcularPrecoTotalComTaxa());
        }
    }

    private validarPeriodoAluguel(): void {
        if (this.props.itemSnapshot.permiteAluguelPorHora) {
            const horas = DataUtils.calcularHoras(
                this.props.dataInicio,
                this.props.dataFim,
            );
            const horasMinimas =
                this.props.itemSnapshot.horasMinimosAluguel || 1;
            const horasMaximas =
                this.props.itemSnapshot.horasMaximosAluguel || 720;

            if (horas < horasMinimas) {
                throw new AluguelException(
                    `Período mínimo de aluguel é ${horasMinimas} hora(s).`,
                );
            }

            if (horas > horasMaximas) {
                throw new AluguelException(
                    `Período máximo de aluguel é ${horasMaximas} hora(s).`,
                );
            }
        } else {
            const dias = DataUtils.calcularDias(
                this.props.dataInicio,
                this.props.dataFim,
            );
            const diasMinimos = this.props.itemSnapshot.diasMinimosAluguel || 1;
            const diasMaximos =
                this.props.itemSnapshot.diasMaximosAluguel || 365;

            if (dias < diasMinimos) {
                throw new AluguelException(
                    `Período mínimo de aluguel é ${diasMinimos} dia(s).`,
                );
            }

            if (dias > diasMaximos) {
                throw new AluguelException(
                    `Período máximo de aluguel é ${diasMaximos} dia(s).`,
                );
            }
        }
    }

    private calcularPrecoTotalComTaxa(): number {
        const valorTaxa = DinheiroUtils.multiplicar(
            this.props.precoTotal,
            this.taxaApp,
        );
        return DinheiroUtils.somar(this.props.precoTotal, valorTaxa);
    }

    /**
     * Adiciona margem de segurança de 1 hora ao período
     * Usado para verificar conflitos entre aluguéis consecutivos
     *
     * @param dataInicio Data de início do período
     * @param dataFim Data de fim do período
     * @returns Objeto com período ajustado incluindo margem de 1 hora
     */
    private adicionarMargemSeguranca(
        dataInicio: Date,
        dataFim: Date,
    ): { inicio: Date; fim: Date } {
        const UMA_HORA_MS = 60 * 60 * 1000;

        return {
            inicio: new Date(dataInicio.getTime() - UMA_HORA_MS),
            fim: new Date(dataFim.getTime() + UMA_HORA_MS),
        };
    }

    /**
     * Verifica se um período de aluguel (dataInicio -> dataFim) sobrepõe com algum bloqueio
     * de disponibilidade do item
     *
     * @param dataInicio Início do período de aluguel solicitado
     * @param dataFim Fim do período de aluguel solicitado
     * @param datasBloqueadas Intervalos de datas bloqueadas do item
     * @returns true se há sobreposição, false caso contrário
     *
     * @example
     * const temConflito = verificarSobreposicaoBloqueios(
     *   new Date('2024-12-25T00:00:00Z'),
     *   new Date('2024-12-26T23:59:59Z'),
     *   [{
     *     dataInicio: new Date('2024-12-25T00:00:00Z'),
     *     dataFim: new Date('2024-12-26T23:59:59Z'),
     *     motivo: 'Manutenção'
     *   }]
     * ); // true - conflita com bloqueio
     */
    private verificarSobreposicaoBloqueios(
        dataInicio: Date,
        dataFim: Date,
        datasBloqueadas?: DatasBloqueadas[],
    ): boolean {
        if (!datasBloqueadas || datasBloqueadas.length === 0) {
            return false;
        }

        for (const bloqueio of datasBloqueadas) {
            if (
                this.temSobreposicao(
                    dataInicio,
                    dataFim,
                    bloqueio.dataInicio,
                    bloqueio.dataFim,
                )
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Retorna todos os bloqueios que sobrepõem com o período de aluguel solicitado
     * Adiciona margem de 1 hora antes e depois para evitar aluguéis muito próximos
     *
     * @param dataInicio Início do período de aluguel
     * @param dataFim Fim do período de aluguel
     * @param datasBloqueadas Intervalos de datas bloqueadas
     * @returns Array de bloqueios que sobrepõem
     *
     * @example
     * const conflitos = obterBloqueiosSobrepostos(
     *   new Date('2024-12-25T00:00:00Z'),
     *   new Date('2024-12-26T23:59:59Z'),
     *   bloqueios
     * );
     * if (conflitos.length > 0) {
     *   throw new Error(`Item indisponível: ${conflitos.map(c => c.motivo).join(', ')}`);
     * }
     */
    private obterBloqueiosSobrepostos(
        dataInicio: Date,
        dataFim: Date,
        datasBloqueadas?: DatasBloqueadas[],
    ): DatasBloqueadas[] {
        if (!datasBloqueadas || datasBloqueadas.length === 0) {
            return [];
        }

        const { inicio, fim } = this.adicionarMargemSeguranca(
            dataInicio,
            dataFim,
        );

        return datasBloqueadas.filter((bloqueio) =>
            this.temSobreposicao(
                inicio,
                fim,
                bloqueio.dataInicio,
                bloqueio.dataFim,
            ),
        );
    }

    /**
     * Função auxiliar: Verifica se dois períodos se sobrepõem
     *
     * Dois períodos NÃO se sobrepõem se:
     *   - fim1 <= inicio2 (período 1 termina antes de período 2 começar)
     *   - OR fim2 <= inicio1 (período 2 termina antes de período 1 começar)
     *
     * @param inicio1 Início do primeiro período
     * @param fim1 Fim do primeiro período
     * @param inicio2 Início do segundo período (pode ser string ISO)
     * @param fim2 Fim do segundo período (pode ser string ISO)
     * @returns true se há sobreposição
     *
     * @example
     * // Períodos que se sobrepõem
     * temSobreposicao(
     *   new Date('2024-12-25T00:00:00Z'),
     *   new Date('2024-12-26T23:59:59Z'),
     *   new Date('2024-12-24T00:00:00Z'),
     *   new Date('2024-12-25T12:00:00Z')
     * ); // true
     *
     * // Períodos que NÃO se sobrepõem
     * temSobreposicao(
     *   new Date('2024-12-25T00:00:00Z'),
     *   new Date('2024-12-26T23:59:59Z'),
     *   new Date('2024-12-27T00:00:00Z'),
     *   new Date('2024-12-28T23:59:59Z')
     * ); // false
     */
    private temSobreposicao(
        inicio1: Date,
        fim1: Date,
        inicio2: Date | string,
        fim2: Date | string,
    ): boolean {
        const dataInicio2 =
            typeof inicio2 === 'string' ? new Date(inicio2) : inicio2;
        const dataFim2 = typeof fim2 === 'string' ? new Date(fim2) : fim2;

        return !(fim1 <= dataInicio2 || dataFim2 <= inicio1);
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

    private setItemSnapshot(snapshot: ItemSnapshot): void {
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

    private setPrecoTotalComTaxa(precoTotalComTaxa: number): void {
        if (precoTotalComTaxa < 0)
            throw new InvalidPropsException(
                'Preço total com taxa do aluguel não pode ser negativo.',
            );
        this.props.precoTotalComTaxa = precoTotalComTaxa;
    }

    private setCaucao(caucao?: Caucao): void {
        this.props.caucao = caucao;
    }

    private setMulta(multa?: Multa): void {
        this.props.multa = multa;
    }

    private setContrato(contrato: Contrato): void {
        if (!contrato)
            throw new InvalidPropsException(
                'Contrato do aluguel é obrigatório.',
            );
        this.props.contrato = contrato;
    }

    private setDataInicio(dataInicio: string | Date): void {
        if (dataInicio instanceof Date) {
            this.props.dataInicio = dataInicio;
            return;
        }

        if (!dataInicio)
            throw new InvalidPropsException('Data de início é obrigatória.');

        const data = new Date(dataInicio);
        if (Number.isNaN(data.getTime()))
            throw new InvalidPropsException('Data de início inválida.');

        const isoString = data.toISOString();
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        if (!isoRegex.test(isoString))
            throw new InvalidPropsException(
                'Data de início deve estar no formato ISO 8601 com horas, minutos e segundos (YYYY-MM-DDTHH:mm:ss.sssZ).',
            );

        this.props.dataInicio = data;
    }

    private setDataFim(dataFim: string | Date): void {
        if (dataFim instanceof Date) {
            this.props.dataFim = dataFim;
            return;
        }

        if (!dataFim)
            throw new InvalidPropsException('Data de fim é obrigatória.');

        const data = new Date(dataFim);
        if (Number.isNaN(data.getTime()))
            throw new InvalidPropsException('Data de fim inválida.');

        const isoString = data.toISOString();
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        if (!isoRegex.test(isoString))
            throw new InvalidPropsException(
                'Data de fim deve estar no formato ISO 8601 com horas, minutos e segundos (YYYY-MM-DDTHH:mm:ss.sssZ).',
            );

        if (data < this.props.dataInicio)
            throw new InvalidPropsException(
                'Data de fim não pode ser anterior à data de início.',
            );
        this.props.dataFim = data;
    }

    private setStatus(status: AluguelStatus): void {
        if (!Object.values(AluguelStatus).includes(status))
            throw new InvalidPropsException('Status do aluguel inválido.');
        this.props.status = status;
    }

    private setObservacoesLocatario(observacoesLocatario?: string): void {
        this.props.observacoesLocatario = observacoesLocatario;
    }

    private setMotivoRecusaLocador(motivoRecusaLocador?: string): void {
        this.props.motivoRecusaLocador = motivoRecusaLocador;
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

    get observacoesLocatario(): string | undefined {
        return this.props.observacoesLocatario;
    }

    get motivoRecusaLocador(): string | undefined {
        return this.props.motivoRecusaLocador;
    }

    get itemId(): string {
        return this.props.itemId;
    }

    get itemSnapshot(): ItemSnapshot {
        return this.props.itemSnapshot;
    }

    get caucao(): Caucao | undefined {
        return this.props.caucao;
    }

    get multa(): Multa | undefined {
        return this.props.multa;
    }

    get precoTotal(): number {
        return this.props.precoTotal;
    }

    get precoTotalComTaxa(): number {
        return this.props.precoTotalComTaxa;
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

    podeSerCancelado(): boolean {
        return [
            AluguelStatus.SOLICITADO,
            AluguelStatus.ATIVO,
            AluguelStatus.CONFIRMADO,
        ].includes(this.status);
    }

    podeSerRecusado(): boolean {
        return this.status === AluguelStatus.SOLICITADO;
    }

    toDto(): AluguelDto {
        return {
            id: this._id,
            locador: this.props.locador.toDto(),
            locatario: this.props.locatario.toDto(),
            item: {
                id: this.props.itemId,
                descricao: this.props.itemSnapshot.descricao,
                nome: this.props.itemSnapshot.nome,
                precoDiaria: this.props.itemSnapshot.precoDiaria,
                precoHora: this.props.itemSnapshot.precoHora,
                caucaoObrigatoria: this.props.itemSnapshot.caucaoObrigatoria,
                fotoUrl: this.props.itemSnapshot.fotoUrl,
                valorCaucao: this.props.itemSnapshot.valorCaucao,
            },
            precoTotal: this.props.precoTotal,
            precoTotalComTaxa: this.precoTotalComTaxa,
            caucao: this.props.caucao?.toDto(),
            dataInicio: this.props.dataInicio,
            dataFim: this.props.dataFim,
            status: this.props.status,
            observacoesLocatario: this.props.observacoesLocatario,
            motivoRecusaLocador: this.props.motivoRecusaLocador,
            criadoEm: this.props.criadoEm,
        };
    }
}
