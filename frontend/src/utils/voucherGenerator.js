import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import Swal from 'sweetalert2';
import api from '../services/api';
import { formatCurrency } from './format';

// Función para cargar imagen y convertirla a Base64 para jsPDF
const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
        };
        img.onerror = (e) => reject(new Error(`No se pudo cargar la imagen: ${url}`));
        img.src = url;
    });
};

export const generateVoucher = async (data) => {
    // Mostrar feedback al usuario
    Swal.fire({
        title: 'Generando PDF',
        text: 'Por favor espere un momento...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });
        
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // 0. Obtener configuración dinámica del hotel
        let hotelInfo = {
            nombre: 'HOTEL BALCÓN PLAZA',
            nit: '900.000.000-1',
            direccion: 'Calle Real # 12-34, Santa Fe de Antioquia',
            telefono: '(604) 000-0000',
            correo: 'reservas@hotelbalconplaza.com',
            sitioWeb: 'www.hotelbalconplaza.com',
            datosBancarios: 'Banco: XXXXXX | Cuenta: Ahorros # XXXXXXXXX | Nequi: XXXXXXXXXX',
            lema: '¡Gracias por su preferencia!',
            politica: 'Este documento es un comprobante informativo. Los consumos adicionales se cobrarán al check-out.'
        };

        try {
            const configRes = await api.get('/hotel-config');
            if (configRes.data) {
                console.log("[PDF-DEBUG] Datos del hotel cargados:", configRes.data);
                hotelInfo = { ...hotelInfo, ...configRes.data };
            }
        } catch (configErr) {
            console.warn("[PDF-DEBUG] No se pudo cargar la configuración dinámica, usando valores por defecto.", configErr);
        }

        // 1. Cabecera (Header) con Logo - MUY COMPACTA
        let headerY = 10; // Empezamos más arriba
        try {
            // Cargar el logo desde la carpeta pública
            const logoBase64 = await loadImage('/logo.jpg');
            const logoWidth = 30; // Reducido de 40
            const logoHeight = 18; // Reducido de 25
            doc.addImage(logoBase64, 'JPEG', (pageWidth / 2) - (logoWidth / 2), 10, logoWidth, logoHeight);
            headerY = 32; // Posición ajustada
        } catch (error) {
            console.warn("Logo warning:", error.message);
            headerY = 15;
        }
 
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16); // Reducido de 20
        doc.setTextColor(30, 41, 59);
        doc.text(hotelInfo.nombre.toUpperCase(), pageWidth / 2, headerY, { align: 'center' });
 
        doc.setFontSize(8.5); // Reducido de 10
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`NIT: ${hotelInfo.nit} | TEL: ${hotelInfo.telefono}`, pageWidth / 2, headerY + 5, { align: 'center' });
        doc.text(`${hotelInfo.direccion}`, pageWidth / 2, headerY + 9, { align: 'center' });
        doc.text(`${hotelInfo.sitioWeb}`, pageWidth / 2, headerY + 13, { align: 'center' });
 
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, headerY + 18, pageWidth - margin, headerY + 18);

        // 2. Título del Documento - MÁS CERCA
        const startInfoY = headerY + 28; // Reducido de 35
        doc.setFontSize(12); // Reducido de 14
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        const titleText = data.tipo === 'reserva' ? 'COMPROBANTE DE RESERVA' : 'RECIBO DE HOSPEDAJE';
        doc.text(titleText, margin, startInfoY);
 
        // 3. Información del Cliente
        doc.setFontSize(9); // Reducido de 10
        doc.setTextColor(71, 85, 105);
        doc.text('DATOS DEL HUÉSPED', margin, startInfoY + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${data.cliente_nombre.toUpperCase()}`, margin, startInfoY + 14);
        doc.text(`Identificación: ${data.identificacion || 'N/A'}`, margin, startInfoY + 19);
        doc.text(`Teléfono: ${data.telefono || 'N/A'}`, margin, startInfoY + 24);

        // 4. Información de la Estancia - ACTUALIZADO
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLES DEL HOSPEDAJE', pageWidth / 2 + 10, startInfoY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Check-in: ${moment.utc(data.fecha_entrada).format('DD/MM/YYYY')}`, pageWidth / 2 + 10, startInfoY + 17);
        doc.text(`Check-out: ${moment.utc(data.fecha_salida).format('DD/MM/YYYY')}`, pageWidth / 2 + 10, startInfoY + 22);
        const noches = Math.max(1, moment.utc(data.fecha_salida).diff(moment.utc(data.fecha_entrada), 'days'));
        doc.text(`Duración: ${noches} Noches`, pageWidth / 2 + 10, startInfoY + 27);

        // 5. Tabla de Habitaciones
        const headers = [['HAB.', 'PRECIO POR NOCHE', 'SUBTOTAL']];
        const body = (data.habitaciones || []).map(h => [
            `Habitación ${h.numero || '?'}`,
            `$ ${formatCurrency(h.precio_acordado || h.precio || 0)}`,
            `$ ${formatCurrency((h.precio_acordado || h.precio || 0) * noches)}`
        ]);

        autoTable(doc, {
            startY: startInfoY + 32, // Más arriba
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 }, // Reducido
            margin: { left: margin, right: margin }
        });

        // 6. Resumen Financiero
        const finalY = doc.lastAutoTable.finalY + 15;
        const summaryX = pageWidth - margin - 60;

        doc.setFontSize(9); // Sincronizado con datos del huésped
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('VALOR TOTAL:', summaryX, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text(`$ ${formatCurrency(data.valor_total)}`, pageWidth - margin, finalY, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL ABONADO:', summaryX, finalY + 7);
        doc.setTextColor(16, 185, 129); // emerald-600
        doc.setFont('helvetica', 'bold');
        doc.text(`$ ${formatCurrency(data.valor_abonado)}`, pageWidth - margin, finalY + 7, { align: 'right' });

        const saldo = data.valor_total - data.valor_abonado;
        if (saldo > 0) {
            doc.setTextColor(220, 38, 38); // Rojo
        } else {
            doc.setTextColor(16, 185, 129); // Verde
        }
        doc.text('SALDO PENDIENTE:', summaryX, finalY + 14);
        doc.setFontSize(9); // Sincronizado con datos del huésped
        doc.text(`$ ${formatCurrency(saldo)}`, pageWidth - margin, finalY + 14, { align: 'right' });

        // 7. Pie de página (Footer) - EXTREMADAMENTE COMPACTO
        let footerY = doc.lastAutoTable.finalY + 8; // Pegado a la tabla
        
        const checkPageBreak = (neededHeight) => {
            const pageHeight = doc.internal.pageSize.getHeight();
            if (footerY + neededHeight > pageHeight - 10) {
                doc.addPage();
                footerY = 15;
                return true;
            }
            return false;
        };
 
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        
        footerY += 5;
        doc.setFontSize(9); // Aumentado de 8
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85); 
        doc.text('DATOS PARA TRANSFERENCIA:', margin, footerY);
        
        footerY += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9); // Sincronizado con datos del huésped
        const bankLines = doc.splitTextToSize((hotelInfo.datosBancarios || '').replace(/\n\s*\n/g, '\n'), pageWidth - (margin * 2));
        doc.text(bankLines, margin, footerY);
        footerY += (bankLines.length * 4.5) + 4;
 
        // Sección de Políticas - PEGADO AL TEXTO
        const hasPoliticaHeader = (hotelInfo.politica || '').toUpperCase().includes('TÉRMINOS');
        if (!hasPoliticaHeader) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.text('TÉRMINOS Y CONDICIONES:', margin, footerY);
            footerY += 4;
        }
 
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(71, 85, 105); 
        doc.setFontSize(7.5); // Aumentado ligeramente para legibilidad
        
        const politicaText = (hotelInfo.politica || '').trim();
        // Dividimos por párrafos para darles espacio
        const paragraphs = politicaText.split('\n');
        
        paragraphs.forEach(para => {
            if (!para.trim()) return;
            const lines = doc.splitTextToSize(para.trim(), pageWidth - (margin * 2));
            
            // Verificamos si necesitamos página nueva para este párrafo
            checkPageBreak(lines.length * 3.5 + 2);
            
            doc.text(lines, margin, footerY);
            footerY += (lines.length * 3.5) + 2; // Espacio entre párrafos
        });
        
        footerY += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text(hotelInfo.lema || '¡Gracias por su preferencia!', pageWidth / 2, footerY, { align: 'center' });

        // 8. Método de descarga robusto
        const safeName = `Voucher_${data.cliente_nombre.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}.pdf`;
        
        // Usamos Blob y un link oculto para asegurar el nombre del archivo en todos los navegadores
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', safeName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Swal.close();
        Swal.fire({
            icon: 'success',
            title: 'Archivo generado',
            text: `El voucher se ha descargado como ${safeName}`,
            timer: 2000,
            showConfirmButton: false
        });

    } catch (err) {
        console.error("Error al generar el PDF:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error de impresión',
            text: 'No se pudo generar el archivo PDF. Verifique su conexión y vuelva a intentarlo.'
        });
    }
};
