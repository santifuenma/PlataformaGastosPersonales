'use client';
import { useState } from 'react';

export default function ExportButton({ onToast, isHeader = false }) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al exportar');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Gastos-${new Date().getFullYear()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            onToast?.('success', '✅ Excel descargado con todos los meses');
        } catch (err) {
            onToast?.('error', `❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={isHeader ? "" : "export-section"} style={isHeader ? {} : { width: '100%', overflow: 'hidden' }}>
            <button
                className={`btn btn-success ${isHeader ? 'btn-header-action' : ''}`}
                onClick={handleExport}
                disabled={loading}
                style={isHeader ? {} : { width: '100%', minWidth: 0 }}
            >
                {loading ? (
                    <><span className="spinner" /> Generando…</>
                ) : (
                    <><span>📥</span> Exportar Excel</>
                )}
            </button>
        </div>
    );
}
