'use client';
import { useState } from 'react';

function getTodayDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export const CATEGORIAS = [
    'Gastos fijos',
    'Mercado',
    'Comida Fuera',
    'Viajes',
    'Universidad',
    'Compras',
    'Varios',
];

export default function ExpenseForm({ onGastoAdded }) {
    const [fecha, setFecha] = useState(getTodayDate());
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('Varios');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fecha || !descripcion.trim() || !monto) return;
        setLoading(true);

        try {
            const res = await fetch('/api/gastos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha,
                    descripcion: descripcion.trim(),
                    monto: parseFloat(monto),
                    categoria,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');

            setDescripcion('');
            setMonto('');
            setFecha(getTodayDate());
            setCategoria('Varios');
            onGastoAdded?.(data, 'success', '✅ Gasto registrado correctamente');
        } catch (err) {
            onGastoAdded?.(null, 'error', `❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label className="form-label" htmlFor="fecha">Fecha</label>
                <input
                    id="fecha"
                    type="date"
                    className="form-input"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                />
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="descripcion">Descripción</label>
                <input
                    id="descripcion"
                    type="text"
                    className="form-input"
                    placeholder="Ej: Supermercado, gasolina…"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    maxLength={200}
                    required
                />
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="categoria">Categoría</label>
                <select
                    id="categoria"
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
                <label className="form-label" htmlFor="monto">Monto (€)</label>
                <input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                    <>
                        <span className="spinner" />
                        Guardando…
                    </>
                ) : (
                    <>
                        <span>＋</span> Registrar Gasto
                    </>
                )}
            </button>
        </form>
    );
}
