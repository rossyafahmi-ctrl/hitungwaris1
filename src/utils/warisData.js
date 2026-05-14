// ============================================================
// warisData.js — Konstanta & Data Referensi Ilmu Faraidh
// ============================================================

// Kode ahli waris
export const HEIR = {
  SUAMI: 'suami',
  ISTRI: 'istri',
  ANAK_LK: 'anak_lk',
  ANAK_PR: 'anak_pr',
  CUCU_LK: 'cucu_lk',       // cucu dari anak laki-laki
  CUCU_PR: 'cucu_pr',       // cucu perempuan dari anak laki-laki
  AYAH: 'ayah',
  IBU: 'ibu',
  KAKEK: 'kakek',
  NENEK: 'nenek',
  SDR_LK_KANDUNG: 'sdr_lk_kandung',
  SDR_PR_KANDUNG: 'sdr_pr_kandung',
  SDR_LK_SEAYAH: 'sdr_lk_seayah',
  SDR_PR_SEAYAH: 'sdr_pr_seayah',
  SDR_LK_SEIBU: 'sdr_lk_seibu',
  SDR_PR_SEIBU: 'sdr_pr_seibu',
  // Distant Male Heirs (Ashabah)
  ANAK_LK_SDR_KANDUNG: 'anak_lk_sdr_kandung',
  ANAK_LK_SDR_SEAYAH: 'anak_lk_sdr_seayah',
  PAMAN_KANDUNG: 'paman_kandung',
  PAMAN_SEAYAH: 'paman_seayah',
  SEPUPU_LK_KANDUNG: 'sepupu_lk_kandung',
  SEPUPU_LK_SEAYAH: 'sepupu_lk_seayah',
};

// Label & kategori ahli waris
export const HEIR_INFO = {
  [HEIR.SUAMI]: { label: 'Suami', kategori: 'pasangan', gender: 'lk' },
  [HEIR.ISTRI]: { label: 'Istri', kategori: 'pasangan', gender: 'pr', max: 4 },
  [HEIR.ANAK_LK]: { label: 'Anak Laki-laki', kategori: 'anak', gender: 'lk' },
  [HEIR.ANAK_PR]: { label: 'Anak Perempuan', kategori: 'anak', gender: 'pr' },
  [HEIR.CUCU_LK]: { label: 'Cucu Laki-laki (dari anak lk)', kategori: 'cucu', gender: 'lk' },
  [HEIR.CUCU_PR]: { label: 'Cucu Perempuan (dari anak lk)', kategori: 'cucu', gender: 'pr' },
  [HEIR.AYAH]: { label: 'Ayah', kategori: 'orangtua', gender: 'lk' },
  [HEIR.IBU]: { label: 'Ibu', kategori: 'orangtua', gender: 'pr' },
  [HEIR.KAKEK]: { label: 'Kakek (dari pihak ayah)', kategori: 'kakek_nenek', gender: 'lk' },
  [HEIR.NENEK]: { label: 'Nenek', kategori: 'kakek_nenek', gender: 'pr' },
  [HEIR.SDR_LK_KANDUNG]: { label: 'Saudara Laki-laki Kandung', kategori: 'saudara_kandung', gender: 'lk' },
  [HEIR.SDR_PR_KANDUNG]: { label: 'Saudara Perempuan Kandung', kategori: 'saudara_kandung', gender: 'pr' },
  [HEIR.SDR_LK_SEAYAH]: { label: 'Saudara Laki-laki Seayah', kategori: 'saudara_seayah', gender: 'lk' },
  [HEIR.SDR_PR_SEAYAH]: { label: 'Saudara Perempuan Seayah', kategori: 'saudara_seayah', gender: 'pr' },
  [HEIR.SDR_LK_SEIBU]: { label: 'Saudara Laki-laki Seibu', kategori: 'saudara_seibu', gender: 'lk' },
  [HEIR.SDR_PR_SEIBU]: { label: 'Saudara Perempuan Seibu', kategori: 'saudara_seibu', gender: 'pr' },
  [HEIR.ANAK_LK_SDR_KANDUNG]: { label: 'Anak Lk Sdr Kandung (Keponakan)', kategori: 'ashabah_jauh', gender: 'lk' },
  [HEIR.ANAK_LK_SDR_SEAYAH]: { label: 'Anak Lk Sdr Seayah (Keponakan)', kategori: 'ashabah_jauh', gender: 'lk' },
  [HEIR.PAMAN_KANDUNG]: { label: 'Paman Kandung (dr Ayah)', kategori: 'ashabah_jauh', gender: 'lk' },
  [HEIR.PAMAN_SEAYAH]: { label: 'Paman Seayah (dr Ayah)', kategori: 'ashabah_jauh', gender: 'lk' },
  [HEIR.SEPUPU_LK_KANDUNG]: { label: 'Anak Lk Paman Kandung (Sepupu)', kategori: 'ashabah_jauh', gender: 'lk' },
  [HEIR.SEPUPU_LK_SEAYAH]: { label: 'Anak Lk Paman Seayah (Sepupu)', kategori: 'ashabah_jauh', gender: 'lk' },
};

// ============================================================
// Aturan Hijab Hirman (menggugurkan hak waris sepenuhnya)
// key = ahli waris yang terhijab
// value = array ahli waris yang menghalangi
// ============================================================
export const HIJAB_RULES = {
  [HEIR.CUCU_LK]: [HEIR.ANAK_LK],
  [HEIR.CUCU_PR]: [HEIR.ANAK_LK],
  [HEIR.KAKEK]: [HEIR.AYAH],
  [HEIR.NENEK]: [HEIR.IBU],
  [HEIR.SDR_LK_KANDUNG]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH],
  [HEIR.SDR_PR_KANDUNG]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH],
  [HEIR.SDR_LK_SEAYAH]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH, HEIR.SDR_LK_KANDUNG],
  [HEIR.SDR_PR_SEAYAH]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH, HEIR.SDR_LK_KANDUNG, HEIR.SDR_PR_KANDUNG],
  [HEIR.SDR_LK_SEIBU]: [HEIR.ANAK_LK, HEIR.ANAK_PR, HEIR.CUCU_LK, HEIR.CUCU_PR, HEIR.AYAH, HEIR.KAKEK],
  [HEIR.SDR_PR_SEIBU]: [HEIR.ANAK_LK, HEIR.ANAK_PR, HEIR.CUCU_LK, HEIR.CUCU_PR, HEIR.AYAH, HEIR.KAKEK],
  [HEIR.ANAK_LK_SDR_KANDUNG]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH, HEIR.KAKEK, HEIR.SDR_LK_KANDUNG, HEIR.SDR_LK_SEAYAH],
  [HEIR.ANAK_LK_SDR_SEAYAH]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH, HEIR.KAKEK, HEIR.SDR_LK_KANDUNG, HEIR.SDR_LK_SEAYAH, HEIR.ANAK_LK_SDR_KANDUNG],
  [HEIR.PAMAN_KANDUNG]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH, HEIR.KAKEK, HEIR.SDR_LK_KANDUNG, HEIR.SDR_LK_SEAYAH, HEIR.ANAK_LK_SDR_KANDUNG, HEIR.ANAK_LK_SDR_SEAYAH],
  [HEIR.PAMAN_SEAYAH]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH, HEIR.KAKEK, HEIR.SDR_LK_KANDUNG, HEIR.SDR_LK_SEAYAH, HEIR.ANAK_LK_SDR_KANDUNG, HEIR.ANAK_LK_SDR_SEAYAH, HEIR.PAMAN_KANDUNG],
  [HEIR.SEPUPU_LK_KANDUNG]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH, HEIR.KAKEK, HEIR.SDR_LK_KANDUNG, HEIR.SDR_LK_SEAYAH, HEIR.ANAK_LK_SDR_KANDUNG, HEIR.ANAK_LK_SDR_SEAYAH, HEIR.PAMAN_KANDUNG, HEIR.PAMAN_SEAYAH],
  [HEIR.SEPUPU_LK_SEAYAH]: [HEIR.ANAK_LK, HEIR.CUCU_LK, HEIR.AYAH, HEIR.KAKEK, HEIR.SDR_LK_KANDUNG, HEIR.SDR_LK_SEAYAH, HEIR.ANAK_LK_SDR_KANDUNG, HEIR.ANAK_LK_SDR_SEAYAH, HEIR.PAMAN_KANDUNG, HEIR.PAMAN_SEAYAH, HEIR.SEPUPU_LK_KANDUNG],
};

// ============================================================
// Langkah-langkah wizard (untuk UI)
// ============================================================
export const WIZARD_STEPS = [
  {
    id: 'harta',
    title: 'Jumlah Harta',
    subtitle: 'Masukkan data harta pewaris',
    icon: '💰',
  },
  {
    id: 'keluarga_inti',
    title: 'Keluarga Inti',
    subtitle: 'Pasangan, anak, dan orang tua',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'cucu',
    title: 'Cucu',
    subtitle: 'Cucu dari anak laki-laki',
    icon: '👶',
  },
  {
    id: 'kakek_nenek',
    title: 'Kakek & Nenek',
    subtitle: 'Orang tua dari orang tua',
    icon: '👴',
  },
  {
    id: 'saudara_kandung',
    title: 'Saudara Kandung',
    subtitle: 'Saudara sekandung pewaris',
    icon: '👫',
  },
  {
    id: 'saudara_seayah',
    title: 'Saudara Seayah',
    subtitle: 'Saudara seayah pewaris',
    icon: '🤝',
  },
  {
    id: 'saudara_seibu',
    title: 'Saudara Seibu',
    subtitle: 'Saudara seibu pewaris',
    icon: '🫂',
  },
  {
    id: 'hasil',
    title: 'Hasil Perhitungan',
    subtitle: 'Distribusi warisan',
    icon: '📊',
  },
];

// ============================================================
// Ayat-ayat Al-Quran Dasar Hukum Waris
// ============================================================
export const QURAN_VERSES = [
  {
    surah: 'An-Nisa',
    ayat: 7,
    arab: 'لِّلرِّجَالِ نَصِيبٌ مِّمَّا تَرَكَ الْوَالِدَانِ وَالْأَقْرَبُونَ وَلِلنِّسَاءِ نَصِيبٌ مِّمَّا تَرَكَ الْوَالِدَانِ وَالْأَقْرَبُونَ مِمَّا قَلَّ مِنْهُ أَوْ كَثُرَ ۚ نَصِيبًا مَّفْرُوضًا',
    terjemahan: 'Bagi orang laki-laki ada hak bagian dari harta peninggalan ibu-bapa dan kerabatnya, dan bagi orang wanita ada hak bagian (pula) dari harta peninggalan ibu-bapa dan kerabatnya, baik sedikit atau banyak menurut bahagian yang telah ditetapkan.',
    topik: 'Hak waris bagi laki-laki dan perempuan',
  },
  {
    surah: 'An-Nisa',
    ayat: 11,
    arab: 'يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ ۚ فَإِن كُنَّ نِسَاءً فَوْقَ اثْنَتَيْنِ فَلَهُنَّ ثُلُثَا مَا تَرَكَ ۖ وَإِن كَانَتْ وَاحِدَةً فَلَهَا النِّصْفُ ۚ وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُ وَلَدٌ ۚ فَإِن لَّمْ يَكُن لَّهُ وَلَدٌ وَوَرِثَهُ أَبَوَاهُ فَلِأُمِّهِ الثُّلُثُ ۚ فَإِن كَانَ لَهُ إِخْوَةٌ فَلِأُمِّهِ السُّدُسُ ۚ مِن بَعْدِ وَصِيَّةٍ يُوصِي بِهَا أَوْ دَيْنٍ',
    terjemahan: 'Allah mensyari\'atkan bagimu tentang (pembagian pusaka untuk) anak-anakmu. Yaitu: bahagian seorang anak lelaki sama dengan bahagian dua orang anak perempuan; dan jika anak itu semuanya perempuan lebih dari dua, maka bagi mereka dua pertiga dari harta yang ditinggalkan; jika anak perempuan itu seorang saja, maka ia memperoleh separo harta. Dan untuk dua orang ibu-bapa, bagi masing-masingnya seperenam dari harta yang ditinggalkan, jika yang meninggal itu mempunyai anak; jika orang yang meninggal tidak mempunyai anak dan ia diwarisi oleh ibu-bapanya (saja), maka ibunya mendapat sepertiga; jika yang meninggal itu mempunyai beberapa saudara, maka ibunya mendapat seperenam. (Pembagian-pembagian tersebut di atas) sesudah dipenuhi wasiat yang ia buat atau (dan) sesudah dibayar hutangnya.',
    topik: 'Bagian anak, ayah, dan ibu',
  },
  {
    surah: 'An-Nisa',
    ayat: 12,
    arab: 'وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ ۚ فَإِن كَانَ لَهُنَّ وَلَدٌ فَلَكُمُ الرُّبُعُ مِمَّا تَرَكْنَ ۚ مِن بَعْدِ وَصِيَّةٍ يُوصِينَ بِهَا أَوْ دَيْنٍ ۚ وَلَهُنَّ الرُّبُعُ مِمَّا تَرَكْتُمْ إِن لَّمْ يَكُن لَّكُمْ وَلَدٌ ۚ فَإِن كَانَ لَكُمْ وَلَدٌ فَلَهُنَّ الثُّمُنُ مِمَّا تَرَكْتُم ۚ مِّن بَعْدِ وَصِيَّةٍ تُوصُونَ بِهَا أَوْ دَيْنٍ',
    terjemahan: 'Dan bagimu (suami-suami) seperdua dari harta yang ditinggalkan oleh isteri-isterimu, jika mereka tidak mempunyai anak. Jika isteri-isterimu itu mempunyai anak, maka kamu mendapat seperempat dari harta yang ditinggalkannya sesudah dipenuhi wasiat yang mereka buat atau (dan) sesudah dibayar hutangnya. Para isteri memperoleh seperempat harta yang kamu tinggalkan jika kamu tidak mempunyai anak. Jika kamu mempunyai anak, maka para isteri memperoleh seperdelapan dari harta yang kamu tinggalkan sesudah dipenuhi wasiat yang kamu buat atau (dan) sesudah dibayar hutang-hutangmu.',
    topik: 'Bagian suami, istri, dan saudara seibu',
  },
  {
    surah: 'An-Nisa',
    ayat: 176,
    arab: 'يَسْتَفْتُونَكَ قُلِ اللَّهُ يُفْتِيكُمْ فِي الْكَلَالَةِ ۚ إِنِ امْرُؤٌ هَلَكَ لَيْسَ لَهُ وَلَدٌ وَلَهُ أُخْتٌ فَلَهَا نِصْفُ مَا تَرَكَ ۚ وَهُوَ يَرِثُهَا إِن لَّمْ يَكُن لَّهَا وَلَدٌ ۚ فَإِن كَانَتَا اثْنَتَيْنِ فَلَهُمَا الثُّلُثَانِ مِمَّا تَرَكَ ۚ وَإِن كَانُوا إِخْوَةً رِّجَالًا وَنِسَاءً فَلِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ',
    terjemahan: 'Mereka meminta fatwa kepadamu (tentang kalalah). Katakanlah: "Allah memberi fatwa kepadamu tentang kalalah (yaitu): jika seorang meninggal dunia, dan ia tidak mempunyai anak dan mempunyai saudara perempuan, maka bagi saudaranya yang perempuan itu seperdua dari harta yang ditinggalkannya, dan saudaranya yang laki-laki mempusakai (seluruh harta saudara perempuan), jika ia tidak mempunyai anak; tetapi jika saudara perempuan itu dua orang, maka bagi keduanya dua pertiga dari harta yang ditinggalkan oleh yang meninggal. Dan jika mereka (ahli waris itu terdiri dari) saudara-saudara laki dan perempuan, maka bahagian seorang saudara laki-laki sebanyak bahagian dua orang saudara perempuan.',
    topik: 'Bagian saudara (kalalah)',
  },
];

// ============================================================
// Informasi lengkap tentang ilmu faraidh
// ============================================================
export const FARAIDH_INFO = {
  title: 'Ilmu Faraidh (Ilmu Waris Islam)',
  pengertian: 'Ilmu Faraidh adalah ilmu yang mempelajari tentang pembagian harta warisan berdasarkan syariat Islam. Kata "faraidh" berasal dari bahasa Arab "faridhah" yang berarti kewajiban atau ketentuan. Ilmu ini mengatur siapa saja yang berhak menerima warisan, berapa bagian masing-masing, dan bagaimana tata cara pembagiannya.',
  dasar_hukum: [
    'Al-Quran: Surat An-Nisa ayat 7, 11, 12, dan 176',
    'Hadits Nabi: "Belajarlah ilmu faraidh dan ajarkanlah ia kepada orang lain, karena sesungguhnya ia adalah setengah ilmu dan ia akan dilupakan, dan ia adalah ilmu pertama yang dicabut dari umatku." (HR. Ibnu Majah & Daruquthni)',
    'Ijma\' Ulama: Kesepakatan para ulama tentang hukum-hukum waris',
    'Ijtihad: Pendapat para ulama untuk kasus-kasus yang tidak disebutkan secara eksplisit',
  ],
  istilah: [
    { term: 'Pewaris (Muwarrits)', def: 'Orang yang meninggal dunia dan meninggalkan harta' },
    { term: 'Ahli Waris (Warits)', def: 'Orang yang berhak menerima harta warisan' },
    { term: 'Harta Warisan (Tirkah)', def: 'Seluruh harta peninggalan pewaris sebelum dipotong kewajiban' },
    { term: 'Al-Irts', def: 'Harta warisan bersih setelah dipotong hutang, wasiat, dan biaya pemakaman' },
    { term: 'Fardhu (Furudh)', def: 'Bagian warisan yang telah ditetapkan secara pasti dalam Al-Quran' },
    { term: 'Ashabul Furudh', def: 'Ahli waris yang mendapat bagian tetap (fardhu)' },
    { term: 'Ashabah', def: 'Ahli waris yang menerima sisa harta setelah ashabul furudh mengambil bagiannya' },
    { term: 'Hijab', def: 'Penghalangan hak waris karena adanya ahli waris yang lebih dekat' },
    { term: 'Asal Masalah', def: 'KPK (Kelipatan Persekutuan Terkecil) dari penyebut bagian-bagian fardhu' },
    { term: 'Aul', def: 'Kondisi ketika total bagian fardhu melebihi 1, sehingga semua bagian diproporsikan ke bawah' },
    { term: 'Radd', def: 'Kondisi ketika total bagian fardhu kurang dari 1 dan tidak ada ashabah, sisa dikembalikan proporsional' },
    { term: 'Kalalah', def: 'Pewaris yang meninggal tanpa anak dan tanpa ayah' },
    { term: 'Tajhiz', def: 'Biaya pengurusan jenazah dan pemakaman yang dipotong dari harta' },
    { term: 'Wasiat', def: 'Pesan terakhir pewaris tentang pemberian harta, maksimal 1/3 dari total harta' },
  ],
  syarat_waris: [
    'Pewaris benar-benar telah meninggal dunia',
    'Ahli waris benar-benar hidup saat pewaris meninggal',
    'Diketahui hubungan ahli waris dengan pewaris (nasab, nikah, wala\')',
    'Tidak ada penghalang pewarisan (pembunuhan, perbedaan agama)',
  ],
  urutan_kewajiban: [
    { no: 1, kewajiban: 'Biaya pengurusan jenazah (Tajhiz)', desc: 'Biaya memandikan, mengkafani, menshalatkan, dan menguburkan' },
    { no: 2, kewajiban: 'Melunasi hutang pewaris', desc: 'Hutang kepada Allah (zakat, kafarat) dan hutang kepada manusia' },
    { no: 3, kewajiban: 'Menunaikan wasiat', desc: 'Maksimal 1/3 dari harta, tidak boleh untuk ahli waris' },
    { no: 4, kewajiban: 'Membagi warisan', desc: 'Sisa harta dibagikan kepada ahli waris sesuai ketentuan' },
  ],
  bagian_fardhu_desc: 'Dalam ilmu faraidh, terdapat 6 (enam) macam bagian yang telah ditetapkan: ½ (setengah), ¼ (seperempat), ⅛ (seperdelapan), ⅔ (dua pertiga), ⅓ (sepertiga), dan ⅙ (seperenam).',
};

// ============================================================
// Kategori Aset untuk Modul Harta Peninggalan
// ============================================================
export const ASSET_CATEGORIES = [
  { value: 'tunai', label: 'Tunai', icon: '💵' },
  { value: 'properti', label: 'Properti', icon: '🏠' },
  { value: 'emas', label: 'Emas/Logam', icon: '🪙' },
  { value: 'saham', label: 'Saham/Reksadana', icon: '📈' },
  { value: 'kendaraan', label: 'Kendaraan', icon: '🚗' },
  { value: 'bisnis', label: 'Bisnis', icon: '🏢' },
  { value: 'piutang', label: 'Piutang', icon: '📋' },
  { value: 'lainnya', label: 'Lainnya', icon: '📦' },
];

// ============================================================
// Mode Penyelesaian Aset
// ============================================================
export const SETTLEMENT_MODES = [
  { value: 'jual', label: 'Jual jadi tunai', icon: '💰', desc: 'Aset dijual kemudian hasilnya dibagi tunai' },
  { value: 'buyout', label: 'Buyout / Kompensasi', icon: '🤝', desc: 'Aset diberikan ke ahli waris tertentu, yang lain dikompensasi' },
  { value: 'bersama', label: 'Milik bersama', icon: '👥', desc: 'Aset dimiliki bersama sesuai porsi faraidh' },
];

// ============================================================
// Factory Function: Buat Aset Kosong
// ============================================================
let _assetIdCounter = 0;
export function createEmptyAsset() {
  _assetIdCounter += 1;
  return {
    id: `aset_${Date.now()}_${_assetIdCounter}`,
    nama: '',
    kategori: 'tunai',
    nilaiEstimasi: '',
    kepemilikan: 100,
    hartaBersama: false,
    hutangMelekat: '',
    modeSettlement: 'jual',
    biayaTransaksi: '',
    nilaiAppraisal: '',
    expanded: true,
  };
}
