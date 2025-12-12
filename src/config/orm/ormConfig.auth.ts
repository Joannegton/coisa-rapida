import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AuthDataSource = new DataSource({
    schema: 'auth',
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT as string),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: false,
    migrations: ['src/shared/infra/migrations/auth/*{.ts,.js}'],
    migrationsTableName: 'migrations',
});
