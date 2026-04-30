
const url = 'https://res.cloudinary.com/davidsanta/image/upload/v12345678/documentos_hotel/test.pdf';
const urlParts = url.split('/');
const uploadIndex = urlParts.indexOf('upload');
console.log('uploadIndex:', uploadIndex);
const resourceType = urlParts[uploadIndex - 1];
console.log('resourceType (correct):', resourceType);
const resourceTypeWrong = urlParts[uploadIndex - 2];
console.log('resourceType (wrong):', resourceTypeWrong);
const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/');
console.log('publicIdWithFolder:', publicIdWithFolder);
