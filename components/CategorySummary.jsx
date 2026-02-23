'use client';

const CATEGORIAS = [
    'Gastos fijos', 'Mercado', 'Comida Fuera',
    'Viajes', 'Universidad', 'Compras', 'Varios',
];

const CATEGORY_CONFIG = {
    'Gastos fijos': { color: '#a78bfa', icon: '🏠' },
    'Mercado': { color: '#4ade80', icon: '🛒' },
    'Comida Fuera': { color: '#fb923c', icon: '🍽️' },
    'Viajes': { color: '#22d3ee', icon: '✈️' },
    'Universidad': { color: '#facc15', icon: '🎓' },
    'Compras': { color: '#f472b6', icon: '🛍️' },
    'Varios': { color: '#94a3b8', icon: '📦' },
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

export default function CategorySummary({ gastos }) {
    if (!gastos || gastos.length === 0) return null;

    const total = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);

    // Build totals per category
    const totals = {};
    for (const c of CATEGORIAS) totals[c] = 0;
    for (const g of gastos) {
        const cat = g.categoria || 'Varios';
        if (totals[cat] !== undefined) totals[cat] += parseFloat(g.monto);
        else totals['Varios'] += parseFloat(g.monto);
    }

    // Only show categories with spending
    const active = CATEGORIAS.filter((c) => totals[c] > 0);

    return (
        <div className="cat-summary-card">
            <div className="cat-summary-title">
                <span>📊</span> Resumen por Categoría
            </div>

            <div className="cat-summary-list">
                {active.map((cat) => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const pct = total > 0 ? (totals[cat] / total) * 100 : 0;

                    return (
                        <div className="cat-row" key={cat}>
                            <div className="cat-row-left">
                                <span className="cat-icon">{cfg.icon}</span>
                                <span className="cat-name">{cat}</span>
                            </div>
                            <div className="cat-row-right">
                                <div className="cat-bar-wrap">
                                    <div
                                        className="cat-bar-fill"
                                        style={{
                                            width: `${pct}%`,
                                            background: cfg.color,
                                        }}
                                    />
                                </div>
                                <span className="cat-pct">{pct.toFixed(0)}%</span>
                                <span className="cat-amount" style={{ color: cfg.color }}>
                                    {formatCurrency(totals[cat])}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="cat-total-row">
                <span>Total del mes</span>
                <span className="cat-total-value">{formatCurrency(total)}</span>
            </div>
        </div>
    );
}
