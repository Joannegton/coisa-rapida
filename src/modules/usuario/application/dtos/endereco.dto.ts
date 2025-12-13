export class EnderecoDto {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pais?: string;
    latitude?: number;
    longitude?: number;
}
