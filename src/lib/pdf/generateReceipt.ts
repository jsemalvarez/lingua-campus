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
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Use consistent RGB objects
        const primaryColor = { r: 40, g: 40, b: 40 };
        const secondaryColor = { r: 100, g: 100, b: 100 };
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- BORDER ---
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, margin, pageWidth - (margin * 2), 140); // Receipt box

        // --- TOP RIGHT CORNER: IVA EXENTO ---
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('IVA EXENTO', pageWidth - margin - 10, margin + 7, { align: 'right' });

        // --- HEADER LEFT: Logo & Institute Info ---
        const headerLeftWidth = (pageWidth - margin - 60) - (margin + 5);
        const centerX = (margin + 5) + (headerLeftWidth / 2);
        let currentY = margin + 12;

        if (data.institute.logoUrl) {
            try {
                const logoWidth = 35;
                const logoHeight = 20;
                const logoX = centerX - (logoWidth / 2);
                const logoY = currentY - 5;

                // Removed rounded corners and clipping because they cause crashes in Foxit Reader
                doc.addImage(data.institute.logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
                
                currentY += logoHeight + 2;
            } catch (e) {
                console.error('Logo failed to load:', e);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text((data.institute.name || 'INSTITUTO').toUpperCase(), centerX, currentY + 5, { align: 'center' });
                currentY += 12;
            }
        } else {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text((data.institute.name || 'INSTITUTO').toUpperCase(), centerX, currentY + 5, { align: 'center' });
            currentY += 12;
        }

        // Center-aligned Institute Info Below Logo
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.text('INGLÉS', centerX, currentY, { align: 'center' });
        currentY += 3.1;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
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

        // --- HEADER RIGHT: Receipt No & Date ---
        const headerRightX = pageWidth - margin - 50;
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`N° ${data.receiptNumber || '0000-0000'}`, headerRightX, margin + 12);

        const date = dayjs(data.date);
        doc.setFont('helvetica', 'normal');
        doc.text('FECHA:', headerRightX, margin + 22);

        // Date boxes
        const dateX = pageWidth - margin - 35;
        const dateY = margin + 18;
        doc.setDrawColor(180, 180, 180);
        doc.rect(dateX, dateY, 8, 6); // Day
        doc.rect(dateX + 9, dateY, 8, 6); // Month
        doc.rect(dateX + 18, dateY, 12, 6); // Year

        doc.setFontSize(8);
        doc.text(date.format('DD'), dateX + 2, dateY + 4.5);
        doc.text(date.format('MM'), dateX + 11, dateY + 4.5);
        doc.text(date.format('YY'), dateX + 21, dateY + 4.5);

        // --- FISCAL INFO ---
        doc.setFontSize(7);
        doc.setTextColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
        let fiscalLineY = margin + 29;
        if (data.institute.cuit) {
            doc.text(`C.U.I.T.: ${data.institute.cuit}`, headerRightX, fiscalLineY);
            fiscalLineY += 4;
        }
        if (data.institute.grossIncome) {
            doc.text(`Ing. BRUTOS: ${data.institute.grossIncome}`, headerRightX, fiscalLineY);
            fiscalLineY += 4;
        }
        if (data.institute.activityStartDate) {
            doc.text(`Inicio de Actividad: ${dayjs(data.institute.activityStartDate).format('DD/MM/YYYY')}`, headerRightX, fiscalLineY);
            fiscalLineY += 4;
        }
        doc.text('Documento no válido como factura.', headerRightX, fiscalLineY);

        // --- SEPARATOR LINE ---
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, margin + 45, pageWidth - margin, margin + 45);

        // --- CLIENT INFO ---
        doc.setDrawColor(0, 0, 0);
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('SEÑORES:', margin + 10, margin + 52);
        doc.setFont('helvetica', 'normal');
        doc.text((data.studentName || '').toUpperCase(), margin + 35, margin + 52);
        doc.line(margin + 35, margin + 53, margin + 110, margin + 53);

        doc.setFont('helvetica', 'bold');
        doc.text('DOMICILIO:', margin + 10, margin + 60);
        doc.setFont('helvetica', 'normal');
        doc.text((data.studentAddress || '').toUpperCase(), margin + 35, margin + 60);
        doc.line(margin + 35, margin + 61, margin + 110, margin + 61);

        // --- IVA CONDITION ---
        const ivaBoxY = margin + 66;
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin + 10, ivaBoxY, pageWidth - (margin * 2) - 20, 12);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('CONDICIÓN', margin + 12, ivaBoxY + 4.5);
        doc.text('DE I.V.A.', margin + 12, ivaBoxY + 8.5);

        const l1y = ivaBoxY + 4.5;
        const l2y = ivaBoxY + 8.5;
        const col1 = margin + 45;
        const col2 = margin + 93;
        const col3 = margin + 135;

        doc.setFont('helvetica', 'normal');
        doc.text('I.V.A RESP. INSCRIPTO', col1, l1y);
        doc.rect(col1 + 34, l1y - 2.2, 3, 3);
        doc.text('RESP. MONOTRIBUTO', col1, l2y);
        doc.rect(col1 + 34, l2y - 2.2, 3, 3);

        doc.text('EXENTO', col2, l1y);
        doc.rect(col2 + 22, l1y - 2.2, 3, 3);
        doc.text('CONS. FINAL', col2, l2y);
        doc.rect(col2 + 22, l2y - 2.2, 3, 3);
        doc.text('X', col2 + 22.8, l2y + 0.1); // Checked

        doc.text('NO RESPONSABLE', col3, l1y);
        doc.rect(col3 + 28, l1y - 2.2, 3, 3);

        // --- TABLE ---
        autoTable(doc, {
            startY: ivaBoxY + 16,
            margin: { left: margin + 10, right: margin + 10 },
            head: [['CONCEPTO', 'IMPORTE']],
            body: data.concepts.map(c => [
                (c.description || 'SIN CONCEPTO').toUpperCase(),
                `$ ${Number(c.amount || 0).toLocaleString()}`
            ]),
            theme: 'plain',
            headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold' },
            bodyStyles: { textColor: [40, 40, 40] },
            columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
        });

        // --- TOTAL ---
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('SON PESOS:', margin + 10, finalY);
        doc.line(margin + 35, finalY + 1, margin + 105, finalY + 1);

        const totalX = pageWidth - margin - 65;
        doc.setFillColor(240, 240, 240);
        doc.rect(totalX, finalY - 9, 55, 14, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(totalX, finalY - 9, 55, 14);
        doc.text('TOTAL  $', totalX + 5, finalY + 0.5);
        doc.text(`${Number(data.total || 0).toLocaleString()}`, totalX + 50, finalY + 0.5, { align: 'right' });

        doc.save(`Recibo_${data.receiptNumber || Date.now()}.pdf`);
    } catch (error) {
        console.error('PDF Generation Error:', error);
    }
};
