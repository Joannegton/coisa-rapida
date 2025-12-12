import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const OrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT as string),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: false,
    dropSchema: false,
    migrationsRun: false,
    logging: false,
    entities: [
        'dist/src/modules/**/infra/models/*.model{.ts,.js}',
        'dist/src/shared/infra/models/*.model{.ts,.js}',
    ],
    migrations: ['dist/src/shared/infra/migrations/**/*{.ts,.js}'],
    schema: 'public',
    migrationsTableName: 'migrations',
};

export const AppDataSource = new DataSource({
    ...OrmConfig,
    type: 'postgres',
} as any);
