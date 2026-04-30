const mongoose = require('mongoose');

const personalCategorySchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['ingreso', 'gasto']
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
}, {
    timestamps: true,
    collection: 'personal_categories'
});

// Asegurar que no haya categorías duplicadas para el mismo usuario y tipo
personalCategorySchema.index({ nombre: 1, tipo: 1, usuario_id: 1 }, { unique: true });

module.exports = mongoose.model('PersonalCategory', personalCategorySchema);
