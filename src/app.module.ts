import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SegurancaModule } from './modules/seguranca/seguranca.module';
import { FirebaseModule } from './config/firebase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmConfig } from './ormConfig';
import { TesteModule } from './modules/teste/teste.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...OrmConfig }),
    SegurancaModule,
    FirebaseModule,
    TesteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
