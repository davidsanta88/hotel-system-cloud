
const cloudinary = require('cloudinary').v2;
const url = cloudinary.url('test', {
    cloud_name: 'demo',
    resource_type: 'image',
    // sign_url: true,
    flags: 'attachment:mi_archivo_pdf'
});
console.log(url);
