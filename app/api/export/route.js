import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}

const MONTH_NAMES = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
};

const CATEGORIAS = [
    'Gastos fijos', 'Mercado', 'Comida Fuera',
    'Viajes', 'Universidad', 'Compras', 'Varios',
];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

const MONEY_FMT = '#,##0.00 €';
const FONT = { name: 'Calibri', size: 11 };
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
const TOTAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
const FULL_BORDER = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
const MED_BORDER = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

function addStyledRow(sheet, values, { bold = false, fill = null, height = 18, topBorderMedium = false, amountColIndex = 3 } = {}) {
    const row = sheet.addRow(values);
    row.height = height;
    const border = topBorderMedium ? MED_BORDER : FULL_BORDER;

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.font = { ...FONT, bold };
        cell.alignment = { vertical: 'middle', horizontal: colNum === amountColIndex ? 'right' : 'left' };
        cell.border = border;
        if (fill) cell.fill = fill;
    });

    const amtCell = row.getCell(amountColIndex);
    amtCell.numFmt = MONEY_FMT;

    return row;
}

function buildMonthSheet(wb, mes, gastos) {
    const [year, month] = mes.split('-');
    const monthName = MONTH_NAMES[month];

    const sheet = wb.addWorksheet(`${monthName} ${year}`);
    sheet.columns = [
        { key: 'a', width: 20 },
        { key: 'b', width: 42 },
        { key: 'c', width: 16 },
    ];

    const total = gastos.reduce((s, g) => s + parseFloat(g.monto), 0);

    // Per-category totals
    const catTotals = {};
    for (const c of CATEGORIAS) catTotals[c] = 0;
    for (const g of gastos) {
        const cat = g.categoria || 'Varios';
        if (catTotals[cat] !== undefined) catTotals[cat] += parseFloat(g.monto);
        else catTotals['Varios'] += parseFloat(g.monto);
    }
    const activeCats = CATEGORIAS.filter(c => catTotals[c] > 0);

    // Title
    sheet.mergeCells('A1:C1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Gastos ${monthName} ${year}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 28;

    sheet.addRow([]);

    // Summary table
    addStyledRow(sheet, ['Categoria', '', 'Total'], { bold: true, fill: HEADER_FILL, height: 20 });
    for (const cat of activeCats) {
        addStyledRow(sheet, [cat, '', catTotals[cat]], { height: 18 });
    }
    addStyledRow(sheet, ['Total consumido', '', total], { bold: true, fill: TOTAL_FILL, height: 20, topBorderMedium: true });

    sheet.addRow([]);
    sheet.addRow([]);

    // Detail table
    addStyledRow(sheet, ['Fecha', 'Descripcion', 'Monto'], { bold: true, fill: HEADER_FILL, height: 20 });
    for (const g of gastos) {
        addStyledRow(sheet, [formatDate(g.fecha), g.descripcion, parseFloat(g.monto)], { height: 18 });
    }
    addStyledRow(sheet, ['', 'Total', total], { bold: true, fill: TOTAL_FILL, height: 20, topBorderMedium: true });
}

function buildAnnualSummarySheet(wb, months, byMonth) {
    // Determine the year(s) from the data
    const years = [...new Set(months.map(m => m.split('-')[0]))];
    const label = years.length === 1 ? `Resumen ${years[0]}` : `Resumen ${years[0]}-${years[years.length - 1]}`;

    const sheet = wb.addWorksheet(label);
    sheet.columns = [
        { key: 'a', width: 20 },
        { key: 'b', width: 16 },
    ];

    // Title
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Resumen anual — ${years.join(' / ')}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 28;

    sheet.addRow([]);

    // Header
    const hRow = sheet.addRow(['Mes', 'Total']);
    hRow.height = 20;
    hRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.font = { name: 'Calibri', size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: col === 2 ? 'right' : 'left' };
        cell.fill = HEADER_FILL;
        cell.border = FULL_BORDER;
    });

    let grandTotal = 0;
    for (const mes of months) {
        const [year, month] = mes.split('-');
        const mesLabel = `${MONTH_NAMES[month]} ${year}`;
        const mesTotal = byMonth[mes].reduce((s, g) => s + parseFloat(g.monto), 0);
        grandTotal += mesTotal;

        const r = sheet.addRow([mesLabel, mesTotal]);
        r.height = 18;
        r.eachCell({ includeEmpty: true }, (cell, col) => {
            cell.font = { name: 'Calibri', size: 11 };
            cell.alignment = { vertical: 'middle', horizontal: col === 2 ? 'right' : 'left' };
            cell.border = FULL_BORDER;
        });
        r.getCell(2).numFmt = MONEY_FMT;
    }

    // Grand total
    const totRow = sheet.addRow(['Total anual', grandTotal]);
    totRow.height = 22;
    totRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.font = { name: 'Calibri', size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: col === 2 ? 'right' : 'left' };
        cell.fill = TOTAL_FILL;
        cell.border = MED_BORDER;
    });
    totRow.getCell(2).numFmt = MONEY_FMT;
}

// POST /api/export
export async function POST(request) {
    // Fetch ALL gastos ordered by date
    const { data: gastos, error } = await getSupabase()
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!gastos?.length)
        return NextResponse.json({ error: 'No hay gastos registrados' }, { status: 404 });

    // Group by mes (already sorted)
    const byMonth = {};
    for (const g of gastos) {
        if (!byMonth[g.mes]) byMonth[g.mes] = [];
        byMonth[g.mes].push(g);
    }

    const months = Object.keys(byMonth).sort(); // chronological

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Plataforma de Consumos';
    wb.created = new Date();

    // First sheet: annual summary
    buildAnnualSummarySheet(wb, months, byMonth);

    // One sheet per month
    for (const mes of months) {
        buildMonthSheet(wb, mes, byMonth[mes]);
    }

    const buffer = await wb.xlsx.writeBuffer();
    const year = new Date().getFullYear();
    const fileName = `Gastos-${year}.xlsx`;

    return new Response(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        },
    });
}
