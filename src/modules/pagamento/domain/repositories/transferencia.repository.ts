import {
    StatusTransferencia,
    TipoTransferencia,
} from '../../infra/models/transferencia.model';
import { Transferencia } from '../transferencia';

export interface TransferenciaRepository {
    salvar(transferencia: Transferencia): Promise<void>;
    buscarPorId(id: string): Promise<Transferencia | null>;
    buscarPorAluguelId(aluguelId: string): Promise<Transferencia[]>;
    buscarPorAluguelIdETipo(
        aluguelId: string,
        tipo: TipoTransferencia,
    ): Promise<Transferencia | null>;
    buscarPorStatus(status: StatusTransferencia): Promise<Transferencia[]>;
    buscarAguardandoManual(): Promise<Transferencia[]>;
}
