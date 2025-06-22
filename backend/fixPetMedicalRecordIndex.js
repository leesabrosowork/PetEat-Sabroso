const mongoose = require('mongoose');
require('dotenv').config();

async function dropUniqueIndex() {
  try {
    // Get MongoDB URI from environment variables or use the default
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.collection('petmedicalrecords');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Find and drop the unique index on petId
    for (const index of indexes) {
      if (index.key && index.key.petId === 1) {
        console.log('Found petId index to drop:', index.name);
        await collection.dropIndex(index.name);
        console.log('Successfully dropped index');
      }
    }

    console.log('Index removal complete');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error dropping index:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

dropUniqueIndex(); 