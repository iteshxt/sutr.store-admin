#!/usr/bin/env node

/**
 * Admin User Setup Script
 * 
 * This script helps you create an admin user for the Sutr Admin Dashboard.
 * Run this after setting up your Firebase project and environment variables.
 * 
 * Usage:
 *   node scripts/create-admin.js <email> <password>
 * 
 * Example:
 *   node scripts/create-admin.js admin@sutr.store mySecurePassword123
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');
const { createUserWithEmailAndPassword } = require('firebase/auth');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

// Check if environment variables are set
function checkEnvironment() {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n📝 Please copy .env.example to .env.local and fill in your Firebase credentials.');
    process.exit(1);
  }
}

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
}

// Initialize Firebase Client
function initializeFirebaseClient() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  
  const app = initializeApp(firebaseConfig);
  return getAuth(app);
}

async function createAdminUser(email, password) {
  try {
    console.log('🔥 Creating admin user...');
    
    // Initialize Firebase
    checkEnvironment();
    initializeFirebaseAdmin();
    const auth = initializeFirebaseClient();
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ User created: ${user.email} (UID: ${user.uid})`);
    
    // Set admin claim using Firebase Admin SDK
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log('✅ Admin privileges granted');
    console.log('\n🎉 Admin user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${user.uid}`);
    console.log('\n🔐 You can now login to the admin dashboard with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 User already exists. Setting admin privileges...');
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log('✅ Admin privileges granted to existing user');
      } catch (adminError) {
        console.error('❌ Error setting admin privileges:', adminError.message);
      }
    } else if (error.code === 'auth/weak-password') {
      console.log('\n💡 Password should be at least 6 characters long.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n💡 Please provide a valid email address.');
    }
    
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('📋 Sutr Admin User Setup');
    console.log('\nUsage: node scripts/create-admin.js <email> <password>');
    console.log('\nExample:');
    console.log('  node scripts/create-admin.js admin@sutr.store mySecurePassword123');
    console.log('\n📝 Make sure you have set up your .env.local file with Firebase credentials first.');
    process.exit(1);
  }
  
  const [email, password] = args;
  await createAdminUser(email, password);
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main();