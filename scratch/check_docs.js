const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkDocs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const docs = await mongoose.connection.db.collection('documentohotels').find().toArray();
        console.log('Documents found:', docs.length);
        docs.forEach(d => {
            console.log(`ID: ${d._id}, Nombre: ${d.nombre}, URL: ${d.url}, PublicID: ${d.public_id}, ResType: ${d.resource_type}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDocs();
