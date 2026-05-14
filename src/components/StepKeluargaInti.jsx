import { HEIR } from '../utils/warisData';
import NumberControl from './NumberControl';

function StepKeluargaInti({ harta, ahliWaris, updateAhliWaris, onNext, onBack }) {
    const isLk = harta.jenisKelaminPewaris === 'lk';

    return (
        <div className="card">
            <div className="card__title">
                Keluarga Inti
            </div>
            <p className="card__subtitle">Input data pasangan, anak, dan orang tua pewaris</p>

            {/* Pasangan */}
            <div className="heir-row">
                <div>
                    <div className="heir-row__label">{isLk ? 'Istri' : 'Suami'}</div>
                    <div className="heir-row__sub">
                        {isLk ? 'Jumlah istri sah' : 'Status suami'}
                    </div>
                </div>
                <NumberControl
                    value={ahliWaris[isLk ? HEIR.ISTRI : HEIR.SUAMI]}
                    onChange={(v) => updateAhliWaris(isLk ? HEIR.ISTRI : HEIR.SUAMI, v)}
                    min={0}
                    max={isLk ? 4 : 1}
                />
            </div>

            {/* Anak Laki-laki */}
            <div className="heir-row">
                <div>
                    <div className="heir-row__label">Anak Laki-laki</div>
                    <div className="heir-row__sub">Jumlah anak laki-laki kandung</div>
                </div>
                <NumberControl
                    value={ahliWaris[HEIR.ANAK_LK]}
                    onChange={(v) => updateAhliWaris(HEIR.ANAK_LK, v)}
                    min={0}
                    max={20}
                />
            </div>

            {/* Anak Perempuan */}
            <div className="heir-row">
                <div>
                    <div className="heir-row__label">Anak Perempuan</div>
                    <div className="heir-row__sub">Jumlah anak perempuan kandung</div>
                </div>
                <NumberControl
                    value={ahliWaris[HEIR.ANAK_PR]}
                    onChange={(v) => updateAhliWaris(HEIR.ANAK_PR, v)}
                    min={0}
                    max={20}
                />
            </div>

            {/* Ayah */}
            <div className="heir-row">
                <div>
                    <div className="heir-row__label">Ayah</div>
                    <div className="heir-row__sub">Status ayah pewaris</div>
                </div>
                <NumberControl
                    value={ahliWaris[HEIR.AYAH]}
                    onChange={(v) => updateAhliWaris(HEIR.AYAH, v)}
                    min={0}
                    max={1}
                />
            </div>

            {/* Ibu */}
            <div className="heir-row">
                <div>
                    <div className="heir-row__label">Ibu</div>
                    <div className="heir-row__sub">Status ibu pewaris</div>
                </div>
                <NumberControl
                    value={ahliWaris[HEIR.IBU]}
                    onChange={(v) => updateAhliWaris(HEIR.IBU, v)}
                    min={0}
                    max={1}
                />
            </div>

            <div className="btn-row">
                <button className="btn btn--secondary" onClick={onBack}>Kembali</button>
                <button className="btn btn--primary" onClick={onNext}>Lanjutkan</button>
            </div>
        </div>
    );
}

export default StepKeluargaInti;
