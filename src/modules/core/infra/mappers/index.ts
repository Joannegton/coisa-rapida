import { AluguelMapper } from './aluguel.mapper';
import { CaucaoMapper } from './caucao.mapper';
import { ContratoMapper } from './contrato.mapper';
import { MultaMapper } from './multa.mapper';
import { OutboxEventMapper } from './outbox-event.mapper';
import { PessoaMapper } from './pessoa.mapper';
import { SnapshotItemMapper } from './snapshot-item.mapper';

export const CoreMappers = [
    AluguelMapper,
    CaucaoMapper,
    ContratoMapper,
    MultaMapper,
    OutboxEventMapper,
    PessoaMapper,
    SnapshotItemMapper,
];
