"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCsv = toCsv;
exports.sendCsv = sendCsv;
function escapeCsvValue(value) {
    if (value === null || value === undefined)
        return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
function toCsv(rows, columns) {
    const header = columns.map((c) => escapeCsvValue(c.label)).join(',');
    const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(','));
    return [header, ...lines].join('\n');
}
function sendCsv(res, filename, csv) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csv);
}
//# sourceMappingURL=csv.js.map