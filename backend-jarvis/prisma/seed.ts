import 'dotenv/config'; // Carga las variables de entorno desde `.env` antes de usar Prisma
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
// Creamos una instancia del cliente de Prisma para interactuar con la DB
const prisma = new PrismaClient({ adapter });

/**
 * main: función principal que ejecuta los seeds.
 * - Usa `upsert` para ser idempotente: crea el registro si no existe, o lo deja igual si ya existe.
 */
async function main() {
  // Upsert del plan gratis por defecto. `upsert` evita duplicados si ejecutas el seed varias veces.
  await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      description: 'Plan gratuito por defecto',
      priceMonthly: new Prisma.Decimal(0),
    },
  });
  // Ejemplo adicional: plan PRO
  await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      description: 'Plan profesional',
      priceMonthly: new Prisma.Decimal(9.99),
    },
  });

  console.log('Seed: planes por defecto creados/asegurados');
}

/**
 * Ejecuta `main` y maneja errores, desconectando el cliente Prisma al finalizar.
 */
main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
