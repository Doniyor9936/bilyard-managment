import { TypeOrmModule } from "@nestjs/typeorm";

export const databaseConfig:TypeOrmModule = {
    type:'postgres',
    host:process.env.DB_HOST || 'localhost',
    port:process.env.DB_PORT,
    username:process.env.DB_USERNAME || 'postgres',
    password:process.env.DB_PASSWORD || 'password',
    database:process.env.DB_NAME || 'myappdb',
    
    synchronize:false,
    autoLoadEntities:true,
}