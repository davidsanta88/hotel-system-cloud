import axios from 'axios';

// Desactivar bodyParser para permitir pasar el stream del request directamente (clave para archivos)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
    let { path, isUpload } = req.query;
    if (!path) {
        return res.status(400).json({ error: 'Ruta no especificada' });
    }

    // URL del backend (SmarterASP.net)
    const baseUrl = (process.env.VITE_API_URL || process.env.BACKEND_URL || 'http://hbalconplaza-001-site1.site4future.com').replace(/\/+$/, '');
    
    // Normalizar el path para evitar duplicados /api/api
    const cleanPath = path.replace(/^\/?api\//, '');
    
    // Construir la URL final
    const targetUrl = cleanPath.startsWith('uploads') 
        ? `${baseUrl}/${cleanPath}` 
        : `${baseUrl}/api/${cleanPath}`;

    try {
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                ...req.headers,
            },
            data: req, // Pasar el request original como stream
            responseType: isUpload ? 'arraybuffer' : 'json',
            validateStatus: () => true,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        };

        // Inyectar el token si existe en el header que espera el backend
        if (req.headers.authorization) {
            axiosConfig.headers['x-auth-token'] = req.headers.authorization;
        }

        // Eliminar headers que pueden causar conflictos (Axios/Vercel)
        delete axiosConfig.headers.host;
        delete axiosConfig.headers.connection;
        delete axiosConfig.headers.referer;

        const response = await axios(axiosConfig);
        
        // Propagar el status y el content-type
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }

        if (isUpload || (response.headers['content-type'] && response.headers['content-type'].includes('image'))) {
            return res.status(response.status).send(Buffer.from(response.data));
        }

        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).json({ 
            error: 'Error de conexión con el backend', 
            targetUrl,
            details: error.message 
        });
    }
}
