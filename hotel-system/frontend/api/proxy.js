export default async function handler(req, res) {
    const { path, isUpload } = req.query;
    
    if (!path) {
        return res.status(400).json({ error: 'Ruta no especificada' });
    }

    // Si la ruta ya empieza con 'uploads/', no le agregamos '/api/'
    const baseUrl = 'http://hbalconplaza-001-site1.site4future.com';
    const finalPath = path.startsWith('uploads') ? path : `api/${path}`;
    const targetUrl = `${baseUrl}/${finalPath}`;
    
    // Credenciales de SmarterASP (11300916:60-dayfreetrial)
    const authHeader = 'Basic MTEzMDA5MTY6NjAtZGF5ZnJlZXRyaWFs';

    try {
        const fetchOptions = {
            method: req.method,
            headers: {
                'Authorization': authHeader,
                'Content-Type': req.headers['content-type'] || 'application/json',
            }
        };

        // Enviar el JWT que viene del cliente en un header separado para no colisionar con la autenticación Basic de SmarterASP
        if (req.headers.authorization) {
            fetchOptions.headers['x-auth-token'] = req.headers.authorization;
        }

        // Si es una petición con cuerpo (POST, PUT, etc)
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        
        // Manejo de imágenes (uploads)
        if (isUpload) {
            const arrayBuffer = await response.arrayBuffer();
            res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
            return res.status(response.status).send(Buffer.from(arrayBuffer));
        }

        // Manejo de JSON (API)
        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy Fetch Error:', error);
        return res.status(500).json({ 
            error: 'Error de conexión en el túnel', 
            details: error.message 
        });
    }
}
