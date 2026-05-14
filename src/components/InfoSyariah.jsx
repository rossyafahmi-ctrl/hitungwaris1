import { useState } from 'react';
import { QURAN_VERSES, FARAIDH_INFO } from '../utils/warisData';

function Collapsible({ title, children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="collapsible">
            <button className="collapsible__trigger" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <span className={`collapsible__arrow ${isOpen ? 'collapsible__arrow--open' : ''}`}>▼</span>
            </button>
            <div className={`collapsible__content ${isOpen ? 'collapsible__content--open' : ''}`}>
                {children}
            </div>
        </div>
    );
}

function InfoSyariah() {
    const [activeTab, setActiveTab] = useState('ayat');

    return (
        <div style={{ marginTop: '24px' }}>
            <div className="card">
                <div className="card__title">
                    Dasar Faraidh
                </div>
                <p className="card__subtitle">{FARAIDH_INFO.pengertian}</p>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'ayat' ? 'tab--active' : ''}`}
                        onClick={() => setActiveTab('ayat')}
                    >
                        Dalil
                    </button>
                    <button
                        className={`tab ${activeTab === 'istilah' ? 'tab--active' : ''}`}
                        onClick={() => setActiveTab('istilah')}
                    >
                        Glosarium
                    </button>
                    <button
                        className={`tab ${activeTab === 'aturan' ? 'tab--active' : ''}`}
                        onClick={() => setActiveTab('aturan')}
                    >
                        Aturan
                    </button>
                </div>

                {/* Tab: Ayat Al-Quran */}
                {activeTab === 'ayat' && (
                    <div>
                        {QURAN_VERSES.map((verse) => (
                            <div key={verse.ayat} className="verse-card">
                                <div className="verse-card__header">
                                    <span className="verse-card__ref">
                                        QS {verse.surah}: {verse.ayat}
                                    </span>
                                    <span className="verse-card__topic">{verse.topik}</span>
                                </div>
                                <div className="verse-card__arab">{verse.arab}</div>
                                <div className="verse-card__translation">{verse.terjemahan}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Istilah */}
                {activeTab === 'istilah' && (
                    <div>
                        {FARAIDH_INFO.istilah.map((item) => (
                            <div key={item.term} className="info-term">
                                <span className="info-term__label">{item.term}</span>
                                <span className="info-term__def">{item.def}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Aturan */}
                {activeTab === 'aturan' && (
                    <div>
                        <Collapsible title="Dasar Hukum" defaultOpen={true}>
                            <ul className="info-panel__list">
                                {FARAIDH_INFO.dasar_hukum.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </Collapsible>

                        <Collapsible title="Syarat Waris">
                            <ul className="info-panel__list">
                                {FARAIDH_INFO.syarat_waris.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </Collapsible>

                        <Collapsible title="Urutan Kewajiban">
                            {FARAIDH_INFO.urutan_kewajiban.map((item) => (
                                <div key={item.no} className="info-term">
                                    <span className="info-term__label">{item.no}. {item.kewajiban}</span>
                                    <span className="info-term__def">{item.desc}</span>
                                </div>
                            ))}
                        </Collapsible>

                        <Collapsible title="Bagian Fardhu">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                                {FARAIDH_INFO.bagian_fardhu_desc}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {['½', '¼', '⅛', '⅔', '⅓', '⅙'].map((frac) => (
                                    <div key={frac} style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        background: 'var(--bg-input)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)',
                                        fontSize: '1.2rem',
                                        fontWeight: 700,
                                        color: 'var(--text-gold)',
                                    }}>
                                        {frac}
                                    </div>
                                ))}
                            </div>
                        </Collapsible>

                        <Collapsible title="Ashabah">
                            <div className="info-term">
                                <span className="info-term__label">Ashabah bi Nafsihi</span>
                                <span className="info-term__def">Ahli waris laki-laki yang menjadi ashabah karena dirinya sendiri (anak lk, cucu lk, ayah, kakek, saudara lk)</span>
                            </div>
                            <div className="info-term">
                                <span className="info-term__label">Ashabah bil Ghairi</span>
                                <span className="info-term__def">Perempuan jadi ashabah karena ada laki-laki setingkat. Contoh: anak perempuan + anak laki-laki → rasio 2:1</span>
                            </div>
                            <div className="info-term">
                                <span className="info-term__label">Ashabah ma'al Ghairi</span>
                                <span className="info-term__def">Saudara perempuan jadi ashabah bersama anak perempuan</span>
                            </div>
                        </Collapsible>

                        <Collapsible title="Hijab">
                            <div className="info-term">
                                <span className="info-term__label">Hijab Hirman</span>
                                <span className="info-term__def">Menggugurkan hak waris sepenuhnya. Contoh: cucu laki-laki terhalang oleh anak laki-laki</span>
                            </div>
                            <div className="info-term">
                                <span className="info-term__label">Hijab Nuqsan</span>
                                <span className="info-term__def">Mengurangi porsi warisan. Contoh: istri dari ¼ → ⅛ karena ada anak</span>
                            </div>
                        </Collapsible>

                        <Collapsible title="Kasus Khusus">
                            <div className="info-term">
                                <span className="info-term__label">Aul</span>
                                <span className="info-term__def">Total bagian fardhu melebihi 1 → semua bagian diproporsikan ke bawah</span>
                            </div>
                            <div className="info-term">
                                <span className="info-term__label">Radd</span>
                                <span className="info-term__def">Total bagian fardhu kurang dari 1, tidak ada ashabah → sisa dikembalikan proporsional (kecuali suami/istri)</span>
                            </div>
                            <div className="info-term">
                                <span className="info-term__label">Kalalah</span>
                                <span className="info-term__def">Pewaris meninggal tanpa anak dan tanpa ayah → saudara seibu mendapat bagian khusus (QS An-Nisa: 12, 176)</span>
                            </div>
                        </Collapsible>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InfoSyariah;
