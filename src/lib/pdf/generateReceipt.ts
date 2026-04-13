import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

interface ReceiptData {
    receiptNumber: string;
    date: Date | string;
    studentName: string;
    studentAddress?: string | null;
    concepts: {
        description: string;
        amount: number;
    }[];
    total: number;
    institute: {
        name: string;
        address?: string | null;
        phone?: string | null;
        cuit?: string | null;
        grossIncome?: string | null;
        activityStartDate?: Date | string | null;
        logoUrl?: string | null;
    };
}

export const generatePaymentReceipt = async (data: ReceiptData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [40, 40, 40]; // Dark grey
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- BORDER ---
    doc.setDrawColor(200);
    doc.rect(margin, margin, pageWidth - (margin * 2), 140); // Receipt box

    // --- HEADER LEFT: Logo & Institute Info ---
    const headerLeftWidth = (pageWidth - margin - 60) - (margin + 5);
    const centerX = (margin + 5) + (headerLeftWidth / 2);
    let currentY = margin + 12;

    doc.setTextColor(primaryColor[0]);

    if (data.institute.logoUrl) {
        try {
            const logoWidth = 35;
            const logoHeight = 20;
            const logoX = centerX - (logoWidth / 2);
            const logoY = currentY - 5;

            // Apply rounded corners clipping
            doc.saveGraphicsState();
            doc.setDrawColor(255, 255, 255); // White border to "hide" it or just used for clipping
            doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 3, 3, 'S');
            doc.clip();
            doc.addImage(data.institute.logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
            doc.restoreGraphicsState();

            currentY += logoHeight + 2;
        } catch (e) {
            console.error('Error loading logo, falling back to text', e);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(data.institute.name.toUpperCase(), centerX, currentY + 5, { align: 'center' });
            currentY += 12;
        }
    } else {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(data.institute.name.toUpperCase(), centerX, currentY + 5, { align: 'center' });
        currentY += 12;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('INGLÉS', centerX, currentY, { align: 'center' });
    currentY += 3.1;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(0.3); // Add a small space between letters
    if (data.institute.address) {
        const capitalizedAddress = data.institute.address
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        doc.text(`${capitalizedAddress} - Mar del Plata`, centerX, currentY, { align: 'center' });
        currentY += 3.1;
    }
    if (data.institute.phone) {
        doc.text(`Tel: ${data.institute.phone}`, centerX, currentY, { align: 'center' });
    }
    doc.setCharSpace(0); // Reset after

    doc.setFontSize(8);
    doc.text('IVA EXENTO', pageWidth - margin - 2, margin + 4, { align: 'right' });

    // --- HEADER RIGHT: Receipt No & Date ---
    doc.setFontSize(10);
    doc.text(`N° ${data.receiptNumber}`, pageWidth - margin - 50, margin + 12);

    const date = dayjs(data.date);
    doc.text('FECHA:', pageWidth - margin - 50, margin + 22);

    // Date boxes (divided rectangles)
    const dateX = pageWidth - margin - 35;
    const dateY = margin + 18;
    const boxW = 8;
    const boxH = 6;
    doc.setDrawColor(180);
    doc.rect(dateX, dateY, boxW, boxH); // Day
    doc.rect(dateX + boxW + 1, dateY, boxW, boxH); // Month
    doc.rect(dateX + (boxW * 2) + 2, dateY, boxW + 4, boxH); // Year

    doc.setFontSize(8);
    doc.text(date.format('DD'), dateX + 2, dateY + 4.5);
    doc.text(date.format('MM'), dateX + boxW + 3, dateY + 4.5);
    doc.text(date.format('YY'), dateX + (boxW * 2) + 5, dateY + 4.5);
    doc.setDrawColor(200);
    // Line 80-81 from previous content was the text call

    // --- FISCAL INFO (Small, moved up) ---
    doc.setFontSize(7);
    doc.setTextColor(100);
    let fiscalLineY = margin + 29;
    if (data.institute.cuit) {
        doc.text(`C.U.I.T.: ${data.institute.cuit}`, pageWidth - margin - 50, fiscalLineY);
        fiscalLineY += 4;
    }
    if (data.institute.grossIncome) {
        doc.text(`Ing. BRUTOS: ${data.institute.grossIncome}`, pageWidth - margin - 50, fiscalLineY);
        fiscalLineY += 4;
    }
    if (data.institute.activityStartDate) {
        doc.text(`Inicio de Actividad: ${dayjs(data.institute.activityStartDate).format('DD/MM/YYYY')}`, pageWidth - margin - 50, fiscalLineY);
        fiscalLineY += 4;
    }
    doc.text('Documento no válido como factura.', pageWidth - margin - 50, fiscalLineY);

    // --- SEPARATOR LINE ---
    doc.setDrawColor(200);
    doc.line(margin, margin + 45, pageWidth - margin, margin + 45);

    // --- CLIENT INFO (Senores / Domicilio) ---
    doc.setDrawColor(0);
    doc.setTextColor(primaryColor[0]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SEÑORES:', margin + 10, margin + 52);
    doc.setFont('helvetica', 'normal');
    doc.text(data.studentName.toUpperCase(), margin + 35, margin + 52);
    doc.line(margin + 35, margin + 53, margin + 110, margin + 53);

    doc.setFont('helvetica', 'bold');
    doc.text('DOMICILIO:', margin + 10, margin + 60);
    doc.setFont('helvetica', 'normal');
    doc.text((data.studentAddress || '').toUpperCase(), margin + 35, margin + 60);
    doc.line(margin + 35, margin + 61, margin + 110, margin + 61);

    // --- IVA CONDITION (Grid Box) ---
    const ivaBoxTop = margin + 66;
    const ivaX = margin + 10;
    const ivaWidth = pageWidth - (margin * 2) - 20;
    const ivaHeight = 12;

    doc.setDrawColor(0);
    doc.rect(ivaX, ivaBoxTop, ivaWidth, ivaHeight);

    // Vertical centering within box
    // Total height 12. Two lines roughly at 4.5 and 8.5 from the top of the box
    const line1Y = ivaBoxTop + 4.5;
    const line2Y = ivaBoxTop + 8.5;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDICIÓN', ivaX + 2, line1Y);
    doc.text('DE I.V.A.', ivaX + 2, line2Y);

    const checkSize = 3;
    doc.setFont('helvetica', 'normal');

    // Column 1: RI & Monotributo
    const col1X = ivaX + 35;
    doc.text('I.V.A RESP. INSCRIPTO', col1X, line1Y);
    doc.rect(col1X + 34, line1Y - 2.2, checkSize, checkSize);

    doc.text('RESP. MONOTRIBUTO', col1X, line2Y);
    doc.rect(col1X + 34, line2Y - 2.2, checkSize, checkSize);

    // Column 2: Exento & Cons Final
    const col2X = col1X + 48;
    doc.text('EXENTO', col2X, line1Y);
    doc.rect(col2X + 22, line1Y - 2.2, checkSize, checkSize);

    doc.text('CONS. FINAL', col2X, line2Y);
    doc.rect(col2X + 22, line2Y - 2.2, checkSize, checkSize);
    if (true) { // Default as requested
        doc.setFontSize(8);
        doc.text('X', col2X + 22.8, line2Y + 0.1);
        doc.setFontSize(7);
    }

    // Column 3: No Responsable
    const col3X = col2X + 42;
    doc.text('NO RESPONSABLE', col3X, line1Y);
    doc.rect(col3X + 28, line1Y - 2.2, checkSize, checkSize);

    // --- CONCEPTS TABLE ---
    autoTable(doc, {
        startY: ivaBoxTop + ivaHeight + 4,
        margin: { left: margin + 10, right: margin + 10 },
        head: [['CONCEPTO', 'IMPORTE']],
        body: data.concepts.map(c => [c.description.toUpperCase(), `$ ${c.amount.toLocaleString()}`]),
        theme: 'plain',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: primaryColor,
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        }
    });

    // --- TOTAL ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SON PESOS:', margin + 10, finalY);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 35, finalY + 1, margin + 105, finalY + 1);

    const totalBoxWidth = 55;
    const totalBoxHeight = 14;
    const totalX = pageWidth - margin - totalBoxWidth - 10;
    const totalY = finalY - 9;

    doc.setFillColor(240, 240, 240);
    doc.rect(totalX, totalY, totalBoxWidth, totalBoxHeight, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(totalX, totalY, totalBoxWidth, totalBoxHeight);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL  $', totalX + 5, totalY + 9.5);
    doc.text(`${data.total.toLocaleString()}`, totalX + totalBoxWidth - 5, totalY + 9.5, { align: 'right' });
    doc.setLineWidth(0.1); // Reset

    // Save/Download
    doc.save(`Recibo_${data.receiptNumber}.pdf`);
};
