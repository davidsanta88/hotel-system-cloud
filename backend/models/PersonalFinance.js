const mongoose = require('mongoose');

const personalFinanceSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        enum: ['ingreso', 'gasto']
    },
    categoria_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalCategory',
        required: true
    },
    monto: {
        type: Number,
        required: true,
        min: 0
    },
    descripcion: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
}, {
    timestamps: true,
    collection: 'personal_finances'
});

module.exports = mongoose.model('PersonalFinance', personalFinanceSchema);
