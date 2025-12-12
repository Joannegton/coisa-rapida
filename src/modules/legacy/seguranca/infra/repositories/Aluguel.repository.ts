import { Injectable } from '@nestjs/common';
import { AluguelModel } from '../models/Aluguel.model';
import { Aluguel, StatusAluguel } from '../../domain/Aluguel';
import { CaucaoModel } from '../models/Caucao.model';
import { Caucao } from '../../domain/Caucao';
import { TransferenciaModel } from '../models/Transferencia.model';
import { Transferencia } from '../../domain/Transferencia';
import { ResultadoAssincrono, ResultadoUtil } from 'src/shared/utils/resultado';

@Injectable()
export class AluguelRepository {
    async salvar(aluguel: Aluguel): ResultadoAssincrono<Aluguel, Error> {
        try {
            // Construir o Model apenas com conversão de tipos
            // O TypeORM cuidará das relações via cascade
            const caucaoModel = aluguel.caucao
                ? this.caucaoDomainToModel(aluguel.caucao)
                : undefined;
            const transferenciasModels =
                aluguel.transferencias && aluguel.transferencias.length > 0
                    ? aluguel.transferencias.map((t) =>
                          this.transferenciaDomainToModel(t),
                      )
                    : [];

            const model = AluguelModel.criar({
                id: aluguel.id,
                item: aluguel.item,
                locatario: aluguel.locatario,
                locador: aluguel.locador,
                caucao: caucaoModel,
                valorAluguel: aluguel.valorAluguel,
                taxaAppPercentual: aluguel.taxaAppPercentual,
                status: aluguel.status,
                mpPaymentId: aluguel.mpPaymentId,
                indenizacao: aluguel.indenizacao,
                transferencias: transferenciasModels,
            });

            // Salvar apenas o agregado raiz
            // TypeORM cuidará de Caucao e Transferencias via cascade
            const saved = await model.save();

            return ResultadoUtil.sucesso(this.toDomain(saved));
        } catch (error) {
            return ResultadoUtil.falha(error as Error);
        }
    }

    async buscarPorId(id: string): ResultadoAssincrono<Aluguel, Error> {
        try {
            const model = await AluguelModel.findOne({
                where: { id },
                relations: ['caucao', 'transferencias'],
            });

            if (!model) {
                return ResultadoUtil.falha(new Error('Aluguel não encontrado'));
            }
            return ResultadoUtil.sucesso(this.toDomain(model));
        } catch (error) {
            return ResultadoUtil.falha(error as Error);
        }
    }

    async buscarPorPaymentId(
        mpPaymentId: string,
    ): ResultadoAssincrono<Aluguel, Error> {
        try {
            const model = await AluguelModel.findOne({
                where: { mpPaymentId },
                relations: ['caucao', 'transferencias'],
            });

            if (!model) {
                return ResultadoUtil.falha(new Error('Aluguel não encontrado'));
            }
            return ResultadoUtil.sucesso(this.toDomain(model));
        } catch (error) {
            return ResultadoUtil.falha(error as Error);
        }
    }

    async buscarPorStatus(
        status: StatusAluguel,
    ): ResultadoAssincrono<Aluguel[], Error> {
        try {
            const models = await AluguelModel.find({
                where: { status },
                relations: ['caucao', 'transferencias'],
            });

            const domains: Aluguel[] = [];
            for (const model of models) {
                const domainResult = this.toDomain(model);
                domains.push(domainResult);
            }

            return ResultadoUtil.sucesso(domains);
        } catch (error) {
            return ResultadoUtil.falha(error as Error);
        }
    }

    private toDomain(aluguelModel: AluguelModel): Aluguel {
        const caucaoDomain = aluguelModel.caucao
            ? Caucao.carregar(
                  {
                      paymentId: aluguelModel.caucao.paymentId,
                      valor: Number(aluguelModel.caucao.valor),
                      status: aluguelModel.caucao.status,
                      checkoutUrl: aluguelModel.caucao.checkoutUrl,
                      mpResponse: aluguelModel.caucao.mpResponse,
                      metodoPagamento: aluguelModel.caucao.metodoPagamento,
                  },
                  aluguelModel.caucao.id,
              )
            : undefined;

        const transferenciasDomin: Transferencia[] = [];
        if (
            aluguelModel.transferencias &&
            aluguelModel.transferencias.length > 0
        ) {
            for (const tModel of aluguelModel.transferencias) {
                const tDomain = Transferencia.carregar(
                    {
                        aluguelId: tModel.aluguelId,
                        tipo: tModel.tipo,
                        valor: Number(tModel.valor),
                        contaDestinoId: tModel.contaDestinoId,
                        nomeDestino: tModel.nomeDestino,
                        chavePix: tModel.chavePix,
                        status: tModel.status,
                        mpTransferenciaId: tModel.mpTransferenciaId,
                        mpRefundId: tModel.mpRefundId,
                        descricao: tModel.descricao,
                        instrucoesTransferencia: tModel.instrucoesTransferencia,
                        errorMessage: tModel.errorMessage,
                        criadoEm: tModel.criadoEm,
                        atualizadoEm: tModel.atualizadoEm,
                    },
                    tModel.id,
                );

                transferenciasDomin.push(tDomain);
            }
        }

        // Criar Aluguel
        const aluguelDomain = Aluguel.carregar(
            {
                item: aluguelModel.item,
                locatario: aluguelModel.locatario,
                locador: aluguelModel.locador,
                valorAluguel: Number(aluguelModel.valorAluguel),
                taxaAppPercentual: Number(aluguelModel.taxaAppPercentual),
                status: aluguelModel.status,
                mpPaymentId: aluguelModel.mpPaymentId,
                transferencias: transferenciasDomin,
                caucao: caucaoDomain,
            },
            aluguelModel.id,
        );

        return aluguelDomain;
    }

    private caucaoDomainToModel(caucao: Caucao): CaucaoModel {
        return CaucaoModel.criar({
            id: caucao.id,
            metodoPagamento: caucao.metodoPagamento,
            paymentId: caucao.paymentId,
            valor: caucao.valor,
            status: caucao.status,
            checkoutUrl: caucao.checkoutUrl,
            mpResponse: caucao.mpResponse,
        });
    }

    private transferenciaDomainToModel(
        transferencia: Transferencia,
    ): TransferenciaModel {
        return TransferenciaModel.criar({
            id: transferencia.id,
            tipo: transferencia.tipo,
            valor: transferencia.valor,
            contaDestinoId: transferencia.contaDestinoId,
            nomeDestino: transferencia.nomeDestino,
            chavePix: transferencia.chavePix,
            status: transferencia.status,
            mpTransferenciaId: transferencia.mpTransferenciaId,
            mpRefundId: transferencia.mpRefundId,
            descricao: transferencia.descricao,
            instrucoesTransferencia: transferencia.instrucoesTransferencia,
            errorMessage: transferencia.errorMessage,
        });
    }
}
