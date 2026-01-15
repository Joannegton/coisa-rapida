export class ServicoExcecao extends Error {
    constructor(message: string = 'Erro de serviço') {
        super(message);
        this.name = 'ServicoExcecao';
    }
}

export interface Resultado<T, E> {
    ehFalha(): boolean;
    ehSucesso(): boolean;
    valor?: T;
    erro?: E;
}

export class ResultadoSucesso<T, E> implements Resultado<T, E> {
    constructor(public valor: T) {}

    ehFalha(): boolean {
        return false;
    }

    ehSucesso(): boolean {
        return true;
    }
}

export class ResultadoFalha<T, E> implements Resultado<T, E> {
    constructor(public erro: E) {}

    ehFalha(): boolean {
        return true;
    }

    ehSucesso(): boolean {
        return false;
    }
}

export type ResultadoAssincrono<T, E> = Promise<Resultado<T, E>>;

export class ResultadoUtil {
    static sucesso<T, E>(valor?: T): Resultado<T, E> {
        return new ResultadoSucesso<T, E>(valor as T);
    }

    static falha<T, E>(erro: E): Resultado<T, E> {
        return new ResultadoFalha<T, E>(erro);
    }

    static resultados<E extends ServicoExcecao, V>(
        listaResultados: Resultado<unknown, E>[],
        valorSucesso: V,
    ): Resultado<V, E> {
        if (listaResultados.some((r) => r.ehFalha())) {
            return listaResultados.find((r) => r.ehFalha()) as Resultado<V, E>;
        }
        return new ResultadoSucesso(valorSucesso);
    }
}
