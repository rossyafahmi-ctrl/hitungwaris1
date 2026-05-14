// ============================================================
// warisEngine.js — Mesin Perhitungan Faraidh (Waris Islam)
// Versi STRICT: AUL/RADD/Ashabah/Multi-Istri sesuai hukum
// ============================================================
import { HEIR, HIJAB_RULES } from './warisData';

// ============================================================
// Helper: GCD & LCM
// ============================================================
function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
}

function lcm(a, b) {
    a = Math.round(a); b = Math.round(b);
    return (a / gcd(a, b)) * b;
}

function lcmArray(arr) {
    return arr.reduce((acc, val) => lcm(acc, val), 1);
}

// Simplify fraction
function simplify(num, den) {
    const g = gcd(num, den);
    return [num / g, den / g];
}

function fracLabel(num, den) {
    const [n, d] = simplify(num, den);
    if (d === 1) return `${n}`;
    return `${n}/${d}`;
}

// ============================================================
// 1. Hitung Harta Bersih (Al-Irts)
// ============================================================
export function hitungAlIrts(tirkah, hutang, wasiat, tajhiz) {
    const maxWasiat = tirkah / 3;
    const wasiatFinal = Math.min(wasiat, maxWasiat);
    const alIrts = tirkah - hutang - wasiatFinal - tajhiz;
    return {
        tirkah,
        hutang,
        wasiat: wasiatFinal,
        wasiatMelebihi: wasiat > maxWasiat,
        tajhiz,
        alIrts: Math.max(0, alIrts),
    };
}

// ============================================================
// 1b. Hitung Nilai Bersih per Aset
// ============================================================
export function hitungNilaiBersihAset(aset) {
    const nilaiEstimasi = Number(aset.nilaiEstimasi) || 0;
    const kepemilikan = (Number(aset.kepemilikan) || 0) / 100;
    const hutangMelekat = Number(aset.hutangMelekat) || 0;
    const biayaTransaksi = Number(aset.biayaTransaksi) || 0;
    const nilaiAppraisal = Number(aset.nilaiAppraisal) || 0;
    const nilaiBruto = nilaiEstimasi * kepemilikan;

    switch (aset.modeSettlement) {
        case 'jual': {
            const pengurang = hutangMelekat + biayaTransaksi;
            return { nilaiBruto, pengurang, nilaiBersih: Math.max(0, nilaiBruto - pengurang) };
        }
        case 'buyout': {
            const nilaiDasar = nilaiAppraisal > 0 ? nilaiAppraisal * kepemilikan : nilaiBruto;
            return { nilaiBruto: nilaiDasar, pengurang: hutangMelekat, nilaiBersih: Math.max(0, nilaiDasar - hutangMelekat) };
        }
        case 'bersama':
        default:
            return { nilaiBruto, pengurang: hutangMelekat, nilaiBersih: Math.max(0, nilaiBruto - hutangMelekat) };
    }
}

// ============================================================
// 1c. Hitung Ringkasan Seluruh Aset
// ============================================================
export function hitungRingkasanAset(daftarAset) {
    let totalBruto = 0, totalPengurang = 0, totalTirkah = 0;
    for (const aset of daftarAset) {
        const { nilaiBruto, pengurang, nilaiBersih } = hitungNilaiBersihAset(aset);
        totalBruto += nilaiBruto;
        totalPengurang += pengurang;
        totalTirkah += nilaiBersih;
    }
    return { totalBruto, totalPengurang, totalTirkah };
}

// ============================================================
// 2. Helper predicates
// ============================================================
function adaAnak(aw) { return (aw[HEIR.ANAK_LK] || 0) > 0 || (aw[HEIR.ANAK_PR] || 0) > 0; }
function adaAnakLk(aw) { return (aw[HEIR.ANAK_LK] || 0) > 0; }
function adaCucuLk(aw) { return (aw[HEIR.CUCU_LK] || 0) > 0; }
function adaFarWaris(aw) {
    return adaAnak(aw) || (aw[HEIR.CUCU_LK] || 0) > 0 || (aw[HEIR.CUCU_PR] || 0) > 0;
}
function jumlahSaudara(aw) {
    return (aw[HEIR.SDR_LK_KANDUNG] || 0) + (aw[HEIR.SDR_PR_KANDUNG] || 0) +
        (aw[HEIR.SDR_LK_SEAYAH] || 0) + (aw[HEIR.SDR_PR_SEAYAH] || 0) +
        (aw[HEIR.SDR_LK_SEIBU] || 0) + (aw[HEIR.SDR_PR_SEIBU] || 0);
}

// ============================================================
// 3. Terapkan Hijab
// ============================================================
export function terapkanHijab(ahliWaris) {
    const hasil = { ...ahliWaris };
    const hijabInfo = {};

    for (const [terhijab, penghalang] of Object.entries(HIJAB_RULES)) {
        if ((hasil[terhijab] || 0) > 0) {
            for (const p of penghalang) {
                if ((hasil[p] || 0) > 0) {
                    hijabInfo[terhijab] = p;
                    hasil[terhijab] = 0;
                    break;
                }
            }
        }
    }

    // Special: sdr pr seayah terhalang oleh 2+ sdr pr kandung (jika tidak ada anak lk)
    if ((hasil[HEIR.SDR_PR_SEAYAH] || 0) > 0 &&
        (ahliWaris[HEIR.SDR_PR_KANDUNG] || 0) >= 2 &&
        !adaAnakLk(ahliWaris)) {
        hijabInfo[HEIR.SDR_PR_SEAYAH] = HEIR.SDR_PR_KANDUNG;
        hasil[HEIR.SDR_PR_SEAYAH] = 0;
    }

    return { ahliWarisFiltered: hasil, hijabInfo };
}

// ============================================================
// 4. Tentukan Bagian (Fardhu & Ashabah)
// ============================================================
export function tentukanBagian(ahliWaris, jenisKelaminPewaris) {
    const { ahliWarisFiltered, hijabInfo } = terapkanHijab(ahliWaris);
    const aw = ahliWarisFiltered;

    const punya_anak_lk = adaAnakLk(aw);
    const punya_far_waris = adaFarWaris(aw);
    const punya_cucu_lk = adaCucuLk(aw);

    const jmlAnakLk = aw[HEIR.ANAK_LK] || 0;
    const jmlAnakPr = aw[HEIR.ANAK_PR] || 0;
    const jmlCucuLk = aw[HEIR.CUCU_LK] || 0;
    const jmlCucuPr = aw[HEIR.CUCU_PR] || 0;

    const bagian = [];

    // ---- SUAMI ----
    if (jenisKelaminPewaris === 'pr' && (aw[HEIR.SUAMI] || 0) > 0) {
        const [n, d] = punya_far_waris ? [1, 4] : [1, 2];
        bagian.push({
            kode: HEIR.SUAMI, label: 'Suami', jumlah: 1,
            fardhu: [n, d], jenis: 'fardhu',
            bagianFraksi: fracLabel(n, d),
            keterangan: punya_far_waris
                ? '¼ karena pewaris memiliki anak/cucu (QS An-Nisa: 12)'
                : '½ karena pewaris tidak memiliki anak/cucu (QS An-Nisa: 12)',
        });
    }

    // ---- ISTRI (dengan dukungan multi-istri) ----
    if (jenisKelaminPewaris === 'lk' && (aw[HEIR.ISTRI] || 0) > 0) {
        const jmlIstri = aw[HEIR.ISTRI];
        const [n, d] = punya_far_waris ? [1, 8] : [1, 4];
        const labelFraksi = jmlIstri === 1
            ? fracLabel(n, d)
            : `${fracLabel(n, d)} ÷ ${jmlIstri}`;
        bagian.push({
            kode: HEIR.ISTRI, label: jmlIstri > 1 ? `Istri (${jmlIstri} orang)` : 'Istri',
            jumlah: jmlIstri,
            fardhu: [n, d], jenis: 'fardhu',
            bagianFraksi: labelFraksi,
            isMultiIstri: jmlIstri > 1,
            keterangan: punya_far_waris
                ? `⅛ total dibagi rata ${jmlIstri} istri (QS An-Nisa: 12)`
                : `¼ total dibagi rata ${jmlIstri} istri (QS An-Nisa: 12)`,
        });
    }

    // ---- ANAK LAKI-LAKI & ANAK PEREMPUAN ----
    if (jmlAnakLk > 0 && jmlAnakPr > 0) {
        bagian.push({
            kode: HEIR.ANAK_LK, label: 'Anak Laki-laki', jumlah: jmlAnakLk,
            fardhu: null, jenis: 'ashabah_bil_ghairi',
            pasangan: HEIR.ANAK_PR, rasio: 2,
            bagianFraksi: 'sisa (2:1)',
            keterangan: `Ashabah bil ghairi, rasio 2:1 dengan anak perempuan. لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ (QS An-Nisa: 11)`,
        });
        bagian.push({
            kode: HEIR.ANAK_PR, label: 'Anak Perempuan', jumlah: jmlAnakPr,
            fardhu: null, jenis: 'ashabah_bil_ghairi',
            pasangan: HEIR.ANAK_LK, rasio: 1,
            bagianFraksi: 'sisa (1:2)',
            keterangan: `Ashabah bil ghairi, rasio 1:2 dengan anak laki-laki. لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ (QS An-Nisa: 11)`,
        });
    } else if (jmlAnakLk > 0) {
        bagian.push({
            kode: HEIR.ANAK_LK, label: 'Anak Laki-laki', jumlah: jmlAnakLk,
            fardhu: null, jenis: 'ashabah',
            bagianFraksi: 'sisa',
            keterangan: 'Ashabah bi nafsihi — menerima seluruh sisa harta (QS An-Nisa: 11)',
        });
    } else if (jmlAnakPr > 0) {
        if (jmlAnakPr === 1) {
            bagian.push({
                kode: HEIR.ANAK_PR, label: 'Anak Perempuan', jumlah: 1,
                fardhu: [1, 2], jenis: 'fardhu', bagianFraksi: '1/2',
                keterangan: '½ karena anak perempuan tunggal tanpa anak laki-laki (QS An-Nisa: 11)',
            });
        } else {
            bagian.push({
                kode: HEIR.ANAK_PR, label: 'Anak Perempuan', jumlah: jmlAnakPr,
                fardhu: [2, 3], jenis: 'fardhu', bagianFraksi: '2/3',
                keterangan: `⅔ dibagi ${jmlAnakPr} orang karena ≥2 anak perempuan tanpa anak laki-laki (QS An-Nisa: 11)`,
            });
        }
    }

    // ---- CUCU LAKI-LAKI & CUCU PEREMPUAN ----
    if (jmlCucuLk > 0 && jmlCucuPr > 0) {
        bagian.push({
            kode: HEIR.CUCU_LK, label: 'Cucu Laki-laki', jumlah: jmlCucuLk,
            fardhu: null, jenis: 'ashabah_bil_ghairi',
            pasangan: HEIR.CUCU_PR, rasio: 2, bagianFraksi: 'sisa (2:1)',
            keterangan: 'Ashabah bil ghairi dengan cucu perempuan, rasio 2:1',
        });
        bagian.push({
            kode: HEIR.CUCU_PR, label: 'Cucu Perempuan', jumlah: jmlCucuPr,
            fardhu: null, jenis: 'ashabah_bil_ghairi',
            pasangan: HEIR.CUCU_LK, rasio: 1, bagianFraksi: 'sisa (1:2)',
            keterangan: 'Ashabah bil ghairi dengan cucu laki-laki, rasio 1:2',
        });
    } else if (jmlCucuLk > 0) {
        bagian.push({
            kode: HEIR.CUCU_LK, label: 'Cucu Laki-laki', jumlah: jmlCucuLk,
            fardhu: null, jenis: 'ashabah', bagianFraksi: 'sisa',
            keterangan: 'Ashabah bi nafsihi — menggantikan posisi anak laki-laki',
        });
    } else if (jmlCucuPr > 0) {
        if (jmlAnakPr === 1) {
            bagian.push({
                kode: HEIR.CUCU_PR, label: 'Cucu Perempuan', jumlah: jmlCucuPr,
                fardhu: [1, 6], jenis: 'fardhu', bagianFraksi: '1/6',
                keterangan: '⅙ sebagai penyempurna ⅔ karena sudah ada 1 anak perempuan',
            });
        } else if (jmlAnakPr === 0) {
            if (jmlCucuPr === 1) {
                bagian.push({
                    kode: HEIR.CUCU_PR, label: 'Cucu Perempuan', jumlah: 1,
                    fardhu: [1, 2], jenis: 'fardhu', bagianFraksi: '1/2',
                    keterangan: '½ karena cucu perempuan tunggal tanpa cucu/anak laki-laki',
                });
            } else {
                bagian.push({
                    kode: HEIR.CUCU_PR, label: 'Cucu Perempuan', jumlah: jmlCucuPr,
                    fardhu: [2, 3], jenis: 'fardhu', bagianFraksi: '2/3',
                    keterangan: '⅔ dibagi rata karena ≥2 cucu perempuan tanpa cucu/anak laki-laki',
                });
            }
        }
    }

    // ---- AYAH ----
    if ((aw[HEIR.AYAH] || 0) > 0) {
        if (punya_anak_lk || punya_cucu_lk) {
            bagian.push({
                kode: HEIR.AYAH, label: 'Ayah', jumlah: 1,
                fardhu: [1, 6], jenis: 'fardhu', bagianFraksi: '1/6',
                keterangan: '⅙ karena ada anak/cucu laki-laki (QS An-Nisa: 11)',
            });
        } else if (jmlAnakPr > 0 || jmlCucuPr > 0) {
            bagian.push({
                kode: HEIR.AYAH, label: 'Ayah', jumlah: 1,
                fardhu: [1, 6], jenis: 'fardhu_plus_ashabah', bagianFraksi: '1/6 + sisa',
                keterangan: '⅙ fardhu + sisa (ashabah) karena hanya ada anak/cucu perempuan (QS An-Nisa: 11)',
            });
        } else {
            bagian.push({
                kode: HEIR.AYAH, label: 'Ayah', jumlah: 1,
                fardhu: null, jenis: 'ashabah', bagianFraksi: 'sisa',
                keterangan: 'Ashabah bi nafsihi — menerima seluruh sisa karena tidak ada anak/cucu (QS An-Nisa: 11)',
            });
        }
    }

    // ---- IBU ----
    if ((aw[HEIR.IBU] || 0) > 0) {
        if (punya_far_waris || jumlahSaudara(aw) >= 2) {
            bagian.push({
                kode: HEIR.IBU, label: 'Ibu', jumlah: 1,
                fardhu: [1, 6], jenis: 'fardhu', bagianFraksi: '1/6',
                keterangan: '⅙ karena ada anak/cucu atau ≥2 saudara (QS An-Nisa: 11)',
            });
        } else {
            const adaPasangan = (jenisKelaminPewaris === 'pr' && (aw[HEIR.SUAMI] || 0) > 0) ||
                (jenisKelaminPewaris === 'lk' && (aw[HEIR.ISTRI] || 0) > 0);
            const adaAyahAw = (aw[HEIR.AYAH] || 0) > 0;
            if (adaPasangan && adaAyahAw) {
                bagian.push({
                    kode: HEIR.IBU, label: 'Ibu', jumlah: 1,
                    fardhu: [1, 3], jenis: 'fardhu_umariyah', bagianFraksi: '1/3 sisa',
                    keterangan: '⅓ dari sisa setelah pasangan (Masalah Umariyah) (QS An-Nisa: 11)',
                });
            } else {
                bagian.push({
                    kode: HEIR.IBU, label: 'Ibu', jumlah: 1,
                    fardhu: [1, 3], jenis: 'fardhu', bagianFraksi: '1/3',
                    keterangan: '⅓ karena tidak ada anak/cucu dan saudara < 2 (QS An-Nisa: 11)',
                });
            }
        }
    }

    // ---- KAKEK ----
    if ((aw[HEIR.KAKEK] || 0) > 0) {
        if (punya_anak_lk || punya_cucu_lk) {
            bagian.push({
                kode: HEIR.KAKEK, label: 'Kakek', jumlah: 1,
                fardhu: [1, 6], jenis: 'fardhu', bagianFraksi: '1/6',
                keterangan: '⅙ seperti ayah karena ada anak/cucu laki-laki',
            });
        } else if (jmlAnakPr > 0 || jmlCucuPr > 0) {
            bagian.push({
                kode: HEIR.KAKEK, label: 'Kakek', jumlah: 1,
                fardhu: [1, 6], jenis: 'fardhu_plus_ashabah', bagianFraksi: '1/6 + sisa',
                keterangan: '⅙ + sisa (ashabah) — seperti ayah, ada anak/cucu perempuan saja',
            });
        } else {
            bagian.push({
                kode: HEIR.KAKEK, label: 'Kakek', jumlah: 1,
                fardhu: null, jenis: 'ashabah', bagianFraksi: 'sisa',
                keterangan: 'Ashabah bi nafsihi seperti ayah — tidak ada anak/cucu',
            });
        }
    }

    // ---- NENEK ----
    if ((aw[HEIR.NENEK] || 0) > 0) {
        bagian.push({
            kode: HEIR.NENEK, label: 'Nenek', jumlah: 1,
            fardhu: [1, 6], jenis: 'fardhu', bagianFraksi: '1/6',
            keterangan: '⅙ sesuai hadits Nabi SAW',
        });
    }

    // ---- SAUDARA KANDUNG ----
    const jmlSdrLkKandung = aw[HEIR.SDR_LK_KANDUNG] || 0;
    const jmlSdrPrKandung = aw[HEIR.SDR_PR_KANDUNG] || 0;

    if (jmlSdrLkKandung > 0 && jmlSdrPrKandung > 0) {
        bagian.push({
            kode: HEIR.SDR_LK_KANDUNG, label: 'Saudara Laki-laki Kandung', jumlah: jmlSdrLkKandung,
            fardhu: null, jenis: 'ashabah_bil_ghairi',
            pasangan: HEIR.SDR_PR_KANDUNG, rasio: 2, bagianFraksi: 'sisa (2:1)',
            keterangan: 'Ashabah bil ghairi dengan saudara perempuan kandung, rasio 2:1 (QS An-Nisa: 176)',
        });
        bagian.push({
            kode: HEIR.SDR_PR_KANDUNG, label: 'Saudara Perempuan Kandung', jumlah: jmlSdrPrKandung,
            fardhu: null, jenis: 'ashabah_bil_ghairi',
            pasangan: HEIR.SDR_LK_KANDUNG, rasio: 1, bagianFraksi: 'sisa (1:2)',
            keterangan: 'Ashabah bil ghairi dengan saudara laki-laki kandung, rasio 1:2 (QS An-Nisa: 176)',
        });
    } else if (jmlSdrLkKandung > 0) {
        bagian.push({
            kode: HEIR.SDR_LK_KANDUNG, label: 'Saudara Laki-laki Kandung', jumlah: jmlSdrLkKandung,
            fardhu: null, jenis: 'ashabah', bagianFraksi: 'sisa',
            keterangan: 'Ashabah bi nafsihi (QS An-Nisa: 176)',
        });
    } else if (jmlSdrPrKandung > 0) {
        if (jmlAnakPr > 0 || jmlCucuPr > 0) {
            bagian.push({
                kode: HEIR.SDR_PR_KANDUNG, label: 'Saudara Perempuan Kandung', jumlah: jmlSdrPrKandung,
                fardhu: null, jenis: 'ashabah_maal_ghairi', bagianFraksi: 'sisa',
                keterangan: "Ashabah ma'al ghairi — menjadi ashabah bersama anak/cucu perempuan",
            });
        } else if (jmlSdrPrKandung === 1) {
            bagian.push({
                kode: HEIR.SDR_PR_KANDUNG, label: 'Saudara Perempuan Kandung', jumlah: 1,
                fardhu: [1, 2], jenis: 'fardhu', bagianFraksi: '1/2',
                keterangan: '½ karena saudara perempuan kandung tunggal (QS An-Nisa: 176)',
            });
        } else {
            bagian.push({
                kode: HEIR.SDR_PR_KANDUNG, label: 'Saudara Perempuan Kandung', jumlah: jmlSdrPrKandung,
                fardhu: [2, 3], jenis: 'fardhu', bagianFraksi: '2/3',
                keterangan: '⅔ dibagi rata karena ≥2 saudara perempuan kandung (QS An-Nisa: 176)',
            });
        }
    }

    // ---- SAUDARA SEAYAH ----
    const jmlSdrLkSeayah = aw[HEIR.SDR_LK_SEAYAH] || 0;
    const jmlSdrPrSeayah = aw[HEIR.SDR_PR_SEAYAH] || 0;

    if (jmlSdrLkSeayah > 0 && jmlSdrPrSeayah > 0) {
        bagian.push({
            kode: HEIR.SDR_LK_SEAYAH, label: 'Saudara Laki-laki Seayah', jumlah: jmlSdrLkSeayah,
            fardhu: null, jenis: 'ashabah_bil_ghairi',
            pasangan: HEIR.SDR_PR_SEAYAH, rasio: 2, bagianFraksi: 'sisa (2:1)',
            keterangan: 'Ashabah bil ghairi dengan saudara perempuan seayah, rasio 2:1',
        });
        bagian.push({
            kode: HEIR.SDR_PR_SEAYAH, label: 'Saudara Perempuan Seayah', jumlah: jmlSdrPrSeayah,
            fardhu: null, jenis: 'ashabah_bil_ghairi',
            pasangan: HEIR.SDR_LK_SEAYAH, rasio: 1, bagianFraksi: 'sisa (1:2)',
            keterangan: 'Ashabah bil ghairi dengan saudara laki-laki seayah, rasio 1:2',
        });
    } else if (jmlSdrLkSeayah > 0) {
        bagian.push({
            kode: HEIR.SDR_LK_SEAYAH, label: 'Saudara Laki-laki Seayah', jumlah: jmlSdrLkSeayah,
            fardhu: null, jenis: 'ashabah', bagianFraksi: 'sisa',
            keterangan: 'Ashabah bi nafsihi',
        });
    } else if (jmlSdrPrSeayah > 0) {
        if (jmlAnakPr > 0 || jmlCucuPr > 0) {
            bagian.push({
                kode: HEIR.SDR_PR_SEAYAH, label: 'Saudara Perempuan Seayah', jumlah: jmlSdrPrSeayah,
                fardhu: null, jenis: 'ashabah_maal_ghairi', bagianFraksi: 'sisa',
                keterangan: "Ashabah ma'al ghairi bersama anak/cucu perempuan",
            });
        } else if (jmlSdrPrKandung === 1) {
            bagian.push({
                kode: HEIR.SDR_PR_SEAYAH, label: 'Saudara Perempuan Seayah', jumlah: jmlSdrPrSeayah,
                fardhu: [1, 6], jenis: 'fardhu', bagianFraksi: '1/6',
                keterangan: '⅙ sebagai penyempurna ⅔ (sudah ada 1 saudara perempuan kandung)',
            });
        } else if (jmlSdrPrKandung === 0) {
            if (jmlSdrPrSeayah === 1) {
                bagian.push({
                    kode: HEIR.SDR_PR_SEAYAH, label: 'Saudara Perempuan Seayah', jumlah: 1,
                    fardhu: [1, 2], jenis: 'fardhu', bagianFraksi: '1/2',
                    keterangan: '½ karena saudara perempuan seayah tunggal',
                });
            } else {
                bagian.push({
                    kode: HEIR.SDR_PR_SEAYAH, label: 'Saudara Perempuan Seayah', jumlah: jmlSdrPrSeayah,
                    fardhu: [2, 3], jenis: 'fardhu', bagianFraksi: '2/3',
                    keterangan: '⅔ dibagi rata karena ≥2 saudara perempuan seayah',
                });
            }
        }
    }

    // ---- SAUDARA SEIBU ----
    const jmlSdrSeibu = (aw[HEIR.SDR_LK_SEIBU] || 0) + (aw[HEIR.SDR_PR_SEIBU] || 0);
    if (jmlSdrSeibu > 0) {
        if (jmlSdrSeibu === 1) {
            const kode = (aw[HEIR.SDR_LK_SEIBU] || 0) > 0 ? HEIR.SDR_LK_SEIBU : HEIR.SDR_PR_SEIBU;
            const lbl = kode === HEIR.SDR_LK_SEIBU ? 'Saudara Laki-laki Seibu' : 'Saudara Perempuan Seibu';
            bagian.push({
                kode, label: lbl, jumlah: 1,
                fardhu: [1, 6], jenis: 'fardhu', bagianFraksi: '1/6',
                keterangan: '⅙ karena saudara seibu tunggal (QS An-Nisa: 12)',
            });
        } else {
            if ((aw[HEIR.SDR_LK_SEIBU] || 0) > 0) {
                bagian.push({
                    kode: HEIR.SDR_LK_SEIBU, label: 'Saudara Laki-laki Seibu',
                    jumlah: aw[HEIR.SDR_LK_SEIBU],
                    fardhu: [1, 3], jenis: 'fardhu_bersama',
                    totalBersama: jmlSdrSeibu, bagianFraksi: '1/3',
                    keterangan: '⅓ total dibagi rata semua saudara seibu, laki-laki = perempuan (QS An-Nisa: 12)',
                });
            }
            if ((aw[HEIR.SDR_PR_SEIBU] || 0) > 0) {
                bagian.push({
                    kode: HEIR.SDR_PR_SEIBU, label: 'Saudara Perempuan Seibu',
                    jumlah: aw[HEIR.SDR_PR_SEIBU],
                    fardhu: [1, 3], jenis: 'fardhu_bersama',
                    totalBersama: jmlSdrSeibu, bagianFraksi: '1/3',
                    keterangan: '⅓ total dibagi rata semua saudara seibu, laki-laki = perempuan (QS An-Nisa: 12)',
                });
            }
        }
    }

    // ---- ASHABAH JAUH (jika tidak ada yang menghalangi) ----
    const ASHABAH_JAUH = [
        { kode: HEIR.ANAK_LK_SDR_KANDUNG, label: 'Anak Lk Sdr Kandung (Keponakan)' },
        { kode: HEIR.ANAK_LK_SDR_SEAYAH, label: 'Anak Lk Sdr Seayah (Keponakan)' },
        { kode: HEIR.PAMAN_KANDUNG, label: 'Paman Kandung (dr Ayah)' },
        { kode: HEIR.PAMAN_SEAYAH, label: 'Paman Seayah (dr Ayah)' },
        { kode: HEIR.SEPUPU_LK_KANDUNG, label: 'Anak Lk Paman Kandung (Sepupu)' },
        { kode: HEIR.SEPUPU_LK_SEAYAH, label: 'Anak Lk Paman Seayah (Sepupu)' },
    ];
    for (const { kode, label } of ASHABAH_JAUH) {
        const jumlah = aw[kode] || 0;
        if (jumlah > 0) {
            bagian.push({
                kode, label, jumlah,
                fardhu: null, jenis: 'ashabah', bagianFraksi: 'sisa',
                keterangan: `Ashabah bi nafsihi — menerima seluruh sisa harta`,
            });
        }
    }

    return { bagian, hijabInfo, ahliWarisFiltered: aw };
}

// ============================================================
// 5. Hitung Distribusi Akhir (STRICT)
// ============================================================
export function hitungDistribusi(alIrts, bagianList) {
    if (!bagianList || bagianList.length === 0) {
        return { hasil: [], asalMasalah: null, kasus: 'tidak_ada_ahli_waris' };
    }

    // Separate by type
    const fardhuItems = bagianList.filter(b =>
        b.jenis === 'fardhu' || b.jenis === 'fardhu_bersama' ||
        b.jenis === 'fardhu_umariyah' || b.jenis === 'fardhu_plus_ashabah'
    );
    const ashabahItems = bagianList.filter(b =>
        b.jenis === 'ashabah' || b.jenis === 'ashabah_bil_ghairi' ||
        b.jenis === 'ashabah_maal_ghairi' || b.jenis === 'fardhu_plus_ashabah'
    );

    // ---- CASE: All Ashabah, no fardhu ----
    if (fardhuItems.length === 0 && ashabahItems.length > 0) {
        return distributeAshabah(alIrts, ashabahItems, null, 'ashabah_murni');
    }

    // ---- Calculate Asal Masalah from fardhu fractions ----
    const penyebut = [];
    for (const b of fardhuItems) {
        if (b.fardhu && b.jenis !== 'fardhu_umariyah') {
            penyebut.push(b.fardhu[1]);
        }
    }
    const asalMasalah = penyebut.length > 0 ? lcmArray(penyebut) : 1;

    // ---- Compute fardhu saham ----
    let totalFardhuSaham = 0;
    const fardhuComputed = [];

    for (const b of fardhuItems) {
        if (b.jenis === 'fardhu_umariyah') continue; // handled separately

        if (b.fardhu && b.jenis !== 'fardhu_plus_ashabah') {
            const saham = (b.fardhu[0] * asalMasalah) / b.fardhu[1];
            fardhuComputed.push({ ...b, saham });
            totalFardhuSaham += saham;
        } else if (b.jenis === 'fardhu_plus_ashabah') {
            const saham = (b.fardhu[0] * asalMasalah) / b.fardhu[1];
            fardhuComputed.push({ ...b, saham, sahamFardhu: saham });
            totalFardhuSaham += saham;
        }
    }

    // ---- CHECK AUL: fardhu fractions sum > 1 (strict check before ashabah) ----
    const pureAshabah = ashabahItems.filter(b =>
        b.jenis === 'ashabah' || b.jenis === 'ashabah_bil_ghairi' || b.jenis === 'ashabah_maal_ghairi'
    );
    const isAul = totalFardhuSaham > asalMasalah + 0.01 && pureAshabah.length === 0;

    const hasil = [];

    // ---- Handle Umariyah separately ----
    const umariyahItem = fardhuItems.find(b => b.jenis === 'fardhu_umariyah');

    for (const b of fardhuComputed) {
        if (b.jenis === 'fardhu_bersama') {
            const sahamTotal = b.saham;
            const totalBagianKelompok = (sahamTotal / (isAul ? totalFardhuSaham : asalMasalah)) * alIrts;
            const bagianKelompokIni = (b.jumlah / b.totalBersama) * totalBagianKelompok;
            hasil.push({
                ...b,
                bagianFraksi: `${fracLabel(b.fardhu[0], b.fardhu[1])} ÷ ${b.totalBersama}`,
                totalBagian: Math.round(bagianKelompokIni),
                perOrang: Math.round(bagianKelompokIni / b.jumlah),
                isAul,
            });
        } else if (b.jenis === 'fardhu_plus_ashabah') {
            // record fardhu portion only; ashabah sisa handled later
            hasil.push({ ...b, _placeholder: true });
        } else {
            const bagianTotal = (b.saham / (isAul ? totalFardhuSaham : asalMasalah)) * alIrts;
            // Multi-istri: split per person
            const perOrang = Math.round(bagianTotal / b.jumlah);
            hasil.push({
                ...b,
                totalBagian: Math.round(bagianTotal),
                perOrang,
                isAul,
                bagianFraksi: b.isMultiIstri
                    ? `${b.bagianFraksi} = Rp${perOrang.toLocaleString('id-ID')}/orang`
                    : b.bagianFraksi,
            });
        }
    }

    // ---- Handle Umariyah ----
    if (umariyahItem) {
        const pasanganHasil = hasil.find(h => h.kode === HEIR.SUAMI || h.kode === HEIR.ISTRI);
        const sisaSetelahPasangan = alIrts - (pasanganHasil ? pasanganHasil.totalBagian : 0);
        const bagianIbu = Math.round(sisaSetelahPasangan / 3);
        hasil.push({
            ...umariyahItem,
            totalBagian: bagianIbu,
            perOrang: bagianIbu,
        });
    }

    if (isAul) {
        // Remove fardhu_plus_ashabah placeholders (not applicable in AUL)
        const filteredHasil = hasil.filter(h => !h._placeholder);
        const totalAul = filteredHasil.reduce((s, h) => s + (h.totalBagian || 0), 0);
        return {
            hasil: filteredHasil.map(h => ({
                ...h,
                bagianFraksi: `${h.bagianFraksi} (Aul)`,
            })),
            asalMasalah,
            kasus: 'aul',
            totalFardhuSaham,
        };
    }

    // ---- Distribute sisa to ashabah ----
    const totalFardhuNominal = hasil
        .filter(h => !h._placeholder)
        .reduce((s, h) => s + (h.totalBagian || 0), 0);
    const sisaHarta = alIrts - totalFardhuNominal;

    // Remove placeholders; we'll add them back with correct amounts
    const hasilClean = hasil.filter(h => !h._placeholder);
    const fardhuPlusAshabahList = fardhuComputed.filter(b => b.jenis === 'fardhu_plus_ashabah');

    if (pureAshabah.length > 0 && sisaHarta > 0) {
        // Give sisa to pure ashabah groupings
        const ashabahGroups = distributeAshabah(sisaHarta, pureAshabah, asalMasalah, null);
        for (const item of ashabahGroups.hasil) {
            hasilClean.push(item);
        }
        // fardhu_plus_ashabah gets only its fardhu portion
        for (const b of fardhuPlusAshabahList) {
            const bagianTotal = (b.sahamFardhu / asalMasalah) * alIrts;
            hasilClean.push({ ...b, totalBagian: Math.round(bagianTotal), perOrang: Math.round(bagianTotal), bagianFraksi: b.bagianFraksi.replace(' + sisa', ' (fardhu)') });
        }
    } else if (fardhuPlusAshabahList.length > 0 && sisaHarta > 0) {
        // fardhu_plus_ashabah gets its fardhu + all sisa
        for (const b of fardhuPlusAshabahList) {
            const bagianFardhu = (b.sahamFardhu / asalMasalah) * alIrts;
            const totalBagian = bagianFardhu + sisaHarta;
            hasilClean.push({ ...b, totalBagian: Math.round(totalBagian), perOrang: Math.round(totalBagian) });
        }
    } else if (sisaHarta > 1 && pureAshabah.length === 0 && fardhuPlusAshabahList.length === 0) {
        // RADD — return sisa to fardhu heirs (except suami/istri)
        const raddHasil = hasilClean.filter(h => h.kode !== HEIR.SUAMI && h.kode !== HEIR.ISTRI);
        const totalRadd = raddHasil.reduce((s, h) => s + (h.totalBagian || 0), 0);
        if (totalRadd > 0) {
            for (const h of raddHasil) {
                const tambahan = Math.round((h.totalBagian / totalRadd) * sisaHarta);
                h.totalBagian += tambahan;
                h.perOrang = Math.round(h.totalBagian / h.jumlah);
                h.bagianFraksi = h.bagianFraksi + ' + Radd';
                h.isRadd = true;
            }
        }
        return { hasil: hasilClean, asalMasalah, kasus: 'radd' };
    } else {
        // fardhu_plus_ashabah gets only fardhu (no sisa left)
        for (const b of fardhuPlusAshabahList) {
            const bagianTotal = (b.sahamFardhu / asalMasalah) * alIrts;
            hasilClean.push({ ...b, totalBagian: Math.round(bagianTotal), perOrang: Math.round(bagianTotal), bagianFraksi: b.bagianFraksi.replace(' + sisa', '') });
        }
    }

    return { hasil: hasilClean, asalMasalah, kasus: 'normal' };
}

// ============================================================
// Helper: distribute sisa to ashabah group
// ============================================================
function distributeAshabah(totalSisa, ashabahItems, asalMasalah, kasusOverride) {
    const hasil = [];
    const bilGhairiGroups = {};

    for (const b of ashabahItems) {
        if (b.jenis === 'ashabah_bil_ghairi') {
            const groupKey = [b.kode, b.pasangan].sort().join('_');
            if (!bilGhairiGroups[groupKey]) bilGhairiGroups[groupKey] = [];
            bilGhairiGroups[groupKey].push(b);
        }
    }

    const nonBilGhairi = ashabahItems.filter(b => b.jenis !== 'ashabah_bil_ghairi');

    if (Object.keys(bilGhairiGroups).length > 0) {
        for (const group of Object.values(bilGhairiGroups)) {
            const totalParts = group.reduce((s, b) => s + b.jumlah * b.rasio, 0);
            for (const b of group) {
                const bagianTotal = (b.jumlah * b.rasio / totalParts) * totalSisa;
                const perOrang = bagianTotal / b.jumlah;
                hasil.push({
                    ...b,
                    bagianFraksi: b.bagianFraksi || `sisa (${b.rasio === 2 ? '2:1' : '1:2'})`,
                    totalBagian: Math.round(bagianTotal),
                    perOrang: Math.round(perOrang),
                });
            }
        }
    }

    if (nonBilGhairi.length > 0) {
        const totalParts = nonBilGhairi.reduce((s, b) => s + b.jumlah, 0);
        for (const b of nonBilGhairi) {
            const bagianTotal = (b.jumlah / totalParts) * totalSisa;
            hasil.push({
                ...b,
                bagianFraksi: b.bagianFraksi || 'sisa',
                totalBagian: Math.round(bagianTotal),
                perOrang: Math.round(bagianTotal / b.jumlah),
            });
        }
    }

    return { hasil, asalMasalah, kasus: kasusOverride || 'normal' };
}

// ============================================================
// 6. Main Entry Point
// ============================================================
export function hitungWaris(inputData) {
    const { tirkah, hutang, wasiat, tajhiz, jenisKelaminPewaris, ahliWaris } = inputData;

    const hartaBersih = hitungAlIrts(tirkah, hutang, wasiat, tajhiz);

    if (hartaBersih.alIrts <= 0) {
        return {
            hartaBersih,
            bagian: [],
            distribusi: { hasil: [], asalMasalah: null, kasus: 'tidak_ada_harta' },
            hijabInfo: {},
        };
    }

    const { bagian, hijabInfo, ahliWarisFiltered } = tentukanBagian(ahliWaris, jenisKelaminPewaris);
    const distribusi = hitungDistribusi(hartaBersih.alIrts, bagian);

    return {
        hartaBersih,
        bagian,
        distribusi,
        hijabInfo,
        ahliWarisFiltered,
    };
}
