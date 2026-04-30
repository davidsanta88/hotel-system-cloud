const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const DocumentoHotel = require('../backend/models/DocumentoHotel');

async function check() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI ? 'URI FOUND' : 'URI NOT FOUND');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const docs = await DocumentoHotel.find().sort({ createdAt: -1 }).limit(10);
        console.log(`Found ${docs.length} documents`);
        docs.forEach(d => {
            console.log(`ID: ${d._id}`);
            console.log(`Nombre: ${d.nombre}`);
            console.log(`URL: ${d.url}`);
            console.log(`Public ID: ${d.public_id}`);
            console.log(`Resource Type: ${d.resource_type}`);
            console.log('---');
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

check();
