import { ApiProperty } from '@nestjs/swagger';

export class PreferenciaPagamentoResponseDto {
    @ApiProperty({
        description: 'ID da preferência de pagamento',
        example: '123456789',
    })
    id?: string;

    @ApiProperty({
        description: 'URL de checkout para produção',
        example:
            'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123456789',
    })
    init_point?: string;

    @ApiProperty({
        description: 'URL de checkout para ambiente de teste',
        example:
            'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123456789',
    })
    sandbox_init_point?: string;

    @ApiProperty({
        description: 'ID do aluguel',
        example: 'uuid-do-aluguel',
    })
    aluguelId: string;

    @ApiProperty({
        description: 'ID do pagamento criado',
        example: 'uuid-do-pagamento',
    })
    pagamentoId: string;
}
