import { Column } from 'typeorm';

/**
 * Value Object: Pessoa
 * Encapsula dados essenciais de uma pessoa no contexto do aluguel.
 * Embedded na tabela aluguel (sem tabela separada).
 *
 * Conceito:
 * - Mantém apenas ID (referência) e Nome (projeção desnormalizada)
 * - Nome é copiado no momento do aluguel para exibição sem carregar Usuario
 * - ID permite relacionar com a entidade Usuario se necessário (lazy loading)
 * - Padrão DDD: projeção para otimização de leitura
 *
 * Exemplo:
 * - Locador: { id: uuid, nome: "João Silva" }
 * - Pode exibir "João Silva" sem query em Usuario
 * - Se precisar mais dados, usa locadorId para carregar Usuario completo
 */
export class PessoaModel {
    @Column({
        name: 'usuario_id',
        type: 'uuid',
        comment: 'Referência ao usuario (chave estrangeira conceitual)',
    })
    id: string;

    @Column({
        name: 'usuario_nome',
        type: 'varchar',
        length: 255,
        comment: 'Nome da pessoa (projeção desnormalizada para exibição rápida)',
    })
    nome: string;

    /**
     * Factory method para criar uma nova pessoa
     */
    static criar(props: { id: string; nome: string }): PessoaModel {
        const pessoa = new PessoaModel();
        Object.assign(pessoa, props);
        return pessoa;
    }
}
