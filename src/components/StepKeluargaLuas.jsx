import { HEIR, HEIR_INFO, HIJAB_RULES } from '../utils/warisData';
import NumberControl from './NumberControl';

// Mapping step ID to heir codes
const STEP_HEIRS = {
    cucu: [HEIR.CUCU_LK, HEIR.CUCU_PR],
    kakek_nenek: [HEIR.KAKEK, HEIR.NENEK],
    saudara_kandung: [HEIR.SDR_LK_KANDUNG, HEIR.SDR_PR_KANDUNG],
    saudara_seayah: [HEIR.SDR_LK_SEAYAH, HEIR.SDR_PR_SEAYAH],
    saudara_seibu: [HEIR.SDR_LK_SEIBU, HEIR.SDR_PR_SEIBU],
};

const HIJAB_LABELS = {
    [HEIR.ANAK_LK]: 'Anak Laki-laki',
    [HEIR.ANAK_PR]: 'Anak Perempuan',
    [HEIR.CUCU_LK]: 'Cucu Laki-laki',
    [HEIR.CUCU_PR]: 'Cucu Perempuan',
    [HEIR.AYAH]: 'Ayah',
    [HEIR.IBU]: 'Ibu',
    [HEIR.KAKEK]: 'Kakek',
    [HEIR.SDR_LK_KANDUNG]: 'Saudara Laki-laki Kandung',
    [HEIR.SDR_PR_KANDUNG]: 'Saudara Perempuan Kandung',
};

function StepKeluargaLuas({ stepId, stepInfo, ahliWaris, updateAhliWaris, onNext, onBack }) {
    const heirCodes = STEP_HEIRS[stepId] || [];

    // Check which heirs in this step are blocked by hijab
    const hijabStatus = {};
    for (const code of heirCodes) {
        const rules = HIJAB_RULES[code];
        if (rules) {
            for (const blocker of rules) {
                if ((ahliWaris[blocker] || 0) > 0) {
                    hijabStatus[code] = blocker;
                    break;
                }
            }
        }
    }

    // Special: saudara perempuan seayah blocked by 2+ saudara perempuan kandung
    if (stepId === 'saudara_seayah' && (ahliWaris[HEIR.SDR_PR_KANDUNG] || 0) >= 2) {
        hijabStatus[HEIR.SDR_PR_SEAYAH] = HEIR.SDR_PR_KANDUNG;
    }

    const allBlocked = heirCodes.every(code => hijabStatus[code]);

    return (
        <div className="card">
            <div className="card__title">
                {stepInfo.title}
            </div>
            <p className="card__subtitle">{stepInfo.subtitle}</p>

            {allBlocked && (
                <div className="hijab-badge">
                    <div>
                        <strong>Terhalang (Hijab Hirman)</strong>
                        <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                            Semua ahli waris di langkah ini terhalang oleh ahli waris yang lebih dekat.
                            Bagian ini otomatis dilewati.
                        </p>
                    </div>
                </div>
            )}

            {heirCodes.map((code) => {
                const info = HEIR_INFO[code];
                const isBlocked = !!hijabStatus[code];
                const blockerLabel = isBlocked ? HIJAB_LABELS[hijabStatus[code]] || hijabStatus[code] : '';
                const maxVal = code === HEIR.KAKEK || code === HEIR.NENEK ? 1 : 20;

                return (
                    <div key={code} style={{ opacity: isBlocked ? 0.4 : 1 }}>
                        {isBlocked && (
                            <div className="hijab-badge">
                                <span>Terhalang oleh <strong>{blockerLabel}</strong></span>
                            </div>
                        )}
                        <div className="heir-row">
                            <div>
                                <div className="heir-row__label">
                                    {info.gender === 'lk' ? '👨' : '👩'} {info.label}
                                </div>
                                {isBlocked && (
                                    <div className="heir-row__sub" style={{ color: 'var(--danger)' }}>
                                        Tidak mendapat warisan
                                    </div>
                                )}
                            </div>
                            {!isBlocked && (
                                <NumberControl
                                    value={ahliWaris[code]}
                                    onChange={(v) => updateAhliWaris(code, v)}
                                    min={0}
                                    max={maxVal}
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            <div className="btn-row">
                <button className="btn btn--secondary" onClick={onBack}>Kembali</button>
                <button className="btn btn--primary" onClick={onNext}>
                    {allBlocked ? 'Lewati' : 'Lanjutkan'}
                </button>
            </div>
        </div>
    );
}

export default StepKeluargaLuas;
