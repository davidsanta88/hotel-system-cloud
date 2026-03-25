const mongoose = require('mongoose');
const fs = require('fs');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

mongoose.connect(URI).then(async () => {
    const Rol = require('./models/Rol');
    const roles = await Rol.find();
    fs.writeFileSync('roles_debug.json', JSON.stringify(roles, null, 2));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});

