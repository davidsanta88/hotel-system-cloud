const mongoose = require('mongoose');
const URI = 'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority';
mongoose.connect(URI).then(async () => {
    const db = mongoose.connection.db;
    const config = await db.collection('hotelconfigs').findOne();
    console.log('HotelColonialDB Config:', JSON.stringify(config, null, 2));
    
    const count = await db.collection('habitacions').countDocuments();
    console.log('HotelColonialDB Hab Count:', count);
    
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
