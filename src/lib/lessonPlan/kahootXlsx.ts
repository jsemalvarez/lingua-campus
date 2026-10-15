/**
 * La planilla que Kahoot importa con «Importar hoja de cálculo» (PED-09).
 *
 * Copia la forma de su plantilla (`KahootQuizTemplate.xlsx`): los encabezados en
 * la fila 8 y las preguntas desde la 9, con A el número, B la pregunta, C a F las
 * respuestas, G los segundos y H la correcta por número («2», o «2,3» si son
 * varias). Así se probó el 15/10/2026 en una cuenta gratis de docente: entraron
 * todas con la correcta marcada.
 *
 * Se arma acá, sin librerías: un xlsx es un zip con unos pocos XML, y se guarda
 * sin comprimir, que Excel y Kahoot leen igual.
 */

import type { KahootQuestion } from "./plan";

/** Los segundos por pregunta: Kahoot sólo acepta 5, 10, 20, 30, 60, 90, 120 o 240. */
export const KAHOOT_SECONDS = 20;

const HEADER_ROW = 8;

const HEADERS = [
    "",
    "Question - max 120 characters",
    "Answer 1 - max 75 characters",
    "Answer 2 - max 75 characters",
    "Answer 3 - max 75 characters",
    "Answer 4 - max 75 characters",
    "Time limit (sec) – 5, 10, 20, 30, 60, 90, 120, or 240 secs",
    "Correct answer(s) - choose at least one",
];

const COLUMNS = "ABCDEFGH";

function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        // Caracteres de control que el XML no admite.
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function textCell(ref: string, text: string): string {
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function numberCell(ref: string, n: number): string {
    return `<c r="${ref}"><v>${n}</v></c>`;
}

function sheetXml(questions: KahootQuestion[]): string {
    const header = HEADERS.map((h, i) => (h ? textCell(`${COLUMNS[i]}${HEADER_ROW}`, h) : "")).join("");
    const rows = questions.map((q, k) => {
        const r = HEADER_ROW + 1 + k;
        const answers = [0, 1, 2, 3].map((j) => (q.options[j] ? textCell(`${COLUMNS[2 + j]}${r}`, q.options[j]) : "")).join("");
        return (
            `<row r="${r}">` +
            numberCell(`A${r}`, k + 1) +
            textCell(`B${r}`, q.question) +
            answers +
            numberCell(`G${r}`, KAHOOT_SECONDS) +
            textCell(`H${r}`, String(q.answer + 1)) +
            `</row>`
        );
    });
    return (
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        `<sheetData><row r="${HEADER_ROW}">${header}</row>${rows.join("")}</sheetData>` +
        `</worksheet>`
    );
}

const CONTENT_TYPES =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `</Types>`;

const ROOT_RELS =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

const WORKBOOK =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`;

const WORKBOOK_RELS =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `</Relationships>`;

// ─── El zip, sin comprimir ───────────────────────────────────────────────────

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function zipStored(files: { name: string; data: Uint8Array }[]): Uint8Array {
    const encoder = new TextEncoder();
    const locals: Uint8Array[] = [];
    const centrals: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
        const name = encoder.encode(file.name);
        const crc = crc32(file.data);
        const size = file.data.length;

        const local = new Uint8Array(30 + name.length + size);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true); // versión necesaria
        lv.setUint16(6, 0x0800, true); // nombres en UTF-8
        lv.setUint16(8, 0, true); // sin comprimir
        lv.setUint16(10, 0, true); // hora
        lv.setUint16(12, 0x21, true); // fecha: 01/01/1980
        lv.setUint32(14, crc, true);
        lv.setUint32(18, size, true);
        lv.setUint32(22, size, true);
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true);
        local.set(name, 30);
        local.set(file.data, 30 + name.length);

        const central = new Uint8Array(46 + name.length);
        const cv = new DataView(central.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, 0, true);
        cv.setUint16(14, 0x21, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, size, true);
        cv.setUint32(24, size, true);
        cv.setUint16(28, name.length, true);
        cv.setUint32(42, offset, true);
        central.set(name, 46);

        locals.push(local);
        centrals.push(central);
        offset += local.length;
    }

    const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    const out = new Uint8Array(offset + centralSize + end.length);
    let at = 0;
    for (const part of [...locals, ...centrals, end]) {
        out.set(part, at);
        at += part.length;
    }
    return out;
}

/** El archivo .xlsx con las preguntas, listo para descargar. */
export function kahootXlsx(questions: KahootQuestion[]): Uint8Array {
    const encoder = new TextEncoder();
    return zipStored([
        { name: "[Content_Types].xml", data: encoder.encode(CONTENT_TYPES) },
        { name: "_rels/.rels", data: encoder.encode(ROOT_RELS) },
        { name: "xl/workbook.xml", data: encoder.encode(WORKBOOK) },
        { name: "xl/_rels/workbook.xml.rels", data: encoder.encode(WORKBOOK_RELS) },
        { name: "xl/worksheets/sheet1.xml", data: encoder.encode(sheetXml(questions)) },
    ]);
}
