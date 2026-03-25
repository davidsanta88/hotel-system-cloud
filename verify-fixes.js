const mongoose = require('mongoose');
const path = require('path');
const dbPath = path.join(process.cwd(), 'backend', 'config', 'db');
const MunPath = path.join(process.cwd(), 'backend', 'models', 'Municipio');
const TipPath = path.join(process.cwd(), 'backend', 'models', 'TipoRegistro');

require(dbPath);
const Municipio = require(MunPath);
const TipoRegistro = require(TipPath);

async function verify() {
    try {
        const password = 'hotel2026';
        const URI = `mongodb+srv://adminhotel:${password}@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority`;
        await mongoose.connect(URI);

        const muni = await Municipio.findOne();
        const tipo = await TipoRegistro.findOne();

        console.log('--- Verification ---');
        if (muni) {
            const json = muni.toJSON();
            console.log('Municipio JSON has id:', json.id !== undefined);
            console.log('Municipio ID value:', json.id);
            console.log('Municipio _id value:', json._id.toString());
        } else {
            console.log('No Municipio found to verify.');
        }

        if (tipo) {
            const json = tipo.toJSON();
            console.log('TipoRegistro JSON has id:', json.id !== undefined);
            console.log('TipoRegistro ID value:', json.id);
        } else {
            console.log('No TipoRegistro found to verify.');
        }
        
        process.exit(0);
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    }
}
verify();
