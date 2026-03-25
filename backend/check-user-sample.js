const mongoose = require('mongoose');
const fs = require('fs');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

mongoose.connect(URI).then(async () => {
    const Usuario = require('./models/Usuario');
    require('./models/Rol');
    const user = await Usuario.findOne().populate('rol');
    fs.writeFileSync('user_debug.json', JSON.stringify(user, null, 2));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
