import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
  private readonly saltRounds = 10;

  async hashSenha(senha: string): Promise<string> {
    return bcrypt.hash(senha, this.saltRounds);
  }

  async compararSenha(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }
}
