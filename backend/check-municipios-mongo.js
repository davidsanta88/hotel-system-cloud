const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Municipio = require('./models/Municipio');

async function check() {
    try {
        const password = 'hotel2026';
        const URI_ENV = `mongodb+srv://adminhotel:${password}@cluster0.pb5rtli.mongodb.net/HotelDB?retryWrites=true&w=majority`;
        const URI_TMP = `mongodb+srv://adminhotel:${password}@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority`;
        
        console.log('Testing URI_ENV (pb5rtli)...');
        try {
            await mongoose.connect(URI_ENV);
            console.log('Connected to URI_ENV');
        } catch (e) {
            console.log('Failed to connect to URI_ENV, trying URI_TMP (zsiq9ye)...');
            await mongoose.connect(URI_TMP);
            console.log('Connected to URI_TMP');
        }

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const count = await Municipio.countDocuments();
        console.log(`Total municipios: ${count}`);
        const sample = await Municipio.findOne();
        console.log(`Total municipios: ${count}`);
        console.log('Sample document:', JSON.stringify(sample, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
