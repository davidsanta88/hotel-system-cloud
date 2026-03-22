const express = require('express');
const router = express.Router({ mergeParams: true });
const sql = require('mssql');
const { poolPromise } = require('../config/db');

// GET /reservas/:id/abonos
router.get('/', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('reserva_id', sql.Int, id)
            .query(`
                SELECT a.id, a.monto, a.medio_pago, a.notas, a.fecha, u.nombre as usuario_nombre
                FROM reservas_abonos a
                LEFT JOIN usuarios u ON u.id = a.usuario_id
                WHERE a.reserva_id = @reserva_id
                ORDER BY a.fecha ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /reservas/:id/abonos
router.post('/', async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, medio_pago, notas } = req.body;
        const usuario_id = req.userId;

        if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
            return res.status(400).json({ message: 'El monto del abono debe ser mayor a cero.' });
        }

        const pool = await poolPromise;

        // Check that the abono doesn't exceed pending balance
        const reservaResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT valor_total, valor_abonado FROM reservas WHERE id = @id');
        
        if (!reservaResult.recordset.length) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }

        const { valor_total, valor_abonado } = reservaResult.recordset[0];
        const saldo = parseFloat(valor_total) - parseFloat(valor_abonado);

        if (parseFloat(monto) > saldo + 0.01) {
            return res.status(400).json({ 
                message: `El abono ($${monto}) supera el saldo pendiente ($${saldo.toFixed(2)}).` 
            });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Insert abono
            await new sql.Request(transaction)
                .input('reserva_id', sql.Int, id)
                .input('monto', sql.Decimal(10, 2), parseFloat(monto))
                .input('medio_pago', sql.NVarChar(100), medio_pago || null)
                .input('notas', sql.NVarChar(500), notas || null)
                .input('usuario_id', sql.Int, usuario_id || null)
                .query(`INSERT INTO reservas_abonos (reserva_id, monto, medio_pago, notas, usuario_id) 
                        VALUES (@reserva_id, @monto, @medio_pago, @notas, @usuario_id)`);

            // Update the total abonado on the reservation
            await new sql.Request(transaction)
                .input('reserva_id', sql.Int, id)
                .query(`UPDATE reservas 
                        SET valor_abonado = (SELECT ISNULL(SUM(monto), 0) FROM reservas_abonos WHERE reserva_id = @reserva_id) 
                        WHERE id = @reserva_id`);

            await transaction.commit();
            res.status(201).json({ message: 'Abono registrado correctamente.' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /reservas/:id/abonos/:abonoId
router.delete('/:abonoId', async (req, res) => {
    try {
        const { id, abonoId } = req.params;
        const pool = await poolPromise;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await new sql.Request(transaction)
                .input('id', sql.Int, abonoId)
                .input('reserva_id', sql.Int, id)
                .query('DELETE FROM reservas_abonos WHERE id = @id AND reserva_id = @reserva_id');

            await new sql.Request(transaction)
                .input('reserva_id', sql.Int, id)
                .query(`UPDATE reservas 
                        SET valor_abonado = (SELECT ISNULL(SUM(monto), 0) FROM reservas_abonos WHERE reserva_id = @reserva_id) 
                        WHERE id = @reserva_id`);

            await transaction.commit();
            res.json({ message: 'Abono eliminado.' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
