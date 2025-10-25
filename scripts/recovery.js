#!/usr/bin/env node

/**
 * Data Recovery Script
 * 
 * This script attempts to recover deleted products and provides
 * a way to manually restore your real products.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
}

// Product schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    category: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    stock: { type: Number, default: 0, min: 0 },
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

async function attemptRecovery() {
    try {
        console.log('🔍 Attempting to recover your deleted products...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check what's currently in the database
        const currentProducts = await Product.find({}).sort({ createdAt: -1 });
        
        console.log('\n📋 Current products in database:');
        if (currentProducts.length === 0) {
            console.log('   No products found');
        } else {
            currentProducts.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name} (${product.category}) - Created: ${product.createdAt}`);
            });
        }

        // Check if we can access the oplog (requires replica set)
        try {
            const oplogCollection = mongoose.connection.db.collection('oplog.rs');
            const recentOps = await oplogCollection.find({
                ns: `${mongoose.connection.db.databaseName}.products`,
                op: 'd' // delete operations
            }).sort({ ts: -1 }).limit(10).toArray();
            
            if (recentOps.length > 0) {
                console.log('\n🗂️  Found recent delete operations in oplog:');
                recentOps.forEach((op, index) => {
                    console.log(`   ${index + 1}. Deleted at: ${new Date(op.ts.getHighBits() * 1000)}`);
                    if (op.o && op.o._id) {
                        console.log(`      Product ID: ${op.o._id}`);
                    }
                });
            }
        } catch (oplogError) {
            console.log('\n❌ Cannot access oplog (replica set required for recovery)');
        }

        console.log('\n💡 Recovery Options:');
        console.log('   1. If you have a backup, restore from backup');
        console.log('   2. If you remember your products, I can help recreate them');
        console.log('   3. Check if you have the products in your main sutr.store database');
        
        // Check if there's a main products collection we can copy from
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📁 Available collections in database:');
        collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
        });

    } catch (error) {
        console.error('❌ Recovery attempt failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

async function addManualProducts() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function question(query) {
        return new Promise(resolve => rl.question(query, resolve));
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n📝 Let\'s manually add your real products back...');
        
        const products = [];
        let addMore = true;

        while (addMore) {
            console.log('\n--- Adding New Product ---');
            
            const name = await question('Product Name: ');
            if (!name.trim()) break;
            
            const description = await question('Description: ');
            const price = parseFloat(await question('Price: $'));
            const category = await question('Category: ');
            const stock = parseInt(await question('Stock quantity: ')) || 0;
            
            const salePrice = await question('Sale Price (optional, press Enter to skip): $');
            const sizes = await question('Sizes (comma-separated, e.g., S,M,L): ');
            const colors = await question('Colors (comma-separated, e.g., Black,White): ');
            const featured = (await question('Featured product? (y/n): ')).toLowerCase().startsWith('y');

            const product = {
                name: name.trim(),
                slug: name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim(),
                description: description.trim(),
                price: price,
                salePrice: salePrice ? parseFloat(salePrice) : undefined,
                category: category.trim(),
                stock: stock,
                sizes: sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
                colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [],
                featured: featured,
                inStock: stock > 0,
                images: [] // You can add images later through the admin panel
            };

            products.push(product);
            console.log(`✅ Added: ${product.name}`);

            const more = await question('\nAdd another product? (y/n): ');
            addMore = more.toLowerCase().startsWith('y');
        }

        if (products.length > 0) {
            console.log(`\n🔄 Saving ${products.length} products to database...`);
            const saved = await Product.insertMany(products);
            console.log(`✅ Successfully saved ${saved.length} products!`);
            
            console.log('\n📋 Restored Products:');
            saved.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name} - $${product.price}`);
            });
        }

    } catch (error) {
        console.error('❌ Error adding products:', error.message);
    } finally {
        rl.close();
        await mongoose.disconnect();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    console.log('🚨 Sutr Admin - Data Recovery');
    console.log('==============================\n');
    
    if (args.includes('--manual') || args.includes('-m')) {
        await addManualProducts();
    } else {
        await attemptRecovery();
        console.log('\n🔧 To manually add products back, run:');
        console.log('   node scripts/recovery.js --manual');
    }
}

main();