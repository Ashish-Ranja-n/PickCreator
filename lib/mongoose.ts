import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI!;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGO_URI environment variable");
}

// Track connection status
let isConnected = false;

export async function connect() {
    // If already connected, return
    if (isConnected) {
        console.log('MongoDB is already connected');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}