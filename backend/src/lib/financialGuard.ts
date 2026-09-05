import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma';
import { isPilotMode } from './config';

export class FinancialGuardError extends Error {
  statusCode = 503;
  code = 'FINANCIAL_DB_UNAVAILABLE';

  constructor(operation: string) {
    super(`Financial operation blocked: database health check failed before ${operation}`);
    this.name = 'FinancialGuardError';
  }
}

/**
 * Pilot money movement is fail-closed: before creating an order, udhaar entry,
 * payment link, webhook receipt, or payout request, verify that Prisma can make
 * a round trip to the database. If the DB is degraded we return 503 and do not
 * call external payment/payout providers or mutate ledger balances.
 */
export async function assertFinancialWriteReady(operation: string, db: PrismaClient = defaultPrisma): Promise<void> {
  if (!isPilotMode()) return;

  try {
    await db.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error(`Financial DB guard failed for ${operation}:`, err);
    throw new FinancialGuardError(operation);
  }
}

export function isFinancialGuardError(err: unknown): err is FinancialGuardError {
  return err instanceof FinancialGuardError || (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'FINANCIAL_DB_UNAVAILABLE'
  );
}
