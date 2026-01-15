import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Notificacao,
    TipoNotificacao,
    PrioridadeNotificacao,
} from '../models/Notificacao.model';

export { TipoNotificacao, PrioridadeNotificacao };

export interface CriarNotificacaoDto {
    destinatarioId: string;
    tipo: TipoNotificacao;
    prioridade?: PrioridadeNotificacao;
    titulo: string;
    mensagem: string;
    acaoUrl?: string;
    acaoTipo?: string;
    acaoId?: string;
    aluguelId?: string;
    itemId?: string;
    remetenteId?: string;
    dados?: any;
    expiraEm?: Date;
}

@Injectable()
export class NotificacaoRepository {
    // async criar(
    //   dados: CriarNotificacaoDto,
    // ): ResultadoAssincrono<Notificacao, ServicoExcecao> {
    //   try {
    //     const notificacao = Notificacao.create({
    //       destinatarioId: dados.destinatarioId,
    //       tipo: dados.tipo,
    //       prioridade: dados.prioridade || PrioridadeNotificacao.NORMAL,
    //       titulo: dados.titulo,
    //       mensagem: dados.mensagem,
    //       acaoUrl: dados.acaoUrl,
    //       acaoTipo: dados.acaoTipo,
    //       acaoId: dados.acaoId,
    //       aluguelId: dados.aluguelId,
    //       itemId: dados.itemId,
    //       remetenteId: dados.remetenteId,
    //       dados: dados.dados,
    //       expiraEm: dados.expiraEm,
    //       lida: false,
    //       enviadaPush: false,
    //       enviadaEmail: false,
    //       agendada: false,
    //     });
    //     const resultado = await this.repository.save(notificacao);
    //     return ResultadoUtil.sucesso(resultado);
    //   } catch (error) {
    //     return ResultadoUtil.falha(
    //       new ServicoExcecao(error?.message || 'Erro ao criar notificação'),
    //     );
    //   }
    // }
    // async criarMultiplas(
    //   notificacoes: CriarNotificacaoDto[],
    // ): ResultadoAssincrono<Notificacao[], ServicoExcecao> {
    //   try {
    //     const entidades = notificacoes.map(dados => this.repository.create({
    //       destinatarioId: dados.destinatarioId,
    //       tipo: dados.tipo,
    //       prioridade: dados.prioridade || PrioridadeNotificacao.NORMAL,
    //       titulo: dados.titulo,
    //       mensagem: dados.mensagem,
    //       acaoUrl: dados.acaoUrl,
    //       acaoTipo: dados.acaoTipo,
    //       acaoId: dados.acaoId,
    //       aluguelId: dados.aluguelId,
    //       itemId: dados.itemId,
    //       remetenteId: dados.remetenteId,
    //       dados: dados.dados,
    //       expiraEm: dados.expiraEm,
    //       lida: false,
    //       enviadaPush: false,
    //       enviadaEmail: false,
    //       agendada: false,
    //     }));
    //     const resultado = await this.repository.save(entidades);
    //     return ResultadoUtil.sucesso(resultado);
    //   } catch (error) {
    //     return ResultadoUtil.falha(
    //       new ServicoExcecao(error?.message || 'Erro ao criar notificações'),
    //     );
    //   }
    // }
    // async marcarComoLida(id: string): ResultadoAssincrono<Notificacao, ServicoExcecao> {
    //   try {
    //     await this.repository.update(id, {
    //       lida: true,
    //       dataLeitura: new Date(),
    //     });
    //     const notificacao = await this.repository.findOne({ where: { id } });
    //     return ResultadoUtil.sucesso(notificacao!);
    //   } catch (error) {
    //     return ResultadoUtil.falha(
    //       new ServicoExcecao(error?.message || 'Erro ao marcar notificação como lida'),
    //     );
    //   }
    // }
    // async buscarPorUsuario(
    //   usuarioId: string,
    //   limite: number = 50,
    // ): ResultadoAssincrono<Notificacao[], ServicoExcecao> {
    //   try {
    //     const notificacoes = await this.repository.find({
    //       where: { destinatarioId: usuarioId },
    //       order: { createdAt: 'DESC' },
    //       take: limite,
    //     });
    //     return ResultadoUtil.sucesso(notificacoes);
    //   } catch (error) {
    //     return ResultadoUtil.falha(
    //       new ServicoExcecao(error?.message || 'Erro ao buscar notificações'),
    //     );
    //   }
    // }
    // async contarNaoLidasPorUsuario(
    //   usuarioId: string,
    // ): ResultadoAssincrono<number, ServicoExcecao> {
    //   try {
    //     const count = await this.repository.count({
    //       where: {
    //         destinatarioId: usuarioId,
    //         lida: false,
    //       },
    //     });
    //     return ResultadoUtil.sucesso(count);
    //   } catch (error) {
    //     return ResultadoUtil.falha(
    //       new ServicoExcecao(error?.message || 'Erro ao contar notificações não lidas'),
    //     );
    //   }
    // }
}
