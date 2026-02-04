import { Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { AtualizarItemDTO } from '../dtos/atualizar-item.dto';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { ValidadorConteudo } from 'src/shared/utils/validador-conteudo.utils';
import { AtualizarItemProps } from '../../domain/item';
import { ModeracaoFilaService } from '../../infra/services/moderacao.fila.service';
import { ItemModeradoEvent } from '../../domain/events/item-moderado.event';

export type AtualizarItemUseCaseProps = AtualizarItemDTO & {
    itemId: string;
    usuarioId: string;
};

export class AtualizarItemUseCase {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
        private readonly moderacaoFilaService: ModeracaoFilaService,
        private readonly eventBus: EventBus,
    ) {}

    async execute(props: AtualizarItemUseCaseProps): Promise<void> {
        const itemDomain = await this.itemRepository.buscar(props.itemId);
        if (!itemDomain) {
            throw new NotFoundException('Item não encontrado');
        }
        console.log('props', props);

        if (itemDomain.usuarioId !== props.usuarioId) {
            throw new ConflictException(
                'Você não tem permissão para atualizar este item',
            );
        }

        const params: AtualizarItemProps = {};

        if (props.nome !== undefined) {
            params.nome = props.nome;
        }

        if (props.descricao !== undefined) {
            params.descricao = props.descricao;
        }

        const conteudoParaValidar = `${params.nome ?? itemDomain.nome} ${params.descricao ?? itemDomain.descricao}`;
        const validacao = ValidadorConteudo.validar(conteudoParaValidar);

        if (validacao.problemasDetectados.length > 0) {
            throw new InvalidPropsException(
                `Conteúdo inválido: ${validacao.problemasDetectados.join('; ')}`,
            );
        }

        if (props.categoria !== undefined) {
            params.categoria = props.categoria;
        }

        if (props.estado !== undefined) {
            params.estado = props.estado;
        }

        if (props.tipoAnuncio !== undefined) {
            params.tipoAnuncio = props.tipoAnuncio;
        }

        if (
            props.precoPorDia !== undefined ||
            props.precoPorHora !== undefined ||
            props.valorCaucao !== undefined ||
            props.caucaoObrigatoria !== undefined
        ) {
            params.precos = {
                precoPorDia: props.precoPorDia,
                precoPorHora: props.precoPorHora,
                valorCaucao: props.valorCaucao,
                caucaoObrigatoria: props.caucaoObrigatoria,
            };
        }

        if (
            props.diasMinimosAluguel !== undefined ||
            props.diasMaximosAluguel !== undefined ||
            props.permitAluguelsConsecutivos !== undefined ||
            props.permiteAluguelPorHora !== undefined ||
            props.horasMinimosAluguel !== undefined ||
            props.horasMaximosAluguel !== undefined
        ) {
            const dispAtual = itemDomain.disponibilidade;
            if (dispAtual) {
                params.disponibilidade = {
                    diasMinimosAluguel:
                        props.diasMinimosAluguel ??
                        dispAtual.diasMinimosAluguel,
                    diasMaximosAluguel:
                        props.diasMaximosAluguel ??
                        dispAtual.diasMaximosAluguel,
                    permitAluguelsConsecutivos:
                        props.permitAluguelsConsecutivos ??
                        dispAtual.permitAluguelsConsecutivos,
                    permiteAluguelPorHora:
                        props.permiteAluguelPorHora ??
                        dispAtual.permiteAluguelPorHora,
                    horasMinimosAluguel:
                        props.horasMinimosAluguel ??
                        dispAtual.horasMinimosAluguel,
                    horasMaximosAluguel:
                        props.horasMaximosAluguel ??
                        dispAtual.horasMaximosAluguel,
                };
            }
        }

        itemDomain.atualizar(params);

        const itemAtualizado = await this.itemRepository.salvar(itemDomain);

        if (props.nome || props.descricao) {
            Promise.all([
                this.moderacaoFilaService
                    .agendarVerificacaoAvancada({
                        descricao: params.descricao ?? itemDomain.descricao,
                        itemId: itemAtualizado.id,
                        nome: params.nome ?? itemDomain.nome,
                        usuarioId: itemAtualizado.usuarioId,
                        prioridade: 'alto',
                    })
                    .catch((error) => {
                        console.error(
                            'Erro ao agendar verificação avançada (não crítico):',
                            error,
                        );
                    }),
                Promise.resolve(
                    this.eventBus.publish(
                        new ItemModeradoEvent(
                            itemAtualizado.id,
                            itemAtualizado.moderacao?.status || 'pendente',
                            itemAtualizado.atualizadoEm,
                            validacao.problemasDetectados,
                        ),
                    ),
                ),
            ]).catch(() => {
                // Ignora erros de processos secundários
            });
        }
    }
}
