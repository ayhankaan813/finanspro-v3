"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const decimal_js_1 = require("decimal.js");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    // ==================== USERS ====================
    console.log('👤 Creating users...');
    const adminPassword = await (0, bcryptjs_1.hash)('admin123', 10);
    const userPassword = await (0, bcryptjs_1.hash)('user123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@finanspro.com' },
        update: {},
        create: {
            email: 'admin@finanspro.com',
            password_hash: adminPassword,
            name: 'Buğra Yılmaz',
            role: client_1.UserRole.ADMIN,
            is_active: true,
        },
    });
    const user = await prisma.user.upsert({
        where: { email: 'user@finanspro.com' },
        update: {},
        create: {
            email: 'user@finanspro.com',
            password_hash: userPassword,
            name: 'Test Kullanıcı',
            role: client_1.UserRole.USER,
            is_active: true,
        },
    });
    console.log(`  ✅ Created ${admin.name} (Admin)`);
    console.log(`  ✅ Created ${user.name} (User)`);
    // ==================== DELIVERY TYPES ====================
    console.log('📦 Creating delivery types...');
    const deliveryTypes = await Promise.all([
        prisma.deliveryType.upsert({
            where: { id: 'delivery-nakit' },
            update: {},
            create: { id: 'delivery-nakit', name: 'Nakit', description: 'Elden nakit teslimat', sort_order: 1 },
        }),
        prisma.deliveryType.upsert({
            where: { id: 'delivery-kripto' },
            update: {},
            create: { id: 'delivery-kripto', name: 'Kripto', description: 'Kripto para transferi', sort_order: 2 },
        }),
        prisma.deliveryType.upsert({
            where: { id: 'delivery-banka' },
            update: {},
            create: { id: 'delivery-banka', name: 'Banka Transferi', description: 'Banka havalesi/EFT', sort_order: 3 },
        }),
    ]);
    console.log(`  ✅ Created ${deliveryTypes.length} delivery types`);
    // ==================== CATEGORIES ====================
    console.log('📂 Creating categories...');
    const categories = await Promise.all([
        // Site Payment Categories
        prisma.category.upsert({
            where: { id: 'cat-site-maas' },
            update: {},
            create: { id: 'cat-site-maas', type: client_1.CategoryType.SITE_PAYMENT, name: 'Maaş', color: '#3b82f6', sort_order: 1 },
        }),
        prisma.category.upsert({
            where: { id: 'cat-site-marketing' },
            update: {},
            create: { id: 'cat-site-marketing', type: client_1.CategoryType.SITE_PAYMENT, name: 'Marketing', color: '#8b5cf6', sort_order: 2 },
        }),
        prisma.category.upsert({
            where: { id: 'cat-site-bonus' },
            update: {},
            create: { id: 'cat-site-bonus', type: client_1.CategoryType.SITE_PAYMENT, name: 'Bonus', color: '#10b981', sort_order: 3 },
        }),
        // Org Expense Categories
        prisma.category.upsert({
            where: { id: 'cat-org-kira' },
            update: {},
            create: { id: 'cat-org-kira', type: client_1.CategoryType.ORG_EXPENSE, name: 'Kira', color: '#ef4444', sort_order: 1 },
        }),
        prisma.category.upsert({
            where: { id: 'cat-org-fatura' },
            update: {},
            create: { id: 'cat-org-fatura', type: client_1.CategoryType.ORG_EXPENSE, name: 'Fatura', color: '#f59e0b', sort_order: 2 },
        }),
        prisma.category.upsert({
            where: { id: 'cat-org-diger' },
            update: {},
            create: { id: 'cat-org-diger', type: client_1.CategoryType.ORG_EXPENSE, name: 'Diğer', color: '#6b7280', sort_order: 3 },
        }),
    ]);
    console.log(`  ✅ Created ${categories.length} categories`);
    // ==================== SITES ====================
    console.log('🎰 Creating sites...');
    const sites = await Promise.all([
        prisma.site.upsert({
            where: { code: 'SITE-A' },
            update: {},
            create: {
                name: 'Casino Royal',
                code: 'SITE-A',
                description: 'Premium casino sitesi',
                is_active: true,
            },
        }),
        prisma.site.upsert({
            where: { code: 'SITE-B' },
            update: {},
            create: {
                name: 'Bet Master',
                code: 'SITE-B',
                description: 'Spor bahis sitesi',
                is_active: true,
            },
        }),
        prisma.site.upsert({
            where: { code: 'SITE-C' },
            update: {},
            create: {
                name: 'Lucky Stars',
                code: 'SITE-C',
                description: 'Slot oyunları sitesi',
                is_active: true,
            },
        }),
    ]);
    console.log(`  ✅ Created ${sites.length} sites`);
    // ==================== PARTNERS ====================
    console.log('🤝 Creating partners...');
    const partners = await Promise.all([
        prisma.partner.upsert({
            where: { code: 'PARTNER-1' },
            update: {},
            create: {
                name: 'Ahmet Komisyoncu',
                code: 'PARTNER-1',
                description: 'Kıdemli partner',
                is_active: true,
            },
        }),
        prisma.partner.upsert({
            where: { code: 'PARTNER-2' },
            update: {},
            create: {
                name: 'Mehmet Aracı',
                code: 'PARTNER-2',
                description: 'Yeni partner',
                is_active: true,
            },
        }),
    ]);
    console.log(`  ✅ Created ${partners.length} partners`);
    // ==================== FINANCIERS ====================
    console.log('💰 Creating financiers...');
    const financiers = await Promise.all([
        prisma.financier.upsert({
            where: { code: 'FIN-BANKA-1' },
            update: {},
            create: {
                name: 'Ana Banka Hesabı',
                code: 'FIN-BANKA-1',
                description: 'Birincil banka hesabı',
                is_active: true,
            },
        }),
        prisma.financier.upsert({
            where: { code: 'FIN-KRIPTO-1' },
            update: {},
            create: {
                name: 'Kripto Cüzdan',
                code: 'FIN-KRIPTO-1',
                description: 'USDT cüzdanı',
                is_active: true,
            },
        }),
        prisma.financier.upsert({
            where: { code: 'FIN-NAKIT-1' },
            update: {},
            create: {
                name: 'Nakit Kasa',
                code: 'FIN-NAKIT-1',
                description: 'Fiziki nakit',
                is_active: true,
            },
        }),
    ]);
    console.log(`  ✅ Created ${financiers.length} financiers`);
    // ==================== EXTERNAL PARTIES ====================
    console.log('👤 Creating external parties...');
    const externalParties = await Promise.all([
        prisma.externalParty.upsert({
            where: { id: 'ext-acun' },
            update: {},
            create: {
                id: 'ext-acun',
                name: 'Acun',
                description: 'Teslimat aracısı',
                phone: '+90 555 123 4567',
                is_active: true,
            },
        }),
        prisma.externalParty.upsert({
            where: { id: 'ext-supplier' },
            update: {},
            create: {
                id: 'ext-supplier',
                name: 'Tedarikçi Ali',
                description: 'Ekipman tedarikçisi',
                email: 'ali@supplier.com',
                is_active: true,
            },
        }),
    ]);
    console.log(`  ✅ Created ${externalParties.length} external parties`);
    // ==================== ACCOUNTS ====================
    console.log('💳 Creating accounts...');
    // Site accounts
    for (const site of sites) {
        await prisma.account.upsert({
            where: { site_id: site.id },
            update: {},
            create: {
                entity_type: client_1.EntityType.SITE,
                entity_id: site.id,
                site_id: site.id,
                balance: new decimal_js_1.Decimal(-500000), // Sites have negative balance (they owe money)
                blocked_amount: new decimal_js_1.Decimal(0),
                credit_limit: new decimal_js_1.Decimal(1000000),
            },
        });
    }
    // Partner accounts
    for (const partner of partners) {
        await prisma.account.upsert({
            where: { partner_id: partner.id },
            update: {},
            create: {
                entity_type: client_1.EntityType.PARTNER,
                entity_id: partner.id,
                partner_id: partner.id,
                balance: new decimal_js_1.Decimal(150000), // Partners have positive balance (we owe them)
                blocked_amount: new decimal_js_1.Decimal(0),
                credit_limit: new decimal_js_1.Decimal(0),
            },
        });
    }
    // Financier accounts
    for (const financier of financiers) {
        await prisma.account.upsert({
            where: { financier_id: financier.id },
            update: {},
            create: {
                entity_type: client_1.EntityType.FINANCIER,
                entity_id: financier.id,
                financier_id: financier.id,
                balance: new decimal_js_1.Decimal(800000),
                blocked_amount: new decimal_js_1.Decimal(0),
                credit_limit: new decimal_js_1.Decimal(0),
            },
        });
    }
    // External party accounts
    for (const external of externalParties) {
        await prisma.account.upsert({
            where: { external_party_id: external.id },
            update: {},
            create: {
                entity_type: client_1.EntityType.EXTERNAL_PARTY,
                entity_id: external.id,
                external_party_id: external.id,
                balance: new decimal_js_1.Decimal(0),
                blocked_amount: new decimal_js_1.Decimal(0),
                credit_limit: new decimal_js_1.Decimal(0),
            },
        });
    }
    console.log(`  ✅ Created accounts for all entities`);
    // ==================== SITE-PARTNER RELATIONSHIPS ====================
    console.log('🔗 Creating site-partner relationships...');
    await prisma.sitePartner.upsert({
        where: { site_id_partner_id: { site_id: sites[0].id, partner_id: partners[0].id } },
        update: {},
        create: {
            site_id: sites[0].id,
            partner_id: partners[0].id,
            is_active: true,
        },
    });
    await prisma.sitePartner.upsert({
        where: { site_id_partner_id: { site_id: sites[1].id, partner_id: partners[0].id } },
        update: {},
        create: {
            site_id: sites[1].id,
            partner_id: partners[0].id,
            is_active: true,
        },
    });
    await prisma.sitePartner.upsert({
        where: { site_id_partner_id: { site_id: sites[2].id, partner_id: partners[1].id } },
        update: {},
        create: {
            site_id: sites[2].id,
            partner_id: partners[1].id,
            is_active: true,
        },
    });
    console.log(`  ✅ Created site-partner relationships`);
    // ==================== COMMISSION RATES ====================
    console.log('📊 Creating commission rates...');
    // Site commission rates (10% for deposits, 8% for withdrawals)
    for (const site of sites) {
        await prisma.commissionRate.create({
            data: {
                entity_type: client_1.EntityType.SITE,
                entity_id: site.id,
                site_id: site.id,
                transaction_type: client_1.TransactionType.DEPOSIT,
                rate: new decimal_js_1.Decimal(0.10),
                is_active: true,
            },
        });
        await prisma.commissionRate.create({
            data: {
                entity_type: client_1.EntityType.SITE,
                entity_id: site.id,
                site_id: site.id,
                transaction_type: client_1.TransactionType.WITHDRAWAL,
                rate: new decimal_js_1.Decimal(0.08),
                is_active: true,
            },
        });
    }
    // Partner commission rates (6% for deposits from their sites)
    await prisma.commissionRate.create({
        data: {
            entity_type: client_1.EntityType.PARTNER,
            entity_id: partners[0].id,
            partner_id: partners[0].id,
            transaction_type: client_1.TransactionType.DEPOSIT,
            related_site_id: sites[0].id,
            rate: new decimal_js_1.Decimal(0.06),
            is_active: true,
        },
    });
    await prisma.commissionRate.create({
        data: {
            entity_type: client_1.EntityType.PARTNER,
            entity_id: partners[0].id,
            partner_id: partners[0].id,
            transaction_type: client_1.TransactionType.DEPOSIT,
            related_site_id: sites[1].id,
            rate: new decimal_js_1.Decimal(0.05),
            is_active: true,
        },
    });
    await prisma.commissionRate.create({
        data: {
            entity_type: client_1.EntityType.PARTNER,
            entity_id: partners[1].id,
            partner_id: partners[1].id,
            transaction_type: client_1.TransactionType.DEPOSIT,
            related_site_id: sites[2].id,
            rate: new decimal_js_1.Decimal(0.07),
            is_active: true,
        },
    });
    // Financier commission rates (2% for physical money handling)
    for (const financier of financiers) {
        await prisma.commissionRate.create({
            data: {
                entity_type: client_1.EntityType.FINANCIER,
                entity_id: financier.id,
                financier_id: financier.id,
                transaction_type: client_1.TransactionType.DEPOSIT,
                rate: new decimal_js_1.Decimal(0.02),
                is_active: true,
            },
        });
    }
    console.log(`  ✅ Created commission rates`);
    // ==================== FINANCIER BLOCKS ====================
    console.log('🔒 Creating sample financier blocks...');
    await prisma.financierBlock.create({
        data: {
            financier_id: financiers[0].id,
            amount: new decimal_js_1.Decimal(150000),
            reason: 'Banka hesabı inceleme altında',
            estimated_days: 3,
        },
    });
    // Update blocked amount on account
    await prisma.account.update({
        where: { entity_id: financiers[0].id },
        data: { blocked_amount: new decimal_js_1.Decimal(150000) },
    });
    console.log(`  ✅ Created sample blocks`);
    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📋 Test Credentials:');
    console.log('  Admin: admin@finanspro.com / admin123');
    console.log('  User:  user@finanspro.com / user123');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map