'use client';
import { useState, useEffect, useCallback } from 'react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseTable from '@/components/ExpenseTable';
import MonthSelector from '@/components/MonthSelector';
import ExportButton from '@/components/ExportButton';
import EditModal from '@/components/EditModal';
import CategorySummary from '@/components/CategorySummary';

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

// ── Toast system ──────────────────────────────────────────
function ToastContainer({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ── Bottom sheet (mobile add form) ────────────────────────
function BottomSheet({ open, onClose, children }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="sheet-backdrop" onClick={onClose}>
            <div className="sheet-box" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-handle" />
                <div className="sheet-header">
                    <span>✏️ Nuevo Gasto</span>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function Home() {
    const [mes, setMes] = useState(getCurrentMonth());
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [editingGasto, setEditingGasto] = useState(null);
    const [showAddSheet, setShowAddSheet] = useState(false);

    // ── Toast helpers
    const addToast = useCallback((type, message) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    }, []);

    // ── Fetch gastos
    const fetchGastos = useCallback(async (month) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/gastos?mes=${month}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setGastos(data);
        } catch (err) {
            addToast('error', `❌ Error al cargar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { fetchGastos(mes); }, [mes, fetchGastos]);

    // ── Handlers
    const handleGastoAdded = (newGasto, type, message) => {
        addToast(type, message);
        setShowAddSheet(false);
        if (newGasto && newGasto.mes === mes) {
            setGastos((prev) =>
                [...prev, newGasto].sort((a, b) => a.fecha.localeCompare(b.fecha))
            );
        } else if (newGasto) {
            setMes(newGasto.mes);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/gastos?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setGastos((prev) => prev.filter((g) => g.id !== id));
            addToast('success', '🗑 Gasto eliminado');
        } catch (err) {
            addToast('error', `❌ ${err.message}`);
        }
    };

    const handleEdit = (gasto) => setEditingGasto(gasto);

    const handleGastoUpdated = (updated) => {
        setGastos((prev) =>
            prev
                .map((g) => (g.id === updated.id ? updated : g))
                .filter((g) => g.mes === mes)
                .sort((a, b) => a.fecha.localeCompare(b.fecha))
        );
        addToast('success', '✅ Gasto actualizado correctamente');
    };

    // ── Stats
    const total = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    const maxGasto = gastos.length > 0 ? Math.max(...gastos.map((g) => parseFloat(g.monto))) : 0;

    return (
        <>
            <div className="app-container">

                {/* ── Header ── */}
                <header className="app-header">
                    <div className="header-brand">
                        <div className="header-icon">💰</div>
                        <div>
                            <div className="header-title">Plataforma de Consumos</div>
                            <div className="header-subtitle">Registro y control de gastos mensuales</div>
                        </div>
                    </div>
                </header>

                {/* ── Stats strip ── */}
                <div className="stats-strip">
                    <div className="stat-card">
                        <div className="stat-label">Total del mes</div>
                        <div className="stat-value green">{formatCurrency(total)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">N° de gastos</div>
                        <div className="stat-value accent">{gastos.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Mayor gasto</div>
                        <div className="stat-value">{formatCurrency(maxGasto)}</div>
                    </div>
                </div>

                {/* ── Main grid ── */}
                <div className="main-grid">

                    {/* Left sidebar — desktop only */}
                    <aside className="desktop-sidebar">
                        <div className="card">
                            <div className="card-title">
                                <span className="icon">✏️</span> Nuevo Gasto
                            </div>
                            <ExpenseForm onGastoAdded={handleGastoAdded} />
                        </div>

                        <div className="card" style={{ marginTop: 20 }}>
                            <div className="card-title">
                                <span className="icon">📥</span> Exportar Excel
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
                                Genera y descarga un archivo Excel con todos los meses registrados, una hoja por mes.
                            </p>
                            <ExportButton onToast={addToast} />
                        </div>
                    </aside>

                    {/* Right column */}
                    <div className="right-column">

                        {/* Category Summary — above the table */}
                        <CategorySummary gastos={gastos} />

                        {/* Month selector + Table */}
                        <div className="card">
                            <MonthSelector value={mes} onChange={setMes} />
                            <div className="divider" />
                            <ExpenseTable
                                gastos={gastos}
                                loading={loading}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        </div>

                        {/* Export button — mobile only */}
                        <div className="mobile-export">
                            <div className="card">
                                <div className="card-title">
                                    <span className="icon">📥</span> Exportar Excel
                                </div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
                                    Genera y descarga un archivo Excel con todos los meses registrados, una hoja por mes.
                                </p>
                                <ExportButton onToast={addToast} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ── FAB — mobile only ── */}
            <button
                className="fab"
                onClick={() => setShowAddSheet(true)}
                aria-label="Añadir gasto"
            >
                ＋
            </button>

            {/* ── Bottom sheet (mobile add form) ── */}
            <BottomSheet open={showAddSheet} onClose={() => setShowAddSheet(false)}>
                <ExpenseForm onGastoAdded={handleGastoAdded} />
            </BottomSheet>

            <ToastContainer toasts={toasts} />

            <EditModal
                gasto={editingGasto}
                onClose={() => setEditingGasto(null)}
                onSaved={handleGastoUpdated}
            />
        </>
    );
}
