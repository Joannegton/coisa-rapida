import { DateTime } from 'luxon';

/**
 * Utilitários para manipulação de datas com timezone de São Paulo
 *
 * - Retornam Date compatíveis com TypeORM/banco de dados
 */
export class DataUtils {
    /**
     * Retorna a data/hora ATUAL em São Paulo (UTC-3)
     *
     * @returns Data/hora em São Paulo como Date (compatível com banco de dados)
     */
    static agoraDate(): Date {
        return DateTime.now().setZone('America/Sao_Paulo').toJSDate();
    }

    /**
     * Retorna a data/hora em São Paulo como DateTime (Luxon)
     * Use quando precisar fazer operações complexas (adição, subtração, comparação, etc.)
     *
     * @returns DateTime no timezone de São Paulo
     */
    static agoraDateTime(): DateTime {
        return DateTime.now().setZone('America/Sao_Paulo');
    }

    /**
     * Formata uma data para exibição em português (Brasil)
     * @returns String formatada para o usuário
     *
     * @example
     * DataUtils.formatarDataBr(agoraDate())
     * → "10/01/2026 01:21"
     *
     * DataUtils.formatarDataBr(agoraDate(), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm:ss")
     * → "sexta-feira, 10 de janeiro de 2026 às 01:21:00"
     */
    static formatarDataBr(
        date: Date,
        formato: string = 'dd/MM/yyyy HH:mm',
    ): string {
        return DateTime.fromJSDate(date)
            .setZone('America/Sao_Paulo')
            .toFormat(formato, { locale: 'pt-BR' });
    }

    /**
     * Calcula a diferença em dias entre duas datas (com precisão decimal)
     * Útil para cálculo de aluguel por dia/hora
     *
     * @param inicio - Data de início
     * @param fim - Data de fim
     * @returns Diferença em dias (ex: 2.375 = 2 dias + 9 horas)
     *
     * @example
     * const dias = DataUtils.calcularDias(
     *   new Date('2026-01-01'),
     *   new Date('2026-01-03T09:00:00') // 2 dias + 9 horas
     * );
     * → 2.375
     */
    static calcularDias(inicio: Date, fim: Date): number {
        const dtInicio =
            DateTime.fromJSDate(inicio).setZone('America/Sao_Paulo');
        const dtFim = DateTime.fromJSDate(fim).setZone('America/Sao_Paulo');
        return dtFim.diff(dtInicio, 'days').days;
    }

    /**
     * Calcula a diferença em horas entre duas datas (com precisão decimal)
     *
     * @param inicio - Data de início
     * @param fim - Data de fim
     * @returns Diferença em horas
     *
     * @example
     * const horas = DataUtils.calcularHoras(
     *   new Date('2026-01-01T10:00:00'),
     *   new Date('2026-01-01T12:30:00')
     * );
     * → 2.5
     */
    static calcularHoras(inicio: Date, fim: Date): number {
        const dtInicio =
            DateTime.fromJSDate(inicio).setZone('America/Sao_Paulo');
        const dtFim = DateTime.fromJSDate(fim).setZone('America/Sao_Paulo');
        return dtFim.diff(dtInicio, 'hours').hours;
    }

    /**
     * Calcula a diferença em horas entre duas datas
     *
     * @param dataInicio - Data de início
     * @param dataFim - Data de fim
     * @returns Diferença em horas
     *
     * @example
     * const horas = DataUtils.diferencaEmHoras(
     *   new Date('2026-01-10T10:00:00'),
     *   new Date('2026-01-15T10:00:00')
     * );
     * → 120
     */
    static diferencaEmHoras(dataInicio: Date, dataFim: Date): number {
        return this.calcularHoras(dataInicio, dataFim);
    }
}
