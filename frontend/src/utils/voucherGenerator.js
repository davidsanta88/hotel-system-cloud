import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import { formatCurrency } from './format';

export const generateVoucher = (data) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Cabecera (Header)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // color-slate-800
    doc.text('HOTEL BALCÓN PLAZA', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // color-slate-500
    doc.text('NIT: 900.000.000-1 | TEL: (604) 000-0000', pageWidth / 2, 37, { align: 'center' });
    doc.text('Calle Real # 12-34, Santa Fe de Antioquia', pageWidth / 2, 42, { align: 'center' });

    doc.setDrawColor(226, 232, 240); // color-slate-200
    doc.line(margin, 50, pageWidth - margin, 50);

    // 2. Título del Documento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // color-blue-600
    const titleText = data.tipo === 'reserva' ? 'COMPROBANTE DE RESERVA' : 'RECIBO DE ESTANCIA (CHECK-IN)';
    doc.text(titleText, margin, 65);

    // 3. Información del Cliente
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // color-slate-600
    doc.text('DATOS DEL HUÉSPED', margin, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${data.cliente_nombre}`, margin, 82);
    doc.text(`Identificación: ${data.identificacion || 'N/A'}`, margin, 87);
    doc.text(`Teléfono: ${data.telefono || 'N/A'}`, margin, 92);

    // 4. Información de la Estancia
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE ESTANCIA', pageWidth / 2 + 10, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(`Check-in: ${moment.utc(data.fecha_entrada).format('DD/MM/YYYY')}`, pageWidth / 2 + 10, 82);
    doc.text(`Check-out: ${moment.utc(data.fecha_salida).format('DD/MM/YYYY')}`, pageWidth / 2 + 10, 87);
    const noches = moment.utc(data.fecha_salida).diff(moment.utc(data.fecha_entrada), 'days');
    doc.text(`Duración: ${noches} Noches`, pageWidth / 2 + 10, 92);

    // 5. Tabla de Habitaciones
    const headers = [['HAB.', 'PRECIO POR NOCHE', 'SUBTOTAL']];
    const body = (data.habitaciones || []).map(h => [
        `Habitación ${h.numero || '?'}`,
        `$ ${formatCurrency(h.precio_acordado || h.precio || 0)}`,
        `$ ${formatCurrency((h.precio_acordado || h.precio || 0) * noches)}`
    ]);

    doc.autoTable({
        startY: 105,
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
    doc.text('VALOR TOTAL:', summaryX, finalY);
    doc.setFont('helvetica', 'bold');
    doc.text(`$ ${formatCurrency(data.valor_total)}`, pageWidth - margin, finalY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('TOTAL ABONADO:', summaryX, finalY + 7);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.setFont('helvetica', 'bold');
    doc.text(`$ ${formatCurrency(data.valor_abonado)}`, pageWidth - margin, finalY + 7, { align: 'right' });

    const saldo = data.valor_total - data.valor_abonado;
    doc.setTextColor(saldo > 0 ? [220, 38, 38] : [16, 185, 129]); // red-600 o emerald-600
    doc.text('SALDO PENDIENTE:', summaryX, finalY + 14);
    doc.setFontSize(12);
    doc.text(`$ ${formatCurrency(saldo)}`, pageWidth - margin, finalY + 14, { align: 'right' });

    // 7. Pie de página (Footer)
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 260, pageWidth - margin, 260);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Este documento es un comprobante de reserva informativa. Los consumos adicionales se cobrarán al check-out.', margin, 270);
    doc.text('¡Gracias por elegir Hotel Balcón Plaza!', pageWidth / 2, 280, { align: 'center' });

    // Descargar el PDF
    doc.save(`Voucher-${data.cliente_nombre.replace(/\s+/g, '_')}.pdf`);
};
