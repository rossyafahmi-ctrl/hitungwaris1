import { useRef, useCallback } from 'react';
import { formatRupiah } from '../utils/warisEngine';
import { HEIR_INFO } from '../utils/warisData';

function StepHasil({ hasil, harta, onBack, onReset }) {
    const printRef = useRef(null);

    const handleExportPDF = useCallback(async () => {
        const element = printRef.current;
        if (!element) return;

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin: [10, 10, 10, 10],
                filename: 'hasil-hitung-waris.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    backgroundColor: '#05070a',
                    useCORS: true,
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            };
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error('PDF export error:', err);
            // Fallback: window print
            window.print();
        }
    }, []);

    if (!hasil) {
        return (
            <div className="card">
                <p>Tidak ada data perhitungan.</p>
                <div className="btn-row">
                    <button className="btn btn--secondary" onClick={onBack}>Kembali</button>
                </div>
            </div>
        );
    }

    const { hartaBersih, distribusi, hijabInfo } = hasil;
    const { hasil: hasilItems, asalMasalah, kasus } = distribusi;

    const totalDistributed = hasilItems.reduce((sum, h) => sum + (h.totalBagian || 0), 0);

    return (
        <div className="card">
            <div className="card__title">
                Hasil Perhitungan
            </div>
            <p className="card__subtitle">Distribusi harta warisan berdasarkan hukum faraidh</p>

            {/* Printable content */}
            <div ref={printRef} className="pdf-container" style={{ background: 'transparent', padding: 0 }}>
                {/* Summary */}
                <div className="result-summary">
                    <div className="result-summary__item">
                        <div className="result-summary__label">Tirkah</div>
                        <div className="result-summary__value">{formatRupiah(hartaBersih.tirkah)}</div>
                    </div>
                    <div className="result-summary__item">
                        <div className="result-summary__label">Pewaris</div>
                        <div className="result-summary__value">
                            {harta.jenisKelaminPewaris === 'lk' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                    </div>
                    <div className="result-summary__item">
                        <div className="result-summary__label">Hutang</div>
                        <div className="result-summary__value result-summary__value--danger">
                            − {formatRupiah(hartaBersih.hutang)}
                        </div>
                    </div>
                    <div className="result-summary__item">
                        <div className="result-summary__label">Wasiat</div>
                        <div className="result-summary__value result-summary__value--danger">
                            − {formatRupiah(hartaBersih.wasiat)}
                            {hartaBersih.wasiatMelebihi && ' (dibatasi ⅓)'}
                        </div>
                    </div>
                    <div className="result-summary__item">
                        <div className="result-summary__label">Tajhiz</div>
                        <div className="result-summary__value result-summary__value--danger">
                            − {formatRupiah(hartaBersih.tajhiz)}
                        </div>
                    </div>
                    <div className="result-summary__item">
                        <div className="result-summary__label">Al-Irts (Harta Bersih)</div>
                        <div className="result-summary__value result-summary__value--highlight">
                            {formatRupiah(hartaBersih.alIrts)}
                        </div>
                    </div>
                </div>

                {/* Kasus badge */}
                {kasus === 'aul' && (
                    <div className="kasus-badge kasus-badge--aul">
                        Kasus Aul — Total bagian fardhu melebihi harta. Semua bagian diproporsikan.
                    </div>
                )}
                {kasus === 'radd' && (
                    <div className="kasus-badge kasus-badge--radd">
                        Kasus Radd — Sisa harta dikembalikan proporsional ke ahli waris.
                    </div>
                )}

                {/* Asal Masalah */}
                {asalMasalah && (
                    <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '16px',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ASAL MASALAH</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-accent)' }}>
                            {asalMasalah}
                        </div>
                    </div>
                )}

                {/* Distribution table */}
                {hasilItems.length > 0 ? (
                    <table className="result-table">
                        <thead>
                            <tr>
                                <th>Ahli Waris</th>
                                <th>Bagian</th>
                                <th>Total</th>
                                <th>Per Orang</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasilItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="result-table__heir">
                                            {item.label}
                                            {item.jumlah > 1 && (
                                                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                                                    {' '}({item.jumlah} orang)
                                                </span>
                                            )}
                                        </div>
                                        <div className="result-table__detail">{item.keterangan}</div>
                                    </td>
                                    <td>
                                        <div className="result-table__fraction">{item.bagianFraksi}</div>
                                    </td>
                                    <td>
                                        <div className="result-table__amount">{formatRupiah(item.totalBagian)}</div>
                                    </td>
                                    <td>
                                        <div className="result-table__per-person">{formatRupiah(item.perOrang)}</div>
                                    </td>
                                </tr>
                            ))}
                            <tr className="result-table__total-row">
                                <td colSpan={2}>Total Terdistribusi</td>
                                <td colSpan={2}>
                                    <div className="result-table__amount">{formatRupiah(totalDistributed)}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: 'var(--text-muted)',
                    }}>
                        Tidak ada ahli waris yang berhak menerima warisan.
                    </div>
                )}

                {/* Hijab Info */}
                {Object.keys(hijabInfo).length > 0 && (
                    <div className="info-panel" style={{ marginTop: '16px' }}>
                        <div className="info-panel__title">Ahli Waris Terhalang</div>
                        {Object.entries(hijabInfo).map(([terhijab, penghalang]) => (
                            <div key={terhijab} className="info-term">
                                <span className="info-term__label">
                                    {HEIR_INFO[terhijab]?.label || terhijab}
                                </span>
                                <span className="info-term__def">
                                    Terhalang oleh {HEIR_INFO[penghalang]?.label || penghalang}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Disclaimer */}
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(212, 168, 67, 0.08)',
                    border: '1px solid rgba(212, 168, 67, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                }}>
                    <strong style={{ color: 'var(--text-gold)' }}>Catatan:</strong>
                    <p style={{ marginTop: '6px' }}>
                        Perhitungan ini berdasarkan ilmu faraidh sesuai Al-Quran (QS An-Nisa: 7, 11, 12, 176)
                        dan As-Sunnah. Untuk pembagian waris yang sah secara hukum, silakan berkonsultasi dengan
                        ulama, Pengadilan Agama, atau lembaga terkait.
                    </p>
                </div>
            </div>

            <div className="btn-row" style={{ marginTop: '24px' }}>
                <button className="btn btn--secondary" onClick={onBack}>Kembali</button>
                <button className="btn btn--gold" onClick={handleExportPDF}>
                    Export PDF
                </button>
                <button className="btn btn--danger" onClick={onReset}>Ulangi</button>
            </div>
        </div>
    );
}

export default StepHasil;
