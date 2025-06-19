const mongoose = require('mongoose');
require('dotenv').config();

async function fixVetClinicIndex() {
  try {
    // Connect to MongoDB using the same connection string as in config.js
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://adminprld:yISnv2hSOzqu2QEp@prld-d.x38amza.mongodb.net/?retryWrites=true&w=majority&appName=prld-d';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB:', mongoose.connection.host);
    console.log('Database name:', mongoose.connection.db.databaseName);

    // Get the VetClinic collection
    const db = mongoose.connection;
    const collections = await db.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Check if vetclinics collection exists
    const vetClinicCollection = collections.find(c => c.name === 'vetclinics');
    if (!vetClinicCollection) {
      console.log('vetclinics collection not found. Available collections are:', collections.map(c => c.name));
      return;
    }

    // List all indexes before changes
    console.log('Listing current indexes on vetclinics collection...');
    const indexesBefore = await db.collection('vetclinics').indexes();
    console.log('Current indexes:', JSON.stringify(indexesBefore, null, 2));

    // Try to drop the problematic index
    try {
      console.log('Attempting to drop phoneNumber_1 index from vetclinics collection...');
      await db.collection('vetclinics').dropIndex('phoneNumber_1');
      console.log('Successfully dropped phoneNumber_1 index');
    } catch (error) {
      console.log('Error dropping phoneNumber_1 index:', error.message);
    }

    try {
      console.log('Attempting to drop contactNumber_1 index from vetclinics collection...');
      await db.collection('vetclinics').dropIndex('contactNumber_1');
      console.log('Successfully dropped contactNumber_1 index');
    } catch (error) {
      console.log('Error dropping contactNumber_1 index:', error.message);
    }

    // Create a new sparse index
    console.log('Creating new sparse index on contactNumber field...');
    await db.collection('vetclinics').createIndex(
      { contactNumber: 1 },
      { unique: true, sparse: true }
    );
    console.log('Successfully created sparse index on contactNumber');

    // List all indexes after changes
    const indexesAfter = await db.collection('vetclinics').indexes();
    console.log('Updated indexes:', JSON.stringify(indexesAfter, null, 2));

    console.log('Index fix completed successfully');
  } catch (error) {
    console.error('Error fixing index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
fixVetClinicIndex(); 