import { Column } from 'typeorm';

/**
 * Value Object: PessoaAluguel
 * Encapsula dados essenciais de uma pessoa no contexto do aluguel.
 * Embedded na tabela aluguel (sem tabela separada).
 *
 * Conceito:
 * - Mantém apenas ID (referência) e Nome (projeção desnormalizada)
 * - Nome é copiado no momento do aluguel para exibição sem carregar Usuario
 * - ID permite relacionar com a entidade Usuario se necessário (lazy loading)
 * - Padrão DDD: projeção para otimização de leitura
 */
export class LocadorModel {
    @Column({
        name: 'locador_usuario_id',
        type: 'uuid',
        comment: 'Referência ao usuario (chave estrangeira conceitual)',
    })
    id: string;

    @Column({
        name: 'locador_usuario_nome',
        type: 'varchar',
        length: 255,
        comment:
            'Nome da pessoa (projeção desnormalizada para exibição rápida)',
    })
    nome: string;

    static criar(props: { id: string; nome: string }): LocadorModel {
        const pessoa = new LocadorModel();
        Object.assign(pessoa, props);
        return pessoa;
    }
}

export class LocatarioModel {
    @Column({
        name: 'locatario_usuario_id',
        type: 'uuid',
        comment: 'Referência ao usuario (chave estrangeira conceitual)',
    })
    id: string;

    @Column({
        name: 'locatario_usuario_nome',
        type: 'varchar',
        length: 255,
        comment:
            'Nome da pessoa (projeção desnormalizada para exibição rápida)',
    })
    nome: string;

    static criar(props: { id: string; nome: string }): LocatarioModel {
        const pessoa = new LocatarioModel();
        Object.assign(pessoa, props);
        return pessoa;
    }
}
