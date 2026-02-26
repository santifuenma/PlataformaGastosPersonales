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

// ── Toast ──────────────────────────────────────────────────
function ToastContainer({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
            ))}
        </div>
    );
}

// ── Add Expense Modal (desktop popup) ─────────────────────
function AddExpenseModal({ open, onClose, children }) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="add-modal-backdrop" onClick={onClose}>
            <div className="add-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="add-modal-header">
                    <span>✏️ Nuevo Gasto</span>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="add-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ── Bottom sheet (mobile) ─────────────────────────────────
function BottomSheet({ open, onClose, children }) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
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
    const [showAddModal, setShowAddModal] = useState(false);

    const addToast = useCallback((type, message) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    }, []);

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

    const handleGastoAdded = (newGasto, type, message) => {
        addToast(type, message);
        setShowAddModal(false);
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
                            <div className="header-title">Plataforma de Gastos</div>
                            <div className="header-subtitle">Registro y control de gastos mensuales</div>
                        </div>
                    </div>

                    {/* Action buttons — top right, desktop only */}
                    <div className="header-actions">
                        <ExportButton onToast={addToast} isHeader={true} />
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

                {/* ── Main grid: CategorySummary | Table ── */}
                <div className="main-grid">

                    {/* Left: Category Summary + Export (desktop only) */}
                    <aside className="desktop-cat-panel">
                        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CategorySummary gastos={gastos} />
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 'auto' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowAddModal(true)}
                                    style={{ width: '100%' }}
                                >
                                    <span>＋</span> Agregar Gasto
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Right: Month + Table (all screens) */}
                    <div className="table-column">

                        {/* Category Summary on mobile/tablet */}
                        <div className="show-mobile">
                            <CategorySummary gastos={gastos} />
                        </div>

                        {/* Month selector + Table card */}
                        <div className="card table-card-stretch">
                            <MonthSelector value={mes} onChange={setMes} />
                            <div className="divider" />
                            <ExpenseTable
                                gastos={gastos}
                                loading={loading}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        </div>

                        {/* Export on mobile */}
                        <div className="mobile-export">
                            <div className="card">
                                <div className="card-title">
                                    <span className="icon">📥</span> Exportar Excel
                                </div>
                                <ExportButton onToast={addToast} />
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* ── FAB — mobile only ── */}
            <button
                className="fab"
                onClick={() => setShowAddModal(true)}
                aria-label="Añadir gasto"
            >
                ＋
            </button>

            {/* ── Add Expense Modal (both mobile bottom sheet & desktop popup) ── */}
            {/* Desktop: centered modal */}
            <div className="show-desktop">
                <AddExpenseModal open={showAddModal} onClose={() => setShowAddModal(false)}>
                    <ExpenseForm onGastoAdded={handleGastoAdded} />
                </AddExpenseModal>
            </div>

            {/* Mobile: bottom sheet */}
            <div className="show-mobile">
                <BottomSheet open={showAddModal} onClose={() => setShowAddModal(false)}>
                    <ExpenseForm onGastoAdded={handleGastoAdded} />
                </BottomSheet>
            </div>

            <ToastContainer toasts={toasts} />

            <EditModal
                gasto={editingGasto}
                onClose={() => setEditingGasto(null)}
                onSaved={handleGastoUpdated}
            />
        </>
    );
}
