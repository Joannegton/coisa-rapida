import { Module } from '@nestjs/common';
import { TesteController } from './teste.controller';
import { TesteService } from './teste.service';

@Module({
  imports: [],
  controllers: [TesteController],
  providers: [TesteService],
})
export class TesteModule {}
