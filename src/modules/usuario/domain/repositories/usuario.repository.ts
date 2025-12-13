import { Usuario } from '../usuario';

export interface UsuarioRepository {
    salvar(usuario: Usuario): Promise<Usuario>;
    buscarPorCPF(cpf: string): Promise<Usuario | null>;
    buscarPorId(id: string): Promise<Usuario | null>;
}
