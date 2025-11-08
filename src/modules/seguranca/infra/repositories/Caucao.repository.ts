import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaucaoModel } from '../models/Caucao.model';
import { Caucao, StatusCaucao } from '../../domain/Caucao';

@Injectable()
export class CaucaoRepository {
  constructor(
    @InjectRepository(CaucaoModel)
    private readonly repository: Repository<CaucaoModel>,
  ) {}

  async salvar(caucao: Caucao): Promise<Caucao> {
    const model = this.repository.create({
      id: caucao.id,
      aluguelId: caucao.aluguelId,
      paymentId: caucao.paymentId,
      valor: caucao.valor,
      status: caucao.status,
      checkoutUrl: caucao.checkoutUrl,
      mpResponse: caucao.mpResponse,
    });

    const saved = await this.repository.save(model);
    return this.toDomain(saved);
  }

  async buscarPorId(id: string): Promise<Caucao | null> {
    const model = await this.repository.findOne({ where: { id } });
    return model ? this.toDomain(model) : null;
  }

  async buscarPorPaymentId(paymentId: string): Promise<Caucao | null> {
    const model = await this.repository.findOne({ where: { paymentId } });
    return model ? this.toDomain(model) : null;
  }

  async buscarPorAluguelId(aluguelId: string): Promise<Caucao | null> {
    const model = await this.repository.findOne({ where: { aluguelId } });
    return model ? this.toDomain(model) : null;
  }

  async buscarPorStatus(status: StatusCaucao): Promise<Caucao[]> {
    const models = await this.repository.find({ where: { status } });
    return models.map(model => this.toDomain(model));
  }

  async atualizar(caucao: Caucao): Promise<Caucao> {
    await this.repository.update(caucao.id, {
      status: caucao.status,
      mpResponse: caucao.mpResponse,
    });

    return caucao;
  }

  private toDomain(model: CaucaoModel): Caucao {
    return new Caucao({
      id: model.id,
      aluguelId: model.aluguelId,
      paymentId: model.paymentId,
      valor: Number(model.valor),
      status: model.status,
      checkoutUrl: model.checkoutUrl,
      mpResponse: model.mpResponse,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
