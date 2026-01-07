import { Column, CreateDateColumn } from 'typeorm';

export interface AceiteContratoModel {
    assinaturaDigital: string; // Hash da assinatura digital
    dataHora: Date;
    enderecoIp: string;
    userAgent: string;
    latitude?: number;
    longitude?: number;
}

export class ContratoModel {
    @Column({
        name: 'contrato_versao',
        type: 'varchar',
        length: 10,
        comment: 'Versão do contrato (ex: 1.0, 1.1, 2.0)',
    })
    versao: string;

    @Column({
        name: 'contrato_conteudo_html',
        type: 'text',
        comment:
            'Conteúdo HTML renderizado do contrato (gerado automaticamente com template)',
    })
    conteudoHtml: string;

    @Column({
        name: 'contrato_aceite_locador',
        type: 'jsonb',
        nullable: true,
        comment:
            'JSON com assinatura digital, data, IP e geolocalização do locador',
    })
    aceiteLocador?: AceiteContratoModel;

    @Column({
        name: 'contrato_aceite_locatario',
        type: 'jsonb',
        nullable: true,
        comment:
            'JSON com assinatura digital, data, IP e geolocalização do locatário',
    })
    aceiteLocatario?: AceiteContratoModel;

    @CreateDateColumn({
        name: 'contrato_criado_em',
        type: 'timestamp',
        comment:
            'Data/hora de criação do contrato (ou atualização se nova versão)',
    })
    criadoEm: Date;

    static criar(props: Partial<ContratoModel>): ContratoModel {
        const contrato = new ContratoModel();
        Object.assign(contrato, {
            ...props,
        });
        return contrato;
    }
}
