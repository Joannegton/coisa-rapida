import { Module } from '@nestjs/common';
import { CoreController } from './core.controller';

@Module({
    imports: [],
    controllers: [CoreController],
    providers: [],
    exports: [],
})
export class CoreModule {}
