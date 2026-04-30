const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dtab1b41r',
    api_key: '648682136737222',
    api_secret: 'Z-2yP7_XN_X_S_jIFH' // This is probably wrong, but I'll use the one from config
});

// The secret in the screenshot URL signature seems to be different or I don't have it.
// But I can try to generate a URL and see if it works.

const publicId = 'documentos_hotel/Cedula_David_Santa_150_17775167048'; // Example
const cleanName = 'HOTEL_BALC_N_PLAZA'; // Without .pdf

const url = cloudinary.url(publicId, {
    resource_type: 'image',
    sign_url: true,
    flags: `attachment:${cleanName}`
});

console.log("Generated URL:", url);
