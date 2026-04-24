import React, { useState, useEffect } from 'react';
import { Mail, Printer, Download, ArrowLeft, Building2, MapPin, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import api from '../services/api';
import Swal from 'sweetalert2';

const InvitacionReligiosa = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [hotelConfig, setHotelConfig] = useState(null);
    const [formData, setFormData] = useState({
        entidad: 'Iglesias y Comunidades Cristianas y comunidad en general.',
        ciudad: '',
        asunto: 'Invitación especial a visitar el Cristo de Belalcázar'
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/hotel-config');
                setHotelConfig(res.data);
            } catch (err) {
                console.error("Error fetching hotel config", err);
            }
        };
        fetchConfig();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWhatsAppShare = () => {
        const message = `✨ *INVITACIÓN ESPECIAL* ✨\n\nCordial saludo,\n\nEn nombre de *Hotel Balcón Colonial* y *Hotel Balcón Plaza*, nos complace compartirles esta invitación especial para vivir una experiencia única de fe y turismo en el majestuoso *Cristo Rey de Belalcázar*, Caldas. 🏔️🙏\n\nDisfrute de los mejores paisajes del Eje Cafetero y la mejor hospitalidad con nosotros.\n\n📍 Belalcázar, Caldas\n📱 Más info: ${hotelConfig?.adminCelular || '316 279 9224'}\n\n*¡Los esperamos para vivir una experiencia inolvidable!* Para mayor detalle vea el siguiente video: https://www.youtube.com/shorts/ec5zd524VOI?si=xZLtkY5gMhRhWtGJ`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    const generatePDF = async (share = false) => {
        setLoading(true);
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'letter'
            });

            // --- HELPER PARA TEXTO JUSTIFICADO ---
            const justifyText = (text, x, y, maxWidth, lineHeight) => {
                const words = text.split(' ');
                let lines = [];
                let currentLine = words[0];

                for (let i = 1; i < words.length; i++) {
                    const word = words[i];
                    const width = doc.getTextWidth(currentLine + ' ' + word);
                    if (width < maxWidth) {
                        currentLine += ' ' + word;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
                lines.push(currentLine);

                lines.forEach((line, index) => {
                    if (index === lines.length - 1) {
                        doc.text(line, x, y + (index * lineHeight));
                    } else {
                        const wordsInLine = line.split(' ');
                        if (wordsInLine.length <= 1) {
                            doc.text(line, x, y + (index * lineHeight));
                            return;
                        }
                        const totalWordsWidth = wordsInLine.reduce((acc, word) => acc + doc.getTextWidth(word), 0);
                        const totalSpacing = maxWidth - totalWordsWidth;
                        const spacingPerWord = totalSpacing / (wordsInLine.length - 1);
                        
                        let currentX = x;
                        wordsInLine.forEach((word, wordIndex) => {
                            doc.text(word, currentX, y + (index * lineHeight));
                            currentX += doc.getTextWidth(word) + spacingPerWord;
                        });
                    }
                });
                return lines.length * lineHeight;
            };

            // --- ESTILO Y COLORES ---
            const primaryColor = [28, 15, 5]; // Café oscuro elegante
            const redColor = [204, 0, 0];    // Rojo
            const blueColor = [0, 51, 153];  // Azul

            try {
                // Background Image (Cristo de Belalcázar)
                const bgImg = '/bg_cristo.png';
                // Añadir imagen de fondo con opacidad baja
                doc.saveGraphicsState();
                const gState = { opacity: 0.18 }; // Opacidad ajustada para mejor visibilidad
                doc.setGState(new doc.GState(gState));
                doc.addImage(bgImg, 'PNG', 50, 0, 210, 279); // Desplazado a la derecha como en la imagen meta
                doc.restoreGraphicsState();
            } catch (e) { console.error("Error background image", e); }

            // --- LOGOS ---
            try {
                // Logo Colonial (Izquierda) - Usando el archivo copiado en Plaza
                const img1 = doc.getImageProperties('/logo_colonial.jpg');
                const ratio1 = img1.width / img1.height;
                const h1 = 35; // Altura fija para igualar
                const w1 = h1 * ratio1;
                doc.addImage('/logo_colonial.jpg', 'JPEG', 15, 10, w1, h1);
            } catch (e) { console.error("Error logo colonial", e); }

            try {
                // Logo Plaza (Derecha) - Usando el logo local de Plaza
                const img2 = doc.getImageProperties('/logo.jpg');
                const ratio2 = img2.width / img2.height;
                const h2 = 35; // Misma altura fija
                const w2 = h2 * ratio2;
                doc.addImage('/logo.jpg', 'JPEG', 212 - w2, 10, w2, h2);
            } catch (e) { console.error("Error logo plaza", e); }

            // --- ENCABEZADO ---
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11); // Un poquito más grande como pidió el usuario
            doc.text('HOTEL BALCÓN COLONIAL & HOTEL BALCÓN PLAZA', 107.5, 25, { align: 'center' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('Belalcázar, Caldas - Colombia', 107.5, 30, { align: 'center' });
            doc.text('Tradición y Paisaje Cultural Caldense', 107.5, 34, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text('www.balconnacolonial.com  |  www.hotelbalconplaza.com', 107.5, 39, { align: 'center' });

            // Línea de encabezado (ROJA)
            doc.setDrawColor(redColor[0], redColor[1], redColor[2]);
            doc.setLineWidth(0.8);
            doc.line(20, 55, 195, 55);

            // --- CUERPO DE LA CARTA ---
            doc.setTextColor(40, 40, 40);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);

            doc.text('Belalcázar, Caldas', 20, 65);
            doc.text('Abril 22 del 2026', 20, 70);

            doc.setFont('helvetica', 'bold');
            doc.text('Señores', 20, 85);
            doc.text(formData.entidad, 20, 90);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.ciudad, 20, 95);

            doc.setFont('helvetica', 'bold');
            // Doble línea de asunto (AZUL Y ROJA)
            doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
            doc.line(20, 102, 195, 102);
            doc.text(`Asunto: ${formData.asunto}`, 107.5, 108, { align: 'center' });
            doc.setDrawColor(redColor[0], redColor[1], redColor[2]);
            doc.line(20, 110, 195, 110);

            doc.setFont('helvetica', 'normal');
            const contentX = 20;
            let currentY = 120;

            doc.text('Cordial saludo,', contentX, currentY);
            currentY += 10;

            // Párrafo 1 con Nombres en Negrita
            const p1_part1 = 'En nombre de ';
            const p1_bold = 'Hotel Balcón Colonial y Hotel Balcón Plaza';
            const p1_part2 = ' de Belalcázar, nos permitimos extenderles una cordial invitación a vivir una experiencia única de fe, reflexión y turismo en nuestro hermoso municipio de Belalcázar, Caldas.';

            doc.setFont('helvetica', 'normal');
            doc.text(p1_part1, contentX, currentY);
            const wPart1 = doc.getTextWidth(p1_part1);
            doc.setFont('helvetica', 'bold');
            doc.text(p1_bold, contentX + wPart1, currentY);
            const wBold = doc.getTextWidth(p1_bold);
            doc.setFont('helvetica', 'normal');
            doc.text(' de Belalcázar, nos permitimos', contentX + wPart1 + wBold, currentY);
            
            // El resto del párrafo (que ya no cabe en la primera línea) lo justificamos normal
            currentY += 6;
            const p1_rest = 'extenderles una cordial invitación a vivir una experiencia única de fe, reflexión y turismo en nuestro hermoso municipio de Belalcázar, Caldas.';
            currentY += justifyText(p1_rest, contentX, currentY, 175, 6) + 4;

            const text2 = 'Nuestro municipio es reconocido por albergar el imponente Cristo Rey de Belalcázar, un majestuoso monumento que se levanta como símbolo de esperanza, espiritualidad y encuentro con Dios. Este lugar no solo es un referente religioso de gran importancia, sino también un destino turístico privilegiado que ofrece una vista panorámica incomparable del paisaje caldense colombiano.';
            currentY += justifyText(text2, contentX, currentY, 175, 6) + 6;

            // --- NUEVA SECCIÓN: UNA VISTA QUE ENAMORA ---
            doc.setFillColor(blueColor[0], blueColor[1], blueColor[2]);
            doc.circle(contentX + 5, currentY + 3, 5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text('V', contentX + 5, currentY + 4.5, { align: 'center' }); // Placeholder para el icono de ojo
            
            doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('UNA VISTA QUE ENAMORA DESDE LO MÁS ALTO', contentX + 12, currentY + 4);
            currentY += 8;
            
            doc.setTextColor(40, 40, 40);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const textExtra = 'El Cristo Rey de Belalcázar cuenta con un mirador al nivel de sus ojos al cual se puede acceder mediante una cómoda escalera interna (aprox. 140 escalones). Desde allí, se obtiene una vista 360° que permite divisar varios municipios de los departamentos de Caldas, Risaralda y Valle del Cauca, así como los majestuosos ríos Cauca y Risaralda, que serpentean entre montañas y valles llenos de vida.';
            currentY += justifyText(textExtra, contentX + 12, currentY, 163, 5) + 6;

            doc.text('Visitar el Cristo de Belalcázar es vivir una experiencia integral, donde los grupos pueden disfrutar de:', contentX, currentY);
            currentY += 8;

            const items = [
                'Espacios propicios para la oración, reflexión y fortalecimiento espiritual.',
                'Caminatas y recorridos hacia el monumento, ideales para la integración de grupos.',
                'Conocer el Hermoso Castillo del Café, un lugar mágico que rinde tributo a nuestra cultura.',
                'Contacto con la cultura caldense y la calidez de nuestra gente.',
                'Paisajes únicos que invitan al descanso, la contemplación y la renovación interior.'
            ];

            items.forEach(item => {
                doc.setFont('zapfdingbats');
                doc.text('l', contentX + 5, currentY); 
                doc.setFont('helvetica', 'normal');
                doc.text(item, contentX + 12, currentY);
                currentY += 6;
            });

            currentY += 4;
            const text3 = 'Adicionalmente, nuestros hoteles cuentan con excelentes opciones de estadía y alimentación, especialmente diseñadas para grupos, garantizando comodidad, calidad en el servicio y una atención cálida que hará de su visita una experiencia inolvidable.';
            currentY += justifyText(text3, contentX, currentY, 175, 6) + 4;

            const text4 = 'Será un honor para nosotros acompañarlos en la organización de su visita. Para mayor información y cotizaciones, los invitamos a comunicarse con nosotros.';
            currentY += justifyText(text4, contentX, currentY, 175, 6) + 15;

            // Ajuste de posición de firma para evitar traslape
            if (currentY > 210) { 
                doc.addPage();
                currentY = 30;
            }

            // FIRMA DIGITAL (Si existe)
            if (hotelConfig?.firmaUrl) {
                try {
                    const imgProps = doc.getImageProperties(hotelConfig.firmaUrl);
                    const ratio = imgProps.width / imgProps.height;
                    const firmaWidth = 45;
                    const firmaHeight = firmaWidth / ratio;
                    
                    doc.addImage(hotelConfig.firmaUrl, 'PNG', contentX, currentY - 10, firmaWidth, firmaHeight);
                    currentY += firmaHeight - 5;
                } catch (e) {}
            }

            doc.setFont('helvetica', 'normal');
            doc.text('Cordialmente,', contentX, currentY);
            currentY += 10;
            
            // Nombre Estilo Firma
            doc.setFont('times', 'italic');
            doc.setFontSize(14);
            doc.text('David Fernando Santa O.', contentX, currentY);
            currentY += 2;
            
            // Línea de firma
            doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
            doc.setLineWidth(0.5);
            doc.line(20, currentY, 100, currentY);
            currentY += 5;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 40);
            doc.text(hotelConfig?.adminNombre || 'David Fernando Santa Ospina', contentX, currentY);
            currentY += 5;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Administrador', contentX, currentY);
            currentY += 5;
            doc.text(`Celular: ${hotelConfig?.adminCelular || '316 279 9224'}`, contentX, currentY);
            currentY += 5;
            doc.text(`Correo: ${hotelConfig?.adminCorreo || 'balconcolonialhotel@gmail.com'}`, contentX, currentY);
            currentY += 5;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
            doc.text('Hotel Balcón Colonial & Hotel Balcón Plaza', contentX, currentY);

            // Footer más abajo y fijo (ROJO E ITÁLICO)
            doc.setFontSize(14); // Más grande como en la imagen
            doc.setTextColor(redColor[0], redColor[1], redColor[2]);
            doc.setFont('times', 'italic'); // Usando times para el itálico elegante
            doc.text('Belalcázar, Caldas - "El Balcón del Paisaje Cafetero"', 107.5, 275, { align: 'center' });

            doc.save(`Invitacion_Belalcazar_${formData.entidad.replace(/\s+/g, '_')}.pdf`);
            Swal.fire('Éxito', 'Carta de invitación generada correctamente', 'success');
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo generar el PDF', 'error');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] rounded-full -mr-20 -mt-20" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-500 rounded-xl">
                                    <Mail className="text-white" size={24} />
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-tight">Invitación Religiosa</h1>
                            </div>
                            <p className="text-slate-400 font-medium">Personalice los datos de la carta de invitación.</p>
                        </div>
                        
                            <button
                                onClick={handleWhatsAppShare}
                                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-3"
                            >
                                <Mail size={20} />
                                Compartir WhatsApp
                            </button>
                            <button
                                onClick={() => generatePDF(false)}
                                disabled={loading}
                                className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary-500 hover:text-white transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                            >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
                            ) : (
                                <Download size={20} />
                            )}
                            Generar PDF Elegante
                        </button>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {/* Formulario de Personalización */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Entidad / Organización Destinataria</label>
                            <input
                                type="text"
                                name="entidad"
                                value={formData.entidad}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-700 transition-all shadow-sm"
                                placeholder="Ej: Parroquia San José"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ciudad / Ubicación</label>
                            <input
                                type="text"
                                name="ciudad"
                                value={formData.ciudad}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-700 transition-all shadow-sm"
                                placeholder="Ej: Manizales, Caldas"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asunto de la Carta</label>
                            <input
                                type="text"
                                name="asunto"
                                value={formData.asunto}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-700 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                                <Building2 size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Dual Branding</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">La carta incluye automáticamente el nombre y presencia de ambos hoteles.</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                                <MapPin size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Destino Belalcázar</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Enfoque comercial en el Monumento al Cristo Rey y el Paisaje Cafetero.</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                                <FileText size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Formato Formal</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Redacción optimizada para comunidades religiosas y grupos grandes.</p>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 bg-slate-50/30">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Vista Previa del Contenido</h4>
                        <div className="bg-white p-8 md:p-12 shadow-inner rounded-2xl text-slate-700 font-serif leading-relaxed space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar border border-slate-100">
                            <p className="font-bold">Belalcázar, Caldas - Abril 22 del 2026</p>
                            <p className="font-bold">Señores<br/>{formData.entidad}</p>
                            <p className="font-bold border-y border-slate-100 py-2 text-center uppercase tracking-tight text-slate-900">Asunto: {formData.asunto}</p>
                            <p>Cordial saludo,</p>
                            <p>En nombre de Hotel Balcón Colonial y Hotel Balcón Plaza de Belalcázar, nos permitimos extenderles una cordial invitación a vivir una experiencia única de fe, reflexión y turismo en nuestro hermoso municipio de Belalcázar, Caldas...</p>
                            <p className="text-xs italic text-slate-400">... El PDF generado contendrá el texto completo y los logos de ambos hoteles.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvitacionReligiosa;
