import type { ItemRepository } from 'src/modules/item/domain/repositories/item.repository';
import {
    AdicionarBloqueioProps,
    CoreItemService,
    ItemResult,
    RemoverBloqueioProps,
} from '../../domain/services/item.service';
import { Inject, NotFoundException } from '@nestjs/common';

export class CoreItemServiceImpl implements CoreItemService {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
    ) {}
    async buscar(id: string): Promise<ItemResult> {
        const item = await this.itemRepository.buscar(id);
        if (!item) {
            throw new NotFoundException('Item não encontrado');
        }

        const itemResult: ItemResult = {
            id: item.id,
            usuarioId: item.usuarioId,
            versao: item.versao,
            descricao: item.descricao,
            nome: item.nome,
            precoDiaria: item.precos.precoPorDia,
            precoHora: item.precos.precoPorHora,
            valorCaucao: item.precos.valorCaucao,
            caucaoObrigatoria: item.precos.caucaoObrigatoria,
            fotoUrl: item.fotos.find((f) => f.ePrincipal())?.url,
            disponibilidade: {
                disponivel: item.disponibilidade.disponivel,
                datasBloqueadas: item.disponibilidade.datasBloqueadas,
                permiteAluguelPorHora:
                    item.disponibilidade?.permiteAluguelPorHora,
                diasMinimosAluguel: item.disponibilidade?.diasMinimosAluguel,
                diasMaximosAluguel: item.disponibilidade?.diasMaximosAluguel,
                horasMinimosAluguel: item.disponibilidade?.horasMinimosAluguel,
                horasMaximosAluguel: item.disponibilidade?.horasMaximosAluguel,
            },
        };

        return itemResult;
    }

    async adicionarBloqueio(props: AdicionarBloqueioProps): Promise<void> {
        // NOTA: Em microsserviços, esta chamada seria via HTTP/gRPC ou evento assíncrono
        // Ver SAGA_COREOGRAFADA.md para implementação completa
        const item = await this.itemRepository.buscarComLock(
            props.itemId,
            props.useLock,
        );

        if (!item) {
            throw new NotFoundException('Item não encontrado');
        }

        item.adicionarDataBloqueada({
            dataInicio: props.bloqueio.dataInicio,
            dataFim: props.bloqueio.dataFim,
            motivo: 'Bloqueio automático para aluguel',
        });

        await this.itemRepository.salvar(item);
    }

    async removerBloqueio(props: RemoverBloqueioProps): Promise<void> {
        const item = await this.itemRepository.buscarComLock(
            props.itemId,
            props.useLock,
        );

        if (!item) {
            throw new NotFoundException('Item não encontrado');
        }

        item.removerDataBloqueada({
            dataInicio: props.dataInicio,
            dataFim: props.dataFim,
        });

        await this.itemRepository.salvar(item);
    }
}
