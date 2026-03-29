import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import Swal from 'sweetalert2';
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
            politica: 'Este documento es un comprobante informativo. Los consumos adicionales se cobrarán al check-out.'
        };

        try {
            const configRes = await api.get('/hotel-config');
            if (configRes.data) {
                hotelInfo = { ...hotelInfo, ...configRes.data };
            }
        } catch (configErr) {
            console.warn("No se pudo cargar la configuración dinámica, usando valores por defecto.");
        }

        // 1. Cabecera (Header) con Logo
        let headerY = 30;
        try {
            // Cargar el logo desde la carpeta pública
            const logoBase64 = await loadImage('/logo.jpg');
            const logoWidth = 40;
            const logoHeight = 25; 
            doc.addImage(logoBase64, 'JPEG', (pageWidth / 2) - (logoWidth / 2), 15, logoWidth, logoHeight);
            headerY = 48; // Bajar el texto si hay logo
        } catch (error) {
            console.warn("Logo warning:", error.message);
            headerY = 25;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(30, 41, 59); // color-slate-800
        doc.text(hotelInfo.nombre.toUpperCase(), pageWidth / 2, headerY, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // color-slate-500
        doc.text(`NIT: ${hotelInfo.nit} | TEL: ${hotelInfo.telefono}`, pageWidth / 2, headerY + 7, { align: 'center' });
        doc.text(`${hotelInfo.direccion} | ${hotelInfo.sitioWeb}`, pageWidth / 2, headerY + 12, { align: 'center' });

        doc.setDrawColor(226, 232, 240); // color-slate-200
        doc.line(margin, headerY + 20, pageWidth - margin, headerY + 20);

        // 2. Título del Documento
        const startInfoY = headerY + 35;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // color-blue-600
        const titleText = data.tipo === 'reserva' ? 'COMPROBANTE DE RESERVA' : 'RECIBO DE ESTANCIA';
        doc.text(titleText, margin, startInfoY);

        // 3. Información del Cliente
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // color-slate-600
        doc.text('DATOS DEL HUÉSPED', margin, startInfoY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${data.cliente_nombre.toUpperCase()}`, margin, startInfoY + 17);
        doc.text(`Identificación: ${data.identificacion || 'N/A'}`, margin, startInfoY + 22);
        doc.text(`Teléfono: ${data.telefono || 'N/A'}`, margin, startInfoY + 27);

        // 4. Información de la Estancia
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLES DE ESTANCIA', pageWidth / 2 + 10, startInfoY + 10);
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
            startY: startInfoY + 40,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: margin, right: margin }
        });

        // 6. Resumen Financiero
        const finalY = doc.lastAutoTable.finalY + 15;
        const summaryX = pageWidth - margin - 60;

        doc.setFontSize(10);
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
        doc.setFontSize(12);
        doc.text(`$ ${formatCurrency(saldo)}`, pageWidth - margin, finalY + 14, { align: 'right' });

        // 7. Pie de página (Footer)
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, 265, pageWidth - margin, 265);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text('DATOS PARA TRANSFERENCIA:', margin, 272);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(hotelInfo.datosBancarios || '', margin, 277);

        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(hotelInfo.politica, margin, 283, { maxWidth: pageWidth - (margin * 2) });
        doc.text('¡Gracias por su preferencia!', pageWidth / 2, 290, { align: 'center' });

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
