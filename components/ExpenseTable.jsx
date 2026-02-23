'use client';

const CATEGORY_COLORS = {
    'Gastos fijos': { bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' },
    'Mercado': { bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' },
    'Comida Fuera': { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' },
    'Viajes': { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' },
    'Universidad': { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15' },
    'Compras': { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' },
    'Varios': { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8' },
};

function CategoryBadge({ categoria }) {
    const style = CATEGORY_COLORS[categoria] || CATEGORY_COLORS['Varios'];
    return (
        <span className="badge-cat" style={{ background: style.bg, color: style.color }}>
            {categoria || 'Varios'}
        </span>
    );
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function formatAmount(amount) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

// ── Mobile card list ──────────────────────────────────────────────────────────
function MobileList({ gastos, onDelete, onEdit }) {
    return (
        <div className="mobile-expense-list">
            {gastos.map((g) => (
                <div className="expense-card" key={g.id}>
                    {/* Top row: date · category · amount */}
                    <div className="expense-card-top">
                        <span className="badge-date">📅 {formatDate(g.fecha)}</span>
                        <CategoryBadge categoria={g.categoria} />
                        <span className="expense-card-amount">{formatAmount(g.monto)}</span>
                    </div>
                    {/* Bottom row: description · actions */}
                    <div className="expense-card-bottom">
                        <span className="expense-card-desc">{g.descripcion}</span>
                        <div className="expense-card-actions">
                            <button
                                className="btn btn-edit-ghost"
                                onClick={() => onEdit?.(g)}
                                title="Editar"
                            >✏️</button>
                            <button
                                className="btn btn-danger-ghost"
                                onClick={() => onDelete?.(g.id)}
                                title="Eliminar"
                            >🗑</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Desktop table ─────────────────────────────────────────────────────────────
function DesktopTable({ gastos, onDelete, onEdit }) {
    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th className="col-num">#</th>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th style={{ textAlign: 'right' }}>Monto</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {gastos.map((g, idx) => (
                        <tr key={g.id}>
                            <td className="col-num" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                            <td><span className="badge-date">📅 {formatDate(g.fecha)}</span></td>
                            <td style={{ maxWidth: 220 }}>{g.descripcion}</td>
                            <td><CategoryBadge categoria={g.categoria} /></td>
                            <td style={{ textAlign: 'right' }}>
                                <span className="amount">{formatAmount(g.monto)}</span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn-edit-ghost" onClick={() => onEdit?.(g)} title="Editar">✏️</button>
                                    <button className="btn btn-danger-ghost" onClick={() => onDelete?.(g.id)} title="Eliminar">🗑</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ExpenseTable({ gastos, loading, onDelete, onEdit }) {
    const total = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);

    const emptyState = (
        <div className="table-empty">
            <span className="empty-icon">📋</span>
            No hay gastos registrados este mes
        </div>
    );

    const loadingState = (
        <div className="table-empty">
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span className="spinner" style={{ borderTopColor: 'var(--accent)', borderColor: 'rgba(79,156,249,0.2)' }} />
                Cargando gastos…
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {loading ? loadingState : gastos.length === 0 ? emptyState : (
                <>
                    {/* Mobile: card list */}
                    <div className="show-mobile">
                        <MobileList gastos={gastos} onDelete={onDelete} onEdit={onEdit} />
                    </div>
                    {/* Desktop: full table — fills remaining card height */}
                    <div className="show-desktop" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <DesktopTable gastos={gastos} onDelete={onDelete} onEdit={onEdit} />
                    </div>
                </>
            )}

            {gastos.length > 0 && !loading && (
                <div className="totals-bar">
                    <div>
                        <div className="totals-label">Total del mes</div>
                        <div className="totals-count">{gastos.length} registro{gastos.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="totals-value">{formatAmount(total)}</div>
                </div>
            )}
        </div>
    );
}
