'use client';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MonthSelector({ value, onChange }) {
    // value: "YYYY-MM"
    const [year, month] = value.split('-').map(Number);

    const prev = () => {
        const d = new Date(year, month - 2); // month is 1-indexed
        onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const next = () => {
        const d = new Date(year, month); // month is already 1-indexed, so this gives next month
        onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    return (
        <div className="month-bar">
            <button type="button" className="btn-nav" onClick={prev} aria-label="Mes anterior">
                ‹
            </button>
            <div className="month-display">
                {MONTH_NAMES[month - 1]} {year}
            </div>
            <button type="button" className="btn-nav" onClick={next} aria-label="Mes siguiente">
                ›
            </button>
        </div>
    );
}
