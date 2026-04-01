const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        const suffix = '22968F';
        
        for (const col of collections) {
            const docs = await mongoose.connection.db.collection(col.name).find({}).toArray();
            const found = docs.filter(d => d._id.toString().toUpperCase().endsWith(suffix));
            if (found.length > 0) {
                console.log(`FOUND in collection ${col.name}:`, JSON.stringify(found, null, 2));
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
