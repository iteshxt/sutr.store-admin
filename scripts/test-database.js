#!/usr/bin/env node

/**
 * Database Test Script
 * 
 * This script tests the MongoDB connection and creates sample products
 * to verify the product management system is working correctly.
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

// Simple product schema for testing
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

// Sample products
const sampleProducts = [
    {
        name: 'Classic Black T-Shirt',
        slug: 'classic-black-tshirt',
        description: 'Premium quality cotton t-shirt in classic black. Perfect for everyday wear with a comfortable fit.',
        price: 29.99,
        category: 'T-Shirts',
        images: ['https://via.placeholder.com/400x400/000000/FFFFFF?text=Black+T-Shirt'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black'],
        inStock: true,
        featured: true,
        stock: 100,
    },
    {
        name: 'White Premium Hoodie',
        slug: 'white-premium-hoodie',
        description: 'Luxurious white hoodie made from premium cotton blend. Features adjustable hood and kangaroo pocket.',
        price: 79.99,
        salePrice: 59.99,
        category: 'Hoodies',
        images: ['https://via.placeholder.com/400x400/FFFFFF/000000?text=White+Hoodie'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Cream'],
        inStock: true,
        featured: true,
        stock: 50,
    },
    {
        name: 'Denim Jacket',
        slug: 'denim-jacket',
        description: 'Classic denim jacket with vintage wash. Perfect layering piece for any season.',
        price: 89.99,
        category: 'Jackets',
        images: ['https://via.placeholder.com/400x400/4169E1/FFFFFF?text=Denim+Jacket'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Blue', 'Light Blue'],
        inStock: true,
        featured: false,
        stock: 25,
    },
    {
        name: 'Slim Fit Jeans',
        slug: 'slim-fit-jeans',
        description: 'Modern slim fit jeans with stretch for comfort. Available in multiple washes.',
        price: 69.99,
        category: 'Jeans',
        images: ['https://via.placeholder.com/400x400/000080/FFFFFF?text=Slim+Jeans'],
        sizes: ['28', '30', '32', '34', '36', '38'],
        colors: ['Dark Blue', 'Light Blue', 'Black'],
        inStock: true,
        featured: false,
        stock: 75,
    },
    {
        name: 'Baseball Cap',
        slug: 'baseball-cap',
        description: 'Adjustable baseball cap with embroidered logo. One size fits most.',
        price: 24.99,
        category: 'Accessories',
        images: ['https://via.placeholder.com/400x400/FF0000/FFFFFF?text=Baseball+Cap'],
        sizes: ['One Size'],
        colors: ['Black', 'White', 'Navy', 'Red'],
        inStock: true,
        featured: false,
        stock: 200,
    },
];

async function testDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // COMMENTED OUT - DO NOT CLEAR EXISTING PRODUCTS
        // Clear existing products (optional - comment out if you want to keep existing data)
        // console.log('🔄 Clearing existing products...');
        // await Product.deleteMany({});
        // console.log('✅ Existing products cleared');

        // Check for existing products first
        const existingCount = await Product.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  Found ${existingCount} existing products in database`);
            console.log('❌ Skipping sample data insertion to preserve existing products');
            console.log('💡 If you want to add sample data, manually delete products first');
            
            // Just show existing products
            console.log('\n📋 Existing Products:');
            const existingProducts = await Product.find({}, 'name category price inStock featured').sort({ name: 1 });
            existingProducts.forEach(product => {
                const status = product.inStock ? '✅' : '❌';
                const featured = product.featured ? '⭐' : '  ';
                console.log(`   ${status} ${featured} ${product.name} (${product.category}) - $${product.price}`);
            });
            
            return;
        }

        // Insert sample products
        console.log('🔄 Inserting sample products...');
        const insertedProducts = await Product.insertMany(sampleProducts);
        console.log(`✅ ${insertedProducts.length} sample products created successfully`);

        // Test queries
        console.log('🔄 Testing product queries...');
        
        const totalProducts = await Product.countDocuments();
        const featuredProducts = await Product.countDocuments({ featured: true });
        const inStockProducts = await Product.countDocuments({ inStock: true });
        
        console.log(`📊 Database Statistics:`);
        console.log(`   Total Products: ${totalProducts}`);
        console.log(`   Featured Products: ${featuredProducts}`);
        console.log(`   In Stock Products: ${inStockProducts}`);

        // List all products
        console.log('\n📋 Product List:');
        const allProducts = await Product.find({}, 'name category price inStock featured').sort({ name: 1 });
        allProducts.forEach(product => {
            const status = product.inStock ? '✅' : '❌';
            const featured = product.featured ? '⭐' : '  ';
            console.log(`   ${status} ${featured} ${product.name} (${product.category}) - $${product.price}`);
        });

        console.log('\n🎉 Database test completed successfully!');
        console.log('💡 You can now test the admin panel at http://localhost:3000/products');

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.log('💡 Check your MongoDB connection string in .env.local');
        } else if (error.name === 'MongoParseError') {
            console.log('💡 Check that your MongoDB URI format is correct');
        } else if (error.code === 11000) {
            console.log('💡 Duplicate key error - products might already exist');
        }
        
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});

console.log('🧪 Sutr Admin - Database Test');
console.log('===============================\n');

testDatabase();