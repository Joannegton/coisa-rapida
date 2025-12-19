export interface UsuarioResult {
    verificado: boolean;
    endereco?: Endereco;
}

type Endereco = {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais?: string;
    latitude?: number;
    longitude?: number;
};

export interface UsuarioService {
    buscar(usuarioId: string): Promise<UsuarioResult>;
}
