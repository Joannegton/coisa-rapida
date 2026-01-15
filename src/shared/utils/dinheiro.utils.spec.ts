import { DinheiroUtils } from './dinheiro.utils';

describe('DinheiroUtils', () => {
    describe('arredondar', () => {
        it('deve arredondar para 2 casas decimais', () => {
            expect(DinheiroUtils.arredondar(123.456789)).toBe(123.46);
            expect(DinheiroUtils.arredondar(123.444444)).toBe(123.44);
            expect(DinheiroUtils.arredondar(123.445)).toBe(123.45);
        });

        it('deve arredondar meio para cima (arredondamento financeiro)', () => {
            expect(DinheiroUtils.arredondar(1.5)).toBe(1.5);
            expect(DinheiroUtils.arredondar(1.505)).toBe(1.51);
            expect(DinheiroUtils.arredondar(1.504)).toBe(1.5);
        });
    });

    describe('somar', () => {
        it('deve somar múltiplos valores', () => {
            expect(DinheiroUtils.somar(10.5, 20.3, 5.2)).toBe(36.0);
            expect(DinheiroUtils.somar(0.1, 0.2)).toBe(0.3);
        });

        it('deve retornar 0 para array vazio', () => {
            expect(DinheiroUtils.somar()).toBe(0);
        });
    });

    describe('subtrair', () => {
        it('deve subtrair valores', () => {
            expect(DinheiroUtils.subtrair(100.0, 10.5, 5.2)).toBe(84.3);
            expect(DinheiroUtils.subtrair(50.0, 25.0)).toBe(25.0);
        });
    });

    describe('multiplicar', () => {
        it('deve multiplicar valores', () => {
            expect(DinheiroUtils.multiplicar(50.0, 3)).toBe(150.0);
            expect(DinheiroUtils.multiplicar(100.0, 0.1)).toBe(10.0);
            expect(DinheiroUtils.multiplicar(10.5, 2.5)).toBe(26.25);
        });
    });

    describe('dividir', () => {
        it('deve dividir valores', () => {
            expect(DinheiroUtils.dividir(100.0, 3)).toBe(33.33);
            expect(DinheiroUtils.dividir(50.0, 2)).toBe(25.0);
        });

        it('deve lançar erro para divisão por zero', () => {
            expect(() => DinheiroUtils.dividir(100, 0)).toThrow(
                'Divisão por zero não permitida',
            );
        });
    });
});
