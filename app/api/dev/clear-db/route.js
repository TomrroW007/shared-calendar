import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        console.log('[Dev-DB-Clear] Connecting to MongoDB...');
        await dbConnect();
        
        console.log('[Dev-DB-Clear] Retrieving active collections...');
        const collections = await mongoose.connection.db.collections();
        const dropped = [];
        
        for (let collection of collections) {
            const name = collection.collectionName;
            console.log(`[Dev-DB-Clear] Dropping collection: ${name}`);
            try {
                await collection.drop();
                dropped.push(name);
            } catch (e) {
                console.warn(`[Dev-DB-Clear] Skip dropping collection: ${name}. Reason: ${e.message}`);
            }
        }
        
        console.log('[Dev-DB-Clear] Database successfully cleared!');
        return NextResponse.json({
            success: true,
            message: 'Database cleared successfully on the host server!',
            dropped_collections: dropped
        });
    } catch (error) {
        console.error('[Dev-DB-Clear] Error clearing database:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
