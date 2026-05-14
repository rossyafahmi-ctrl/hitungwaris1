import { formatRupiah } from '../utils/warisEngine';

function StepHarta({ harta, updateHarta, onNext }) {
    const tirkah = Number(harta.tirkah) || 0;
    const hutang = Number(harta.hutang) || 0;
    const wasiat = Number(harta.wasiat) || 0;
    const tajhiz = Number(harta.tajhiz) || 0;
    const maxWasiat = tirkah / 3;
    const wasiatMelebihi = wasiat > maxWasiat && tirkah > 0;
    const alIrts = Math.max(0, tirkah - hutang - Math.min(wasiat, maxWasiat) - tajhiz);

    const canProceed = tirkah > 0 && alIrts > 0;

    const handleCurrency = (field) => (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        updateHarta(field, raw);
    };

    const displayCurrency = (val) => {
        if (!val) return '';
        return Number(val).toLocaleString('id-ID');
    };

    return (
        <div className="card">
            <div className="card__title">
                Jumlah Harta
            </div>
            <p className="card__subtitle">Masukkan data peninggalan dan kewajiban pewaris</p>

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

            {/* Tirkah */}
            <div className="form-group">
                <label className="form-label">
                    Tirkah (Total Harta Peninggalan) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                    type="text"
                    className="form-input form-input--currency"
                    placeholder="Contoh: 100.000.000"
                    value={displayCurrency(harta.tirkah)}
                    onChange={handleCurrency('tirkah')}
                    inputMode="numeric"
                    id="input-tirkah"
                />
                <p className="form-hint">Seluruh harta yang ditinggalkan pewaris (dalam Rupiah)</p>
            </div>

            {/* Hutang */}
            <div className="form-group">
                <label className="form-label">Hutang Pewaris</label>
                <input
                    type="text"
                    className="form-input form-input--currency"
                    placeholder="0"
                    value={displayCurrency(harta.hutang)}
                    onChange={handleCurrency('hutang')}
                    inputMode="numeric"
                    id="input-hutang"
                />
                <p className="form-hint">Hutang kepada Allah (zakat, kafarat) dan hutang kepada manusia</p>
            </div>

            {/* Wasiat */}
            <div className="form-group">
                <label className="form-label">Wasiat</label>
                <input
                    type="text"
                    className="form-input form-input--currency"
                    placeholder="0"
                    value={displayCurrency(harta.wasiat)}
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
                    value={displayCurrency(harta.tajhiz)}
                    onChange={handleCurrency('tajhiz')}
                    inputMode="numeric"
                    id="input-tajhiz"
                />
                <p className="form-hint">Biaya memandikan, mengkafani, menshalatkan, dan menguburkan</p>
            </div>

            {/* Al-Irts */}
            <div className="al-irts-box">
                <div>
                    <div className="al-irts-box__label">Al-Irts (Harta Bersih)</div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Tirkah − Hutang − Wasiat − Tajhiz
                    </p>
                </div>
                <div className="al-irts-box__value">{formatRupiah(alIrts)}</div>
            </div>

            <div className="btn-row">
                <button className="btn btn--primary" onClick={onNext} disabled={!canProceed}>
                    Lanjutkan
                </button>
            </div>
        </div>
    );
}

export default StepHarta;
