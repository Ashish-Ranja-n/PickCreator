import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI!;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGO_URI environment variable");
}


export async function connect() {
    // If already connected or connecting, return
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
        console.log('MongoDB is already connected');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}