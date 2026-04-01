const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const Visit = require('../backend/models/Visit');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const visits = await Visit.find().sort({ timestamp: -1 }).limit(10);
        console.log('Recent Visits:', JSON.stringify(visits, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
