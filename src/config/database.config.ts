import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => {
    const isProduction =
        configService.get<string>('APP_ENV') === 'production';

    return {
        type: 'postgres',

        // 🔥 Render INTERNAL Postgres URL
        url: configService.get<string>('DATABASE_URL'),

        autoLoadEntities: true,
        synchronize: !isProduction,

        logging: !isProduction,

        ssl: true,
        extra: {
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        },
    };
};
