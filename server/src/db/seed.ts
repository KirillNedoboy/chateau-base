import 'dotenv/config';
import { db } from './index.js';
import { shopItems } from './schema.js';

const SEED_DATA = [
    // Saplings
    {
        name: 'Cabernet Sauvignon',
        type: 'sapling' as const,
        price: 50,
        description: 'Full-bodied red grape. Rich tannins and dark fruit flavors.',
        metadata: JSON.stringify({ growthTimeMs: 120_000, grapeYield: 3 }),
    },
    {
        name: 'Chardonnay',
        type: 'sapling' as const,
        price: 40,
        description: 'Versatile white grape. Crisp citrus with buttery notes.',
        metadata: JSON.stringify({ growthTimeMs: 90_000, grapeYield: 4 }),
    },
    {
        name: 'Pinot Noir',
        type: 'sapling' as const,
        price: 60,
        description: 'Delicate red grape. Elegant cherry and earthy undertones.',
        metadata: JSON.stringify({ growthTimeMs: 150_000, grapeYield: 2 }),
    },
    // Equipment
    {
        name: 'Fermentation Vat',
        type: 'equipment' as const,
        price: 100,
        description: 'Stainless steel vat for basic wine fermentation.',
        metadata: JSON.stringify({ fermentTimeMs: 60_000 }),
    },
    // Barrels
    {
        name: 'French Oak Barrel',
        type: 'barrel' as const,
        price: 150,
        description: 'Premium French oak. Adds vanilla, spice, and silky texture.',
        metadata: JSON.stringify({ agingTimeMs: 180_000, qualityMultiplier: 2.0 }),
    },
    {
        name: 'American Oak Barrel',
        type: 'barrel' as const,
        price: 120,
        description: 'Bold American oak. Imparts coconut, dill, and sweet notes.',
        metadata: JSON.stringify({ agingTimeMs: 150_000, qualityMultiplier: 1.5 }),
    },
];

async function seed() {
    console.log('🌱 Seeding shop items...');

    for (const item of SEED_DATA) {
        await db.insert(shopItems).values(item).onConflictDoNothing();
    }

    console.log(`✅ Seeded ${SEED_DATA.length} shop items.`);
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
