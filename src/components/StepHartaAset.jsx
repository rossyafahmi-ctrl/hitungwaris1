import { useState, useMemo, useCallback } from 'react';
import { ASSET_CATEGORIES, SETTLEMENT_MODES, createEmptyAsset } from '../utils/warisData';
import { formatRupiah, hitungNilaiBersihAset, hitungRingkasanAset } from '../utils/warisEngine';

// ─── Helpers ────────────────────────────────────────────────
function displayCurrency(val) {
    if (!val && val !== 0) return '';
    return Number(val).toLocaleString('id-ID');
}

function parseCurrency(raw) {
    return raw.replace(/[^0-9]/g, '');
}

function getCategoryInfo(value) {
    return ASSET_CATEGORIES.find((c) => c.value === value) || ASSET_CATEGORIES[0];
}

// ─── Single Asset Card ──────────────────────────────────────
function AssetCard({ aset, index, onUpdate, onRemove, totalAset }) {
    const handleField = (field) => (e) => {
        onUpdate(aset.id, field, e.target.value);
    };

    const handleCurrency = (field) => (e) => {
        onUpdate(aset.id, field, parseCurrency(e.target.value));
    };

    const handleNumber = (field) => (e) => {
        const v = e.target.value.replace(/[^0-9.]/g, '');
        const num = Math.min(100, Math.max(0, Number(v) || 0));
        onUpdate(aset.id, field, num);
    };

    const handleToggleHartaBersama = () => {
        const newVal = !aset.hartaBersama;
        onUpdate(aset.id, 'hartaBersama', newVal);
        if (newVal) {
            onUpdate(aset.id, 'kepemilikan', 50);
        } else {
            onUpdate(aset.id, 'kepemilikan', 100);
        }
    };

    const handleModeChange = (mode) => {
        onUpdate(aset.id, 'modeSettlement', mode);
    };

    const toggleExpanded = () => {
        onUpdate(aset.id, 'expanded', !aset.expanded);
    };

    const catInfo = getCategoryInfo(aset.kategori);
    const calc = hitungNilaiBersihAset(aset);
    const hasValue = (Number(aset.nilaiEstimasi) || 0) > 0;
    const modeInfo = SETTLEMENT_MODES.find((m) => m.value === aset.modeSettlement);

    return (
        <div className={`asset-card ${aset.expanded ? 'asset-card--expanded' : ''}`}>
            {/* Header */}
            <div className="asset-header" onClick={toggleExpanded}>
                <div className="asset-header__left">
                    <span className="asset-header__number">{index + 1}</span>
                    <span className="asset-header__icon">{catInfo.icon}</span>
                    <div className="asset-header__info">
                        <span className="asset-header__name">
                            {aset.nama || 'Aset Baru'}
                        </span>
                        <span className="asset-header__badge">{catInfo.label}</span>
                    </div>
                </div>
                <div className="asset-header__right">
                    {hasValue && (
                        <span className="asset-header__value">
                            {formatRupiah(Math.round(calc.nilaiBersih))}
                        </span>
                    )}
                    <button
                        className="asset-header__toggle"
                        aria-label={aset.expanded ? 'Tutup' : 'Buka'}
                    >
                        {aset.expanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {/* Body */}
            {aset.expanded && (
                <div className="asset-body">
                    {/* Row 1: Nama & Kategori */}
                    <div className="asset-form-row asset-form-row--2col">
                        <div className="form-group">
                            <label className="form-label">Nama Aset</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Contoh: Rumah Jl. Merdeka"
                                value={aset.nama}
                                onChange={handleField('nama')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select
                                className="form-input select-input"
                                value={aset.kategori}
                                onChange={handleField('kategori')}
                            >
                                {ASSET_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Nilai Estimasi */}
                    <div className="form-group">
                        <label className="form-label">
                            Nilai Estimasi (Rp) <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input form-input--currency"
                            placeholder="Contoh: 500.000.000"
                            value={displayCurrency(aset.nilaiEstimasi)}
                            onChange={handleCurrency('nilaiEstimasi')}
                            inputMode="numeric"
                        />
                    </div>

                    {/* Row 3: Harta Bersama Toggle & Kepemilikan */}
                    <div className="asset-form-row asset-form-row--2col">
                        <div className="form-group">
                            <label className="form-label">Harta Bersama Pasangan?</label>
                            <div
                                className={`toggle-switch ${aset.hartaBersama ? 'toggle-switch--active' : ''}`}
                                onClick={handleToggleHartaBersama}
                                role="switch"
                                aria-checked={aset.hartaBersama}
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleHartaBersama(); }}
                            >
                                <div className="toggle-switch__track">
                                    <div className="toggle-switch__thumb" />
                                </div>
                                <span className="toggle-switch__label">
                                    {aset.hartaBersama ? 'Ya' : 'Tidak'}
                                </span>
                            </div>
                            {aset.hartaBersama && (
                                <p className="form-hint">
                                    ℹ️ Harta bersama — hak pewaris default 50%
                                </p>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kepemilikan Pewaris (%)</label>
                            <div className="pct-input-wrap">
                                <input
                                    type="number"
                                    className="form-input pct-input"
                                    value={aset.kepemilikan}
                                    onChange={handleNumber('kepemilikan')}
                                    min={0}
                                    max={100}
                                    step={1}
                                />
                                <span className="pct-input-wrap__symbol">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Hutang Melekat */}
                    <div className="form-group">
                        <label className="form-label">Hutang Melekat pada Aset (Rp)</label>
                        <input
                            type="text"
                            className="form-input form-input--currency"
                            placeholder="0"
                            value={displayCurrency(aset.hutangMelekat)}
                            onChange={handleCurrency('hutangMelekat')}
                            inputMode="numeric"
                        />
                        <p className="form-hint">Contoh: sisa KPR, kredit kendaraan</p>
                    </div>

                    {/* Row 5: Mode Penyelesaian */}
                    <div className="form-group">
                        <label className="form-label">Mode Penyelesaian Aset</label>
                        <div className="mode-selector">
                            {SETTLEMENT_MODES.map((mode) => (
                                <div
                                    key={mode.value}
                                    className={`mode-option ${aset.modeSettlement === mode.value ? 'mode-option--active' : ''}`}
                                    onClick={() => handleModeChange(mode.value)}
                                    role="radio"
                                    aria-checked={aset.modeSettlement === mode.value}
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleModeChange(mode.value); }}
                                >
                                    <span className="mode-option__icon">{mode.icon}</span>
                                    <span className="mode-option__label">{mode.label}</span>
                                </div>
                            ))}
                        </div>
                        {modeInfo && (
                            <p className="form-hint" style={{ marginTop: '8px' }}>
                                {modeInfo.desc}
                            </p>
                        )}
                    </div>

                    {/* Conditional: Biaya Transaksi (Jual) */}
                    {aset.modeSettlement === 'jual' && (
                        <div className="form-group conditional-field">
                            <label className="form-label">Biaya Transaksi / Jual (Rp)</label>
                            <input
                                type="text"
                                className="form-input form-input--currency"
                                placeholder="0"
                                value={displayCurrency(aset.biayaTransaksi)}
                                onChange={handleCurrency('biayaTransaksi')}
                                inputMode="numeric"
                            />
                            <p className="form-hint">Biaya agen, notaris, pajak penjualan, dll.</p>
                        </div>
                    )}

                    {/* Conditional: Nilai Appraisal (Buyout) */}
                    {aset.modeSettlement === 'buyout' && (
                        <div className="form-group conditional-field">
                            <label className="form-label">
                                Nilai Appraisal (Rp) <span style={{ color: 'var(--danger)' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input form-input--currency"
                                placeholder="Nilai appraisal terbaru"
                                value={displayCurrency(aset.nilaiAppraisal)}
                                onChange={handleCurrency('nilaiAppraisal')}
                                inputMode="numeric"
                            />
                            <p className="form-hint">Gunakan nilai appraisal sebagai dasar perhitungan buyout. Ahli waris penerima aset membayar kompensasi kepada ahli waris lain.</p>
                        </div>
                    )}

                    {/* Net Value */}
                    {hasValue && (
                        <div className="asset-net-value">
                            <div className="asset-net-value__row">
                                <span>Nilai bruto (estimasi × {aset.kepemilikan}%)</span>
                                <span>{formatRupiah(Math.round(calc.nilaiBruto))}</span>
                            </div>
                            {calc.pengurang > 0 && (
                                <div className="asset-net-value__row asset-net-value__row--deduct">
                                    <span>Pengurang</span>
                                    <span>− {formatRupiah(Math.round(calc.pengurang))}</span>
                                </div>
                            )}
                            <div className="asset-net-value__row asset-net-value__row--total">
                                <span>Nilai Bersih Aset</span>
                                <span>{formatRupiah(Math.round(calc.nilaiBersih))}</span>
                            </div>
                        </div>
                    )}

                    {/* Remove Button */}
                    {totalAset > 1 && (
                        <button
                            className="btn btn--danger-ghost asset-remove-btn"
                            onClick={() => onRemove(aset.id)}
                            type="button"
                        >
                            🗑️ Hapus Aset Ini
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Step Component ────────────────────────────────────
function StepHartaAset({ harta, updateHarta, onNext }) {
    const asetList = harta.asetList || [];
    const hutang = Number(harta.hutang) || 0;
    const wasiat = Number(harta.wasiat) || 0;
    const tajhiz = Number(harta.tajhiz) || 0;

    const ringkasan = useMemo(() => hitungRingkasanAset(asetList), [asetList]);
    const tirkah = ringkasan.totalTirkah;
    const maxWasiat = tirkah / 3;
    const wasiatMelebihi = wasiat > maxWasiat && tirkah > 0;
    const alIrts = Math.max(0, tirkah - hutang - Math.min(wasiat, maxWasiat) - tajhiz);

    const canProceed = tirkah > 0 && alIrts > 0;

    // ─── Asset CRUD
    const addAset = useCallback(() => {
        const newAset = createEmptyAsset();
        // Collapse all existing, expand the new one
        const updatedList = asetList.map((a) => ({ ...a, expanded: false }));
        updateHarta('asetList', [...updatedList, newAset]);
    }, [asetList, updateHarta]);

    const updateAset = useCallback((id, field, value) => {
        const updated = asetList.map((a) =>
            a.id === id ? { ...a, [field]: value } : a
        );
        updateHarta('asetList', updated);
    }, [asetList, updateHarta]);

    const removeAset = useCallback((id) => {
        updateHarta('asetList', asetList.filter((a) => a.id !== id));
    }, [asetList, updateHarta]);

    const handleCurrency = (field) => (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        updateHarta(field, raw);
    };

    const displayCurrencyVal = (val) => {
        if (!val) return '';
        return Number(val).toLocaleString('id-ID');
    };

    return (
        <div className="card">
            <div className="card__title">Harta Peninggalan (Tirkah)</div>
            <p className="card__subtitle">
                Inventarisasi seluruh aset pewaris — tunai maupun non-tunai
            </p>

            {/* Jenis Kelamin Pewaris */}
            <div className="form-group">
                <label className="form-label">Jenis Kelamin Pewaris</label>
                <div className="radio-group">
                    <div className="radio-option">
                        <input
                            type="radio"
                            id="gender-lk"
                            name="gender"
                            value="lk"
                            checked={harta.jenisKelaminPewaris === 'lk'}
                            onChange={() => updateHarta('jenisKelaminPewaris', 'lk')}
                        />
                        <label htmlFor="gender-lk">Muarits Laki-laki</label>
                    </div>
                    <div className="radio-option">
                        <input
                            type="radio"
                            id="gender-pr"
                            name="gender"
                            value="pr"
                            checked={harta.jenisKelaminPewaris === 'pr'}
                            onChange={() => updateHarta('jenisKelaminPewaris', 'pr')}
                        />
                        <label htmlFor="gender-pr">Muarits Perempuan</label>
                    </div>
                </div>
            </div>

            {/* Separator */}
            <div className="section-divider">
                <span className="section-divider__label">📋 Daftar Aset Pewaris</span>
            </div>

            {/* Asset List */}
            <div className="asset-list">
                {asetList.map((aset, idx) => (
                    <AssetCard
                        key={aset.id}
                        aset={aset}
                        index={idx}
                        onUpdate={updateAset}
                        onRemove={removeAset}
                        totalAset={asetList.length}
                    />
                ))}
            </div>

            {/* Add Asset Button */}
            <button className="add-asset-btn" onClick={addAset} type="button">
                <span className="add-asset-btn__icon">+</span>
                <span className="add-asset-btn__text">Tambah Aset</span>
            </button>

            {/* Asset Summary */}
            {asetList.length > 0 && tirkah > 0 && (
                <div className="asset-summary">
                    <div className="asset-summary__title">Ringkasan Aset</div>
                    <div className="asset-summary__row">
                        <span>Total Nilai Bruto</span>
                        <span>{formatRupiah(Math.round(ringkasan.totalBruto))}</span>
                    </div>
                    <div className="asset-summary__row asset-summary__row--deduct">
                        <span>Total Pengurang (Hutang + Biaya)</span>
                        <span>− {formatRupiah(Math.round(ringkasan.totalPengurang))}</span>
                    </div>
                    <div className="asset-summary__row asset-summary__row--total">
                        <span>Total Tirkah dari Aset</span>
                        <span>{formatRupiah(Math.round(tirkah))}</span>
                    </div>
                </div>
            )}

            {/* Separator */}
            {asetList.length > 0 && (
                <div className="section-divider" style={{ marginTop: '16px' }}>
                    <span className="section-divider__label">💸 Kewajiban Pewaris</span>
                </div>
            )}

            {/* Hutang */}
            <div className="form-group">
                <label className="form-label">Hutang Pewaris (Umum)</label>
                <input
                    type="text"
                    className="form-input form-input--currency"
                    placeholder="0"
                    value={displayCurrencyVal(harta.hutang)}
                    onChange={handleCurrency('hutang')}
                    inputMode="numeric"
                    id="input-hutang"
                />
                <p className="form-hint">Hutang kepada Allah (zakat, kafarat) dan hutang kepada manusia yang tidak melekat pada aset tertentu</p>
            </div>

            {/* Wasiat */}
            <div className="form-group">
                <label className="form-label">Wasiat</label>
                <input
                    type="text"
                    className="form-input form-input--currency"
                    placeholder="0"
                    value={displayCurrencyVal(harta.wasiat)}
                    onChange={handleCurrency('wasiat')}
                    inputMode="numeric"
                    id="input-wasiat"
                />
                {wasiatMelebihi ? (
                    <p className="form-hint form-hint--warning">
                        ⚠️ Wasiat melebihi ⅓ tirkah (maks: {formatRupiah(Math.floor(maxWasiat))}). Akan dibatasi menjadi ⅓.
                    </p>
                ) : (
                    <p className="form-hint">Maksimal ⅓ dari total harta. Tidak boleh untuk ahli waris.</p>
                )}
            </div>

            {/* Tajhiz */}
            <div className="form-group">
                <label className="form-label">Tajhiz (Biaya Pemakaman)</label>
                <input
                    type="text"
                    className="form-input form-input--currency"
                    placeholder="0"
                    value={displayCurrencyVal(harta.tajhiz)}
                    onChange={handleCurrency('tajhiz')}
                    inputMode="numeric"
                    id="input-tajhiz"
                />
                <p className="form-hint">Biaya memandikan, mengkafani, menshalatkan, dan menguburkan</p>
            </div>

            {/* Al-Irts */}
            <div className="al-irts-box">
                <div>
                    <div className="al-irts-box__label">Al-Irts (Harta Bersih untuk Dibagikan)</div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Tirkah Aset − Hutang Umum − Wasiat − Tajhiz
                    </p>
                </div>
                <div className="al-irts-box__value">{formatRupiah(Math.round(alIrts))}</div>
            </div>

            <div className="btn-row">
                <button className="btn btn--primary" onClick={onNext} disabled={!canProceed}>
                    Lanjutkan
                </button>
            </div>
        </div>
    );
}

export default StepHartaAset;
