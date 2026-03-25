const mongoose = require('mongoose');

// Global toJSON transform
mongoose.set('toJSON', { virtuals: true });
mongoose.set('toObject', { virtuals: true });

const testSchema = new mongoose.Schema({ name: String });
const Test = mongoose.model('Test', testSchema);

const doc = new Test({ name: 'Hello' });
console.log('toJSON output:', JSON.stringify(doc));
console.log('Has id?', doc.toJSON().id !== undefined);
process.exit(0);
