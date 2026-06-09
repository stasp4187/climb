import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TrailsModule } from './trails/trails.module';

@Module({ imports: [AuthModule, TrailsModule] })
export class AppModule {}
