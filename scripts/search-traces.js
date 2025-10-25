#!/usr/bin/env node

// Quick script to check for any traces of your real products
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function searchForTraces() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔍 Searching for traces of your real products...\n');
        
        // Check all collections for any product references
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`📁 Checking collection: ${collectionName}`);
            
            try {
                const coll = db.collection(collectionName);
                const sampleDocs = await coll.find({}).limit(3).toArray();
                
                if (sampleDocs.length > 0) {
                    console.log(`   Found ${await coll.countDocuments()} documents`);
                    
                    // Check if any documents reference products
                    for (const doc of sampleDocs) {
                        const docStr = JSON.stringify(doc, null, 2);
                        if (docStr.includes('product') || docStr.includes('Product')) {
                            console.log(`   🔍 Possible product reference found:`);
                            console.log(`   ${docStr.substring(0, 200)}...`);
                        }
                    }
                } else {
                    console.log(`   Empty collection`);
                }
            } catch (err) {
                console.log(`   Error reading collection: ${err.message}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

searchForTraces();