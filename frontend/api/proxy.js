import axios from 'axios';

export default async function handler(req, res) {
    const { path, isUpload } = req.query;
    
    if (!path) {
        return res.status(400).json({ error: 'Ruta no especificada' });
    }

    // URL de DigitalOcean (Se debe configurar en las variables de entorno de Vercel)
    // En desarrollo puedes usar http://localhost:5000
    // Priorizamos VITE_API_URL que es la que el usuario ya configuró en Vercel
    const baseUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://whale-app-c75fy.ondigitalocean.app';

    
    const finalPath = path.startsWith('uploads') ? path : `api/${path}`;
    const targetUrl = `${baseUrl}/${finalPath}`;

    try {
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
            responseType: isUpload ? 'arraybuffer' : 'json',
            validateStatus: () => true 
        };

        // Enviar el JWT que viene del cliente en el header 'x-auth-token' que espera el backend
        if (req.headers.authorization) {
            axiosConfig.headers['x-auth-token'] = req.headers.authorization;
        }

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            axiosConfig.data = req.body;
        }

        const response = await axios(axiosConfig);
        
        if (isUpload) {
            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            return res.status(response.status).send(Buffer.from(response.data));
        }

        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).json({ 
            error: 'Error de conexión con el backend en DigitalOcean', 
            details: error.message 
        });
    }
}
