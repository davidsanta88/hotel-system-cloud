const axios = require('axios');

export default async function handler(req, res) {
    // Detectar si es una petición de API o de Imagen (uploads)
    const isUpload = req.url.includes('/uploads/');
    const path = req.url.split(isUpload ? '/uploads/' : '/api/')[1] || '';
    const targetUrl = `http://hbalconplaza-001-site1.site4future.com/${isUpload ? 'uploads' : 'api'}/${path}`;
    
    // Credenciales de SmarterASP (11300916:60-dayfreetrial)
    const authHeader = 'Basic MTEzMDA5MTY6NjAtZGF5ZnJlZXRyaWFs';

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: {
                'Authorization': authHeader,
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
            data: req.method !== 'GET' ? req.body : undefined,
            responseType: isUpload ? 'arraybuffer' : 'json', // Muy importante para imágenes
            timeout: 10000,
            validateStatus: () => true
        });

        // Si es una imagen, devolver los datos binarios correctamente
        if (isUpload) {
            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            return res.status(response.status).send(response.data);
        }

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).json({ 
            error: 'Error en el túnel de conexión', 
            details: error.message 
        });
    }
}
