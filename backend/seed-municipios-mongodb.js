const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Municipio = require('./models/Municipio');
require('dotenv').config();

const seed = async () => {
    try {
        const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';
        await mongoose.connect(URI);
        console.log('Connected to MongoDB Atlas');

        const rawPath = path.join(__dirname, 'municipios_raw.txt');
        const rawData = fs.readFileSync(rawPath, 'utf8');
        
        const docs = rawData.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const parts = line.split('-');
                const departamento = parts[0].trim();
                return {
                    nombre: line.trim(),
                    departamento: departamento,
                    visualizar: true // Set to true for full visibility
                };
            })
            .filter(d => d.nombre && d.departamento);

        console.log(`Parsed ${docs.length} municipios. Seeding...`);

        // Empty the collection first
        await Municipio.deleteMany({});
        console.log('Collection emptied.');

        // Bulk insert in chunks to avoid memory/network issues
        const chunkSize = 100;
        for (let i = 0; i < docs.length; i += chunkSize) {
            const chunk = docs.slice(i, i + chunkSize);
            await Municipio.insertMany(chunk);
            console.log(`Progress: ${Math.min(i + chunkSize, docs.length)}/${docs.length}`);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
