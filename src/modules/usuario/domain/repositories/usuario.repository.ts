import { Usuario } from '../usuario';

export interface UsuarioRepository {
    salvar(usuario: Usuario): Promise<Usuario>;
    buscarPorCPF(cpf: string): Promise<Usuario | null>;
    buscarPorId(id: string, carregarRelacoes: boolean): Promise<Usuario | null>;
    buscarVerificacaoEEndereco(
        id: string,
    ): Promise<{ verificado: boolean; endereco?: any } | null>;
}
