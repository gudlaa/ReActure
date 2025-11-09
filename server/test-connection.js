/**
 * MongoDB Atlas Connection Test
 * Run this to verify your connection string works
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB Atlas connection...');
console.log('📍 URI:', MONGODB_URI ? MONGODB_URI.replace(/:[^:@]+@/, ':****@') : 'NOT FOUND');

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file!');
    console.log('\n📝 Create a .env file with:');
    console.log('MONGODB_URI=mongodb+srv://reacture_user:YOUR_PASSWORD@cluster0.niiumri.mongodb.net/reacture?retryWrites=true&w=majority&appName=Cluster0');
    process.exit(1);
}

async function testConnection() {
    try {
        console.log('\n🔄 Connecting to MongoDB Atlas...');
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log('📊 Database:', mongoose.connection.db.databaseName);
        console.log('🌍 Host:', mongoose.connection.host);
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Collections:', collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None yet (this is normal for new database)');
        
        console.log('\n✅ Connection test PASSED!');
        console.log('👉 You can now run: npm start');
        
    } catch (error) {
        console.error('\n❌ Connection test FAILED!');
        console.error('Error:', error.message);
        
        console.log('\n🔧 Troubleshooting:');
        
        if (error.message.includes('bad auth')) {
            console.log('1. Check your password is correct');
            console.log('2. If password has special characters (@#%&), URL-encode them');
            console.log('3. Or change password to letters/numbers only in MongoDB Atlas');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
            console.log('1. Check your internet connection');
            console.log('2. Go to MongoDB Atlas → Network Access');
            console.log('3. Click "Add IP Address" → "Allow Access from Anywhere"');
        } else if (error.message.includes('serverSelectionTimeoutMS')) {
            console.log('1. Check Network Access in MongoDB Atlas');
            console.log('2. Ensure your IP is whitelisted');
            console.log('3. Check if cluster is running (not paused)');
        } else {
            console.log('1. Verify your connection string is correct');
            console.log('2. Check MongoDB Atlas dashboard - is cluster running?');
            console.log('3. Try creating a new database user');
        }
        
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
    }
}

testConnection();

