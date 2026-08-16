import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MachinesModule } from './modules/machines/machines.module';
import { TimePackagesModule } from './modules/time-packages/time-packages.module';
import { HourlyRatesModule } from './modules/hourly-rates/hourly-rates.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { PdvModule } from './modules/pdv/pdv.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PixTokensModule } from './modules/pix-tokens/pix-tokens.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    MachinesModule,
    TimePackagesModule,
    HourlyRatesModule,
    CustomersModule,
    ProductsModule,
    PdvModule,
    ReportsModule,
    SessionsModule,
    SubscriptionsModule,
    PaymentsModule,
    WebhooksModule,
    SettingsModule,
    PixTokensModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
