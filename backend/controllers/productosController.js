const Producto = require('../models/Producto');
const fs = require('fs');

exports.getProductos = async (req, res) => {
    try {
        const productos = await Producto.find().sort({ nombre: 1 });
        res.json(productos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createProducto = async (req, res) => {
    try {
        console.log('[DEBUG] createProducto BODY:', req.body);
        console.log('[DEBUG] createProducto FILE:', req.file);
        const { nombre, categoria, precio, precio_compra, margen, stock, stock_minimo, descripcion, tipo_inventario } = req.body;


        const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

        const newProd = new Producto({
            nombre: nombre.trim(),
            categoria,
            precio_compra: parseFloat(precio_compra) || 0,
            precio: parseFloat(precio) || 0,
            margen: parseFloat(margen) || 0,
            stock: parseInt(stock) || 0,
            stockMinimo: parseInt(stock_minimo) || 0,
            descripcion,
            tipoInventario: tipo_inventario || 'venta',
            imagenUrl: imagen_url,
            usuarioCreacion: req.userName
        });


        await newProd.save();
        res.status(201).json({ message: 'Producto creado con éxito', producto: newProd });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProducto = async (req, res) => {
    try {
        console.log('[DEBUG] updateProducto BODY:', req.body);
        console.log('[DEBUG] updateProducto FILE:', req.file);
        const { id } = req.params;
        const { nombre, categoria, precio, precio_compra, margen, stock, stock_minimo, descripcion, tipo_inventario } = req.body;


        const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

        const updateData = {
            nombre: nombre.trim(),
            categoria,
            precio_compra: parseFloat(precio_compra) || 0,
            precio: parseFloat(precio) || 0,
            margen: parseFloat(margen) || 0,
            stock: parseInt(stock) || 0,
            stockMinimo: parseInt(stock_minimo) || 0,
            descripcion,
            tipoInventario: tipo_inventario || 'venta',
            usuarioModificacion: req.userName,
            fechaModificacion: Date.now()
        };


        if (imagen_url) updateData.imagenUrl = imagen_url;

        const updated = await Producto.findByIdAndUpdate(id, updateData, { new: true });
        res.json({ message: 'Producto actualizado con éxito', producto: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Producto.findById(id);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

        product.activo = !product.activo;
        await product.save();
        res.json({ activo: product.activo });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        // En MongoDB podrías verificar si el producto está referenciado en Ventas antes de borrar
        await Producto.findByIdAndDelete(id);
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductoDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Producto.findById(id);
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(producto);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAlertasStock = async (req, res) => {
    try {
        const products = await Producto.find({ $expr: { $lte: ["$stock", "$stockMinimo"] } });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        const updated = await Producto.findByIdAndUpdate(id, { stock }, { new: true });
        res.json({ message: 'Stock actualizado', stock: updated.stock });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.uploadImagen = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ninguna imagen' });
        }

        const imagen_url = `/uploads/productos/${req.file.filename}`;
        const product = await Producto.findByIdAndUpdate(id, { 
            imagenUrl: imagen_url,
            usuarioModificacion: req.userName,
            fechaModificacion: Date.now()
        }, { new: true });

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({ message: 'Imagen subida con éxito', producto: product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
