import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
    const { path, isUpload } = req.query;
    
    if (!path) {
        return res.status(400).json({ error: 'Ruta no especificada' });
    }

    // Usamos HTTPS directamente para evitar el redirect de SmarterASP
    const baseUrl = 'https://hbalconplaza-001-site1.site4future.com';
    const finalPath = path.startsWith('uploads') ? path : `api/${path}`;
    const targetUrl = `${baseUrl}/${finalPath}`;
    
    // Credenciales de SmarterASP (11300916:60-dayfreetrial)
    const authHeader = 'Basic MTEzMDA5MTY6NjAtZGF5ZnJlZXRyaWFs';

    // Agente para ignorar errores de certificado SSL (común en SmarterASP free trial)
    const agent = new https.Agent({
        rejectUnauthorized: false
    });

    try {
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                'Authorization': authHeader,
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
            httpsAgent: agent,
            responseType: isUpload ? 'arraybuffer' : 'json',
            validateStatus: () => true // No lanzar error en 404/500 para manejarlos nosotros
        };

        // Enviar el JWT que viene del cliente
        if (req.headers.authorization) {
            axiosConfig.headers['x-auth-token'] = req.headers.authorization;
        }

        // Si es una petición con cuerpo
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            axiosConfig.data = req.body;
        }

        const response = await axios(axiosConfig);
        
        // Manejo de imágenes (uploads)
        if (isUpload) {
            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            return res.status(response.status).send(Buffer.from(response.data));
        }

        // Devolver la respuesta del backend
        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Proxy Axios Error:', error.message);
        return res.status(500).json({ 
            error: 'Error de conexión en el túnel (Axios)', 
            details: error.message 
        });
    }
}
