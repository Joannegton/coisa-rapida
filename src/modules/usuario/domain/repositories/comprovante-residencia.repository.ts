import { ComprovanteResidencia } from '../ComprovanteResidencia';

export interface ComprovanteResidenciaRepository {
    salvar(comprovante: ComprovanteResidencia): Promise<void>;
    buscarPorId(id: string): Promise<ComprovanteResidencia | null>;
    buscarPorUsuarioId(
        usuarioId: string,
    ): Promise<ComprovanteResidencia | null>;
    listarTodos(): Promise<ComprovanteResidencia[]>;
    deletar(id: string): Promise<void>;
}
