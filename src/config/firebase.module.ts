import { Module } from '@nestjs/common';
import { FirebaseConfigService } from './firebase.config';

@Module({
  providers: [FirebaseConfigService],
  exports: [FirebaseConfigService],
})
export class FirebaseModule {}
