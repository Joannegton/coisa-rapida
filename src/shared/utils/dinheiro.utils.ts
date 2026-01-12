import { Decimal } from 'decimal.js';

export class DinheiroUtils {
    /**
     * 🧮 Arredonda valor para 2 casas decimais (centavos)
     *
     * Usa arredondamento financeiro (sempre arredonda meio para cima).
     * Exemplo: 123.456789 → 123.46
     *
     * @param valor - Valor a ser arredondado
     * @returns Valor arredondado para 2 casas decimais
     */
    static arredondar(valor: number): number {
        return new Decimal(valor).toDecimalPlaces(2).toNumber();
    }

    /**
     * ➕ Soma dois ou mais valores monetários
     *
     * @param valores - Valores a serem somados
     * @returns Soma precisa dos valores
     *
     * @example
     * ```typescript
     * DinheiroUtils.somar(10.5, 20.3, 5.2); // 36.00
     * ```
     */
    static somar(...valores: number[]): number {
        return valores.reduce(
            (total, valor) => new Decimal(total).plus(valor).toNumber(),
            0,
        );
    }

    /**
     * ➖ Subtrai valores monetários
     *
     * @param valorBase - Valor base
     * @param valores - Valores a serem subtraídos
     * @returns Resultado da subtração
     *
     * @example
     * ```typescript
     * DinheiroUtils.subtrair(100.00, 10.5, 5.2); // 84.30
     * ```
     */
    static subtrair(valorBase: number, ...valores: number[]): number {
        let resultado = new Decimal(valorBase);
        valores.forEach((valor) => {
            resultado = resultado.minus(valor);
        });
        return resultado.toDecimalPlaces(2).toNumber();
    }

    /**
     * ✖️ Multiplica valores monetários
     *
     * @param valor - Valor base
     * @param multiplicador - Fator de multiplicação
     * @returns Resultado da multiplicação arredondado
     *
     * @example
     * ```typescript
     * DinheiroUtils.multiplicar(50.00, 3); // 150.00
     * DinheiroUtils.multiplicar(100.00, 0.1); // 10.00 (10%)
     * ```
     */
    static multiplicar(valor: number, multiplicador: number): number {
        return new Decimal(valor)
            .mul(multiplicador)
            .toDecimalPlaces(2)
            .toNumber();
    }

    /**
     * ➗ Divide valores monetários
     *
     * @param dividendo - Valor a ser dividido
     * @param divisor - Divisor
     * @returns Resultado da divisão arredondado
     *
     * @example
     * ```typescript
     * DinheiroUtils.dividir(100.00, 3); // 33.33
     * ```
     */
    static dividir(dividendo: number, divisor: number): number {
        if (divisor === 0) {
            throw new Error('Divisão por zero não permitida');
        }
        return new Decimal(dividendo)
            .div(divisor)
            .toDecimalPlaces(2)
            .toNumber();
    }

    /**
     * Aplica um percentual a um valor
     *
     * @param valor - Valor base
     * @param percentual - Percentual a aplicar (ex: 10 para 10%)
     * @returns Valor com o percentual aplicado
     *
     * @example
     * ```typescript
     * DinheiroUtils.aplicarPercentual(100.00, 10); // 10.00 (10% de 100)
     * DinheiroUtils.aplicarPercentual(250.00, 5); // 12.50 (5% de 250)
     * ```
     */
    static aplicarPercentual(valor: number, percentual: number): number {
        return this.multiplicar(valor, percentual / 100);
    }
}
