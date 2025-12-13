import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config();

const PREFIX_API = 'api/v1';

function setupSwagger(app: INestApplication<any>) {
    const tags = [
        { name: 'auth', description: 'Endpoints de autenticação' },
        // { name: 'usuario', description: 'Gerenciamento de usuários' },
    ];

    let configBuilder = new DocumentBuilder()
        .setTitle('Coisa Rápida API')
        .setDescription('Documentação dos endpoints da API Coisa Rápida')
        .setVersion('1.0');

    tags.forEach((tag) => {
        configBuilder = configBuilder.addTag(tag.name, tag.description);
    });

    const config = configBuilder
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'access-token',
        )
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'refresh-token',
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`/${PREFIX_API}/docs`, app, document);
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(helmet());

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:8080',
    ];

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('CORS não permitido'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    app.setGlobalPrefix(PREFIX_API);

    setupSwagger(app);

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
