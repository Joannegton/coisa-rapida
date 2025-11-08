import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AluguelModel } from '../models/Aluguel.model';
import { Aluguel, StatusAluguel } from '../../domain/Aluguel';

@Injectable()
export class AluguelRepository {
  constructor(
    @InjectRepository(AluguelModel)
    private readonly repository: Repository<AluguelModel>,
  ) {}

  async salvar(aluguel: Aluguel): Promise<Aluguel> {
    const model = this.repository.create({
      id: aluguel.id,
      item: aluguel.item,
      locatario: aluguel.locatario,
      locador: aluguel.locador,
      valorCaucao: aluguel.valorCaucao,
      valorAluguel: aluguel.valorAluguel,
      taxaAppPercentual: aluguel.taxaAppPercentual,
      status: aluguel.status,
      mpPaymentId: aluguel.mpPaymentId,
      indenizacao: aluguel.indenizacao,
      finalizadoAt: aluguel.finalizadoAt,
    });

    const saved = await this.repository.save(model);
    return this.toDomain(saved);
  }

  async buscarPorId(id: string): Promise<Aluguel | null> {
    const model = await this.repository.findOne({ where: { id } });
    return model ? this.toDomain(model) : null;
  }

  async buscarPorPaymentId(mpPaymentId: string): Promise<Aluguel | null> {
    const model = await this.repository.findOne({ where: { mpPaymentId } });
    return model ? this.toDomain(model) : null;
  }

  async buscarPorStatus(status: StatusAluguel): Promise<Aluguel[]> {
    const models = await this.repository.find({ where: { status } });
    return models.map(model => this.toDomain(model));
  }

  async atualizar(aluguel: Aluguel): Promise<Aluguel> {
    await this.repository.update(aluguel.id, {
      status: aluguel.status,
      mpPaymentId: aluguel.mpPaymentId,
      indenizacao: aluguel.indenizacao,
      finalizadoAt: aluguel.finalizadoAt,
    });

    return aluguel;
  }

  private toDomain(model: AluguelModel): Aluguel {
    return new Aluguel({
      id: model.id,
      item: model.item,
      locatario: model.locatario,
      locador: model.locador,
      valorCaucao: Number(model.valorCaucao),
      valorAluguel: Number(model.valorAluguel),
      taxaAppPercentual: Number(model.taxaAppPercentual),
      status: model.status,
      mpPaymentId: model.mpPaymentId,
      indenizacao: model.indenizacao ? Number(model.indenizacao) : undefined,
      createdAt: model.createdAt,
      finalizadoAt: model.finalizadoAt,
    });
  }
}
