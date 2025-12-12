import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const SharedDataSource = new DataSource({
    schema: 'public',
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT as string),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: false,
    migrations: ['src/shared/infra/migrations/auditoria/*{.ts,.js}'],
    migrationsTableName: 'migrations',
});
