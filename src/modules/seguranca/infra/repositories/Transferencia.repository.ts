import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferenciaModel } from '../models/Transferencia.model';
import { Transferencia, StatusTransferencia, TipoTransferencia } from '../../domain/Transferencia';

@Injectable()
export class TransferenciaRepository {
  constructor(
    @InjectRepository(TransferenciaModel)
    private readonly repository: Repository<TransferenciaModel>,
  ) {}

  async salvar(transferencia: Transferencia): Promise<Transferencia> {
    const model = this.repository.create({
      id: transferencia.id,
      aluguelId: transferencia.aluguelId,
      tipo: transferencia.tipo,
      valor: transferencia.valor,
      contaDestinoId: transferencia.contaDestinoId,
      nomeDestino: transferencia.nomeDestino,
      status: transferencia.status,
      mpTransferenciaId: transferencia.mpTransferenciaId,
      mpRefundId: transferencia.mpRefundId,
      descricao: transferencia.descricao,
      errorMessage: transferencia.errorMessage,
      completedAt: transferencia.completedAt,
    });

    const saved = await this.repository.save(model);
    return this.toDomain(saved);
  }

  async buscarPorId(id: string): Promise<Transferencia | null> {
    const model = await this.repository.findOne({ where: { id } });
    return model ? this.toDomain(model) : null;
  }

  async buscarPorAluguelId(aluguelId: string): Promise<Transferencia[]> {
    const models = await this.repository.find({ where: { aluguelId } });
    return models.map(model => this.toDomain(model));
  }

  async buscarPorStatus(status: StatusTransferencia): Promise<Transferencia[]> {
    const models = await this.repository.find({ where: { status } });
    return models.map(model => this.toDomain(model));
  }

  async buscarPorTipo(tipo: TipoTransferencia): Promise<Transferencia[]> {
    const models = await this.repository.find({ where: { tipo } });
    return models.map(model => this.toDomain(model));
  }

  async atualizar(transferencia: Transferencia): Promise<Transferencia> {
    await this.repository.update(transferencia.id, {
      status: transferencia.status,
      mpTransferenciaId: transferencia.mpTransferenciaId,
      mpRefundId: transferencia.mpRefundId,
      errorMessage: transferencia.errorMessage,
      completedAt: transferencia.completedAt,
    });

    return transferencia;
  }

  async buscarFalhasParaRetentar(): Promise<Transferencia[]> {
    const models = await this.repository.find({
      where: { status: StatusTransferencia.FALHOU },
      order: { createdAt: 'ASC' },
    });
    return models.map(model => this.toDomain(model));
  }

  private toDomain(model: TransferenciaModel): Transferencia {
    return new Transferencia({
      id: model.id,
      aluguelId: model.aluguelId,
      tipo: model.tipo,
      valor: Number(model.valor),
      contaDestinoId: model.contaDestinoId,
      nomeDestino: model.nomeDestino,
      status: model.status,
      mpTransferenciaId: model.mpTransferenciaId ? Number(model.mpTransferenciaId) : undefined,
      mpRefundId: model.mpRefundId ? Number(model.mpRefundId) : undefined,
      descricao: model.descricao,
      errorMessage: model.errorMessage,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      completedAt: model.completedAt,
    });
  }
}
