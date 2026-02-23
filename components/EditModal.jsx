'use client';
import { useState, useEffect } from 'react';
import { CATEGORIAS } from './ExpenseForm';

export default function EditModal({ gasto, onClose, onSaved }) {
    const [fecha, setFecha] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('Varios');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (gasto) {
            setFecha(gasto.fecha);
            setDescripcion(gasto.descripcion);
            setMonto(gasto.monto);
            setCategoria(gasto.categoria || 'Varios');
            setError('');
        }
    }, [gasto]);

    if (!gasto) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fecha || !descripcion.trim() || !monto) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/gastos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: gasto.id,
                    fecha,
                    descripcion: descripcion.trim(),
                    monto: parseFloat(monto),
                    categoria,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');

            onSaved?.(data);
            onClose?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-box"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Editar gasto"
            >
                <div className="modal-header">
                    <span>✏️ Editar Gasto</span>
                    <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-fecha">Fecha</label>
                        <input
                            id="edit-fecha"
                            type="date"
                            className="form-input"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-descripcion">Descripción</label>
                        <input
                            id="edit-descripcion"
                            type="text"
                            className="form-input"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-categoria">Categoría</label>
                        <select
                            id="edit-categoria"
                            className="form-input form-select"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                        >
                            {CATEGORIAS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-monto">Monto (€)</label>
                        <input
                            id="edit-monto"
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-input"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 12 }}>
                            ❌ {error}
                        </p>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <><span className="spinner" /> Guardando…</>
                            ) : (
                                <>💾 Guardar cambios</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
