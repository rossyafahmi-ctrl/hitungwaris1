import React, { useState, useMemo, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { hitungWaris } from './utils/warisEngine';
import { HEIR, HEIR_INFO } from './utils/warisData';
import logoBekalMuslim from './assets/logo-bekal-muslim.png';
import logoHitungWaris from './assets/logo-hitung-waris.png';

const INITIAL_HEIRS = {
  [HEIR.SUAMI]: 0,
  [HEIR.ISTRI]: 0,
  [HEIR.ANAK_LK]: 0,
  [HEIR.ANAK_PR]: 0,
  [HEIR.AYAH]: 0, 
  [HEIR.IBU]: 0, 
  [HEIR.CUCU_LK]: 0,
  [HEIR.CUCU_PR]: 0,
  [HEIR.KAKEK]: 0,
  NENEK_AYAH: 0,
  NENEK_IBU: 0,
  [HEIR.SDR_LK_KANDUNG]: 0,
  [HEIR.SDR_PR_KANDUNG]: 0,
  [HEIR.SDR_LK_SEAYAH]: 0,
  [HEIR.SDR_PR_SEAYAH]: 0,
  [HEIR.SDR_LK_SEIBU]: 0,
  [HEIR.SDR_PR_SEIBU]: 0,
  [HEIR.ANAK_LK_SDR_KANDUNG]: 0,
  [HEIR.ANAK_LK_SDR_SEAYAH]: 0,
  [HEIR.PAMAN_KANDUNG]: 0,
  [HEIR.PAMAN_SEAYAH]: 0,
  [HEIR.SEPUPU_LK_KANDUNG]: 0,
  [HEIR.SEPUPU_LK_SEAYAH]: 0,
};

function App() {
  const getSessionData = () => {
    try {
      const data = sessionStorage.getItem('waris_session_data');
      return data ? JSON.parse(data) : null;
    } catch(e) {
      return null;
    }
  };

  const getNavStack = () => {
    try {
      return JSON.parse(sessionStorage.getItem('waris_nav_stack') || '[]');
    } catch(e) {
      return [];
    }
  };

  const setNavStack = (st) => {
    try {
      sessionStorage.setItem('waris_nav_stack', JSON.stringify(st));
    } catch(e) {}
  };

  const [step, setStep] = useState(() => {
    const s = getSessionData();
    return s?.step !== undefined ? s.step : 0;
  }); // 0: Landing, 1-3: Inputs, 4: Result, 5: Detail
  const [viewHistory, setViewHistory] = useState(() => {
    const s = getSessionData();
    return s?.viewHistory !== undefined ? s.viewHistory : false;
  });
  const [openedFromHistory, setOpenedFromHistory] = useState(() => {
    const s = getSessionData();
    return s?.openedFromHistory !== undefined ? s.openedFromHistory : false;
  });
  const printRef = useRef(null);
  
  // Data Pewaris & Harta States
  const [gender, setGender] = useState(() => {
    const s = getSessionData();
    return s?.gender || 'lk';
  }); 
  const [totalAssets, setTotalAssets] = useState(() => {
    const s = getSessionData();
    return s?.totalAssets !== undefined ? s.totalAssets : '';
  });
  const [debt, setDebt] = useState(() => {
    const s = getSessionData();
    return s?.debt !== undefined ? s.debt : '0';
  });
  const [will, setWill] = useState(() => {
    const s = getSessionData();
    return s?.will !== undefined ? s.will : '0';
  });
  const [funeral, setFuneral] = useState(() => {
    const s = getSessionData();
    return s?.funeral !== undefined ? s.funeral : '0';
  });
  const [showAssetDetail, setShowAssetDetail] = useState(() => {
    const s = getSessionData();
    return s?.showAssetDetail !== undefined ? s.showAssetDetail : false;
  });
  const [assetItems, setAssetItems] = useState(() => {
    const s = getSessionData();
    return s?.assetItems || [{ id: 1, name: '', value: '' }];
  });
  const [errors, setErrors] = useState({});

  // Heir States
  const [heirs, setHeirs] = useState(() => {
    const s = getSessionData();
    return s?.heirs || { ...INITIAL_HEIRS };
  });

  const [activeSection, setActiveSection] = useState(null);
  const [calculationResult, setCalculationResult] = useState(() => {
    const s = getSessionData();
    return s?.calculationResult || null;
  });
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  
  // Info Popup State
  const [activeInfoPopup, setActiveInfoPopup] = useState(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('bekalmuslim_current_user')) || null);

  useEffect(() => {
    if (currentUser) {
      const sessionData = {
        step,
        viewHistory,
        openedFromHistory,
        gender,
        totalAssets,
        debt,
        will,
        funeral,
        showAssetDetail,
        assetItems,
        heirs,
        calculationResult
      };
      try {
        sessionStorage.setItem('waris_session_data', JSON.stringify(sessionData));
      } catch(e) {}
    }
  }, [step, viewHistory, openedFromHistory, gender, totalAssets, debt, will, funeral, showAssetDetail, assetItems, heirs, calculationResult, currentUser]);

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ step, viewHistory, openedFromHistory }, '', '');
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        setStep(event.state.step !== undefined ? event.state.step : 0);
        setViewHistory(event.state.viewHistory !== undefined ? event.state.viewHistory : false);
        setOpenedFromHistory(event.state.openedFromHistory !== undefined ? event.state.openedFromHistory : false);
      } else {
        setStep(0);
        setViewHistory(false);
        setOpenedFromHistory(false);
      }
      const stack = getNavStack();
      if (stack.length > 0) {
        stack.pop();
        setNavStack(stack);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleBack = (targetStep, targetViewHistory = false, targetOpenedFromHistory = false) => {
    setErrors({});
    const stack = getNavStack();
    if (stack.length > 0 && window.history.state && window.history.length > 1) {
      stack.pop();
      setNavStack(stack);
      window.history.back();
    } else {
      window.history.pushState({ step: targetStep, viewHistory: targetViewHistory, openedFromHistory: targetOpenedFromHistory }, '', '');
      setStep(targetStep);
      setViewHistory(targetViewHistory);
      setOpenedFromHistory(targetOpenedFromHistory);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenHistory = () => {
    const stack = getNavStack();
    stack.push({ step, viewHistory, openedFromHistory });
    setNavStack(stack);
    window.history.pushState({ step: 0, viewHistory: true, openedFromHistory: false }, '', '');
    setViewHistory(true);
  };
  const [authPage, setAuthPage] = useState('login'); 
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const getHistoryKey = () => `waris_history_${currentUser?.email || 'default'}`;

  // Load history on mount and when viewHistory changes or currentUser changes
  useEffect(() => {
    if (currentUser) {
      const history = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
      setHistoryItems(history);
    }
  }, [viewHistory, currentUser]);

  // Auto-sum detailed assets to Total Assets
  useEffect(() => {
    if (showAssetDetail) {
      const sum = assetItems.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
      setTotalAssets(sum > 0 ? sum.toString() : '0');
    }
  }, [assetItems, showAssetDetail]);

  const updateHeirCount = (key, delta) => {
    setHeirs(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  };

  const toggleHeir = (key) => {
    setHeirs(prev => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1
    }));
  };

  const resetData = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data? Semua input akan direset.")) {
      setGender('lk');
      setTotalAssets('');
      setDebt('0');
      setWill('0');
      setFuneral('0');
      setAssetItems([{ id: 1, name: '', value: '' }]);
      setHeirs({ ...INITIAL_HEIRS });
      setCalculationResult(null);
      try {
        sessionStorage.removeItem('waris_session_data');
        sessionStorage.removeItem('waris_nav_stack');
      } catch(e) {}
      const stack = getNavStack();
      stack.push({ step, viewHistory, openedFromHistory });
      setNavStack(stack);
      window.history.pushState({ step: 1, viewHistory: false, openedFromHistory: false }, '', '');
      setStep(1);
      setErrors({});
    }
  };

  const leftoverForWasiat = (Number(totalAssets) || 0) - (Number(debt) || 0) - (Number(funeral) || 0);
  const maxWasiatAllowed = leftoverForWasiat > 0 ? leftoverForWasiat / 3 : 0;
  const isWasiatValid = (Number(will) || 0) <= maxWasiatAllowed;
  const netAssets = leftoverForWasiat - (isWasiatValid ? (Number(will) || 0) : maxWasiatAllowed);

  const performCalculation = () => {
    const passedHeirs = { ...heirs };
    passedHeirs[HEIR.NENEK] = (passedHeirs.NENEK_AYAH || 0) + (passedHeirs.NENEK_IBU || 0);
    delete passedHeirs.NENEK_AYAH;
    delete passedHeirs.NENEK_IBU;

    const inputData = {
      tirkah: Number(totalAssets) || 0,
      hutang: Number(debt) || 0,
      wasiat: Math.min(Number(will) || 0, maxWasiatAllowed),
      tajhiz: Number(funeral) || 0,
      jenisKelaminPewaris: gender,
      ahliWaris: passedHeirs,
    };
    
    const result = hitungWaris(inputData);
    setCalculationResult(result);
    const stack = getNavStack();
    stack.push({ step, viewHistory, openedFromHistory });
    setNavStack(stack);
    window.history.pushState({ step: 4, viewHistory: false, openedFromHistory: false }, '', '');
    setStep(4);
  };

  const navigate = (to) => {
    if (to > step && step < 4) {
      const currentErrors = {};
      if (step === 1) {
        if (!gender) currentErrors.gender = true;
        if (totalAssets === '') currentErrors.totalAssets = true;
        if (debt === '') currentErrors.debt = true;
        if (will === '') currentErrors.will = true;
        if (funeral === '') currentErrors.funeral = true;
      }
      if (Object.keys(currentErrors).length > 0) {
        setErrors(currentErrors);
        return;
      }
    }
    setErrors({});
    const stack = getNavStack();
    stack.push({ step, viewHistory, openedFromHistory });
    setNavStack(stack);
    window.history.pushState({ step: to, viewHistory: false, openedFromHistory: false }, '', '');
    setStep(to);
    setOpenedFromHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authForm.email || !authForm.password) {
      setAuthError('Email dan password wajib diisi');
      return;
    }

    // Hardcoded special user
    if (authForm.email === 'rossyafahmi@gmail.com' && authForm.password === 'zxcvbn') {
      const specialUser = { id: 'user_special_1', name: 'Rossya Fahmi', email: 'rossyafahmi@gmail.com' };
      localStorage.setItem('bekalmuslim_current_user', JSON.stringify(specialUser));
      setCurrentUser(specialUser);
      return;
    }

    if (authForm.email === 'user' && authForm.password === 'zxcvbn') {
      const specialUser2 = { id: 'user_special_2', name: 'User', email: 'user' };
      localStorage.setItem('bekalmuslim_current_user', JSON.stringify(specialUser2));
      setCurrentUser(specialUser2);
      return;
    }

    const users = JSON.parse(localStorage.getItem('bekalmuslim_users') || '[]');
    const user = users.find(u => u.email === authForm.email && u.password === authForm.password);
    if (user) {
      const sessionUser = { id: user.id, name: user.name, email: user.email };
      localStorage.setItem('bekalmuslim_current_user', JSON.stringify(sessionUser));
      setCurrentUser(sessionUser);
    } else {
      setAuthError('Email atau password salah');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!authForm.name || !authForm.email || !authForm.password) {
      setAuthError('Semua field wajib diisi');
      return;
    }
    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Konfirmasi password harus sama');
      return;
    }
    const users = JSON.parse(localStorage.getItem('bekalmuslim_users') || '[]');
    if (users.find(u => u.email === authForm.email)) {
      setAuthError('Email sudah terdaftar');
      return;
    }
    const newUser = {
      id: `user_${Date.now()}`,
      name: authForm.name,
      email: authForm.email,
      password: authForm.password,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('bekalmuslim_users', JSON.stringify([...users, newUser]));
    setAuthSuccess('Akun berhasil dibuat');
    setAuthPage('login');
    setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    localStorage.removeItem('bekalmuslim_current_user');
    try {
      sessionStorage.removeItem('waris_session_data');
      sessionStorage.removeItem('waris_nav_stack');
    } catch(e) {}
    setCurrentUser(null);
    setStep(0);
    setViewHistory(false);
  };

  const saveToHistory = () => {
    const historyData = {
      id: `waris_${Date.now()}`,
      name: `Warisan - ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      timestamp: new Date().toLocaleString('id-ID'),
      inputs: {
        gender,
        totalAssets,
        debt,
        will,
        funeral,
        assetItems,
        showAssetDetail,
        heirs
      },
      summary: {
        netAssets: calculationResult?.hartaBersih?.alIrts || 0,
        recipientCount: calculationResult?.distribusi?.hasil?.length || 0,
        recipients: calculationResult?.distribusi?.hasil || [],
        hijab: calculationResult?.hijabInfo || {},
        explanation: summaryExplanation
      }
    };
    
    const existing = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
    const updated = [historyData, ...existing];
    localStorage.setItem(getHistoryKey(), JSON.stringify(updated));
    setHistoryItems(updated);
    
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const loadHistoryItem = (item) => {
    // Load all states from history
    setGender(item.inputs.gender);
    setTotalAssets(item.inputs.totalAssets);
    setDebt(item.inputs.debt);
    setWill(item.inputs.will);
    setFuneral(item.inputs.funeral);
    setAssetItems(item.inputs.assetItems || [{ id: 1, name: '', value: '' }]);
    setShowAssetDetail(item.inputs.showAssetDetail || false);
    setHeirs(item.inputs.heirs);
    
    // Set calculation result
    setCalculationResult({
      hartaBersih: {
         tirkah: item.inputs.totalAssets,
         hutang: item.inputs.debt,
         tajhiz: item.inputs.funeral,
         wasiat: item.inputs.will,
         alIrts: item.summary.netAssets
      },
      distribusi: {
         hasil: item.summary.recipients,
         kasus: 'history_loaded'
      },
      hijabInfo: item.summary.hijab
    });
    
    const stack = getNavStack();
    stack.push({ step, viewHistory, openedFromHistory });
    setNavStack(stack);
    window.history.pushState({ step: 4, viewHistory: false, openedFromHistory: true }, '', '');
    setStep(4);
    setViewHistory(false);
    setOpenedFromHistory(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus riwayat ini?")) {
      const existing = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
      const filtered = existing.filter(item => item.id !== id);
      localStorage.setItem(getHistoryKey(), JSON.stringify(filtered));
      setHistoryItems(filtered);
    }
  };
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = 20;

      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      const addHeader = (text, size = 14) => {
        checkPageBreak(25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size);
        doc.setTextColor(6, 78, 59); // Emerald-900
        doc.text(text, margin, y);
        y += 10;
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      };

      const addText = (label, value, size = 10, isBold = false) => {
        checkPageBreak(12);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(31, 41, 55); 
        doc.text(`${label}: ${value}`, margin, y);
        y += 8;
      };

      // TITLE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Rincian Pembagian Waris', margin, y);
      y += 15;

      // I. RINGKASAN HARTA
      addHeader('I. Ringkasan Harta');
      addText('Tanggal Cetak', new Date().toLocaleString('id-ID'));
      addText('Total Aset (Bruto)', formatIDR(calculationResult.hartaBersih.tirkah));
      addText('Hutang Pewaris', formatIDR(calculationResult.hartaBersih.hutang));
      addText('Biaya Pemulasaran', formatIDR(calculationResult.hartaBersih.tajhiz));
      addText('Wasiat', formatIDR(calculationResult.hartaBersih.wasiat));
      y += 2;
      addText('Harta Bersih (Netto)', formatIDR(calculationResult.hartaBersih.alIrts), 12, true);
      y += 10;

      // II. DAFTAR PENERIMA WARISAN
      addHeader('II. Daftar Penerima Warisan');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Ahli Waris', margin, y);
      doc.text('Kategori', margin + 60, y);
      doc.text('Bagian', margin + 110, y);
      doc.text('Nominal', pageWidth - margin, y, { align: 'right' });
      y += 4;
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      calculationResult.distribusi.hasil.forEach((h) => {
        checkPageBreak(14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(31, 41, 55);
        const jenisLabel = h.jenis?.includes('ashabah') ? 'ASHABAH' : h.bagianFraksi?.includes('Radd') ? 'RADD' : 'FURUDH';
        doc.text(`${h.jumlah}x ${h.label}`, margin, y);
        doc.text(jenisLabel, margin + 65, y);
        doc.text(h.bagianFraksi?.split('=')[0]?.trim() || h.bagianFraksi, margin + 95, y);
        doc.text(formatIDR(h.totalBagian), pageWidth - margin, y, { align: 'right' });
        y += 6;
        if (h.jumlah > 1 && h.perOrang) {
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(`  (per orang: ${formatIDR(h.perOrang)})`, margin, y);
          y += 5;
        }
        y += 2;
      });
      y += 10;

      // III. AHLI WARIS TERHALANG
      addHeader('III. Ahli Waris Terhalang');
      const blockingEntries = Object.entries(calculationResult.hijabInfo);
      if (blockingEntries.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Ahli Waris', margin, y);
        doc.text('Status', margin + 45, y);
        doc.text('Alasan Terhalang', margin + 75, y);
        y += 4;
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        blockingEntries.forEach(([key, p]) => {
          checkPageBreak(15);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(HEIR_INFO[key]?.label || key, margin, y);
          doc.text('TERHALANG', margin + 45, y);
          const reason = getHijabReason(key, p);
          const reasonLines = doc.splitTextToSize(reason, pageWidth - margin - (margin + 75));
          doc.text(reasonLines, margin + 75, y);
          y += (reasonLines.length * 4) + 4;
        });
      } else {
        addText('Status', 'Tidak ada ahli waris yang terhalang.');
      }
      y += 10;

      // IV. RINGKASAN PEMBAGIAN
      addHeader('IV. Ringkasan Pembagian');
      const totalTerbagi = calculationResult.distribusi.hasil.reduce((sum, h) => sum + h.totalBagian, 0);
      const sisa = calculationResult.hartaBersih.alIrts - totalTerbagi;
      const kasus = calculationResult.distribusi.kasus;

      addText('Total Penerima', `${calculationResult.distribusi.hasil.length} Pihak`);
      addText('Total Nominal Terbagi', formatIDR(totalTerbagi));
      if (Math.abs(sisa) > 1) addText('Sisa Pembagian', formatIDR(sisa));
      
      if (kasus === 'aul') {
        checkPageBreak(18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(180, 120, 0);
        doc.text('Kondisi: AUL', margin, y); y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Total bagian furudh melebihi harta. Semua bagian dikurangi secara proporsional.', margin, y); y += 8;
      } else if (kasus === 'radd') {
        checkPageBreak(18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 80, 180);
        doc.text('Kondisi: RADD', margin, y); y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(31, 41, 55);
        doc.text('Tidak ada ashabah. Sisa dikembalikan proporsional ke ahli waris furudh (kecuali pasangan).', margin, y); y += 8;
      }

      y += 5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Catatan: Hasil bersifat simulasi edukatif. Konsultasikan dengan ulama untuk keputusan resmi.', margin, y);
      y += 15;

      // V. PENJELASAN SYARIAH
      addHeader('V. Penjelasan Syariah');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      const summaryLines = doc.splitTextToSize(summaryExplanation, pageWidth - (margin * 2));
      doc.text(summaryLines, margin, y);
      y += (summaryLines.length * 6) + 10;

      for (const h of calculationResult.distribusi.hasil) {
        const dalil = getDalil(h.kode, h.bagianFraksi, h.jenis);
        const sectionHeight = 50; 
        checkPageBreak(sectionHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${h.label.toUpperCase()} (${h.bagianFraksi})`, margin, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const jenisPdf = h.jenis?.includes('ashabah') ? 'Ashabah' : h.isRadd ? 'Furudh + Radd' : 'Furudh';
        doc.text(`Status: ${jenisPdf}`, margin, y);
        y += 6;
        
        if (dalil.arab) {
          doc.setFont('helvetica', 'bold');
          doc.text('Dalil Arab:', margin, y);
          y += 5;

          // CAPTURING ARABIC TEXT AS IMAGE FOR PERFECT RTL & RENDERING
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.width = '500px';
          tempDiv.style.padding = '10px';
          tempDiv.style.fontSize = '24px';
          tempDiv.style.color = '#064e3b';
          tempDiv.style.textAlign = 'right';
          tempDiv.style.fontFamily = 'serif';
          tempDiv.dir = 'rtl';
          tempDiv.innerText = dalil.arab;
          document.body.appendChild(tempDiv);
          
          const canvas = await html2canvas(tempDiv, { scale: 2, backgroundColor: null });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 80; 
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          doc.addImage(imgData, 'PNG', pageWidth - margin - imgWidth, y - 5, imgWidth, imgHeight);
          y += imgHeight + 2;
          document.body.removeChild(tempDiv);

          doc.setFont('helvetica', 'bold');
          doc.text('Artinya:', margin, y);
          y += 5;
          doc.setFont('helvetica', 'italic');
          const dalilLines = doc.splitTextToSize(dalil.arti, pageWidth - margin * 2);
          doc.text(dalilLines, margin, y);
          y += (dalilLines.length * 5) + 4;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Penjelasan:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        let descText = dalil.desc;
        if (h.isRadd) {
           descText += `\nSetelah pembagian kepada ahli waris lainnya, masih terdapat sisa harta.\nKarena tidak terdapat ahli waris ashabah, maka sisa tersebut dikembalikan kepada ${h.label.toLowerCase()} melalui mekanisme radd, sehingga bagian yang diterima menjadi lebih besar.`;
        }
        const descLines = doc.splitTextToSize(descText, pageWidth - margin * 2);
        doc.text(descLines, margin, y);
        y += (descLines.length * 5) + 12;
      }



      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150);
        doc.text('Dicetak dari Kalkulator Faraidh — hasil bersifat simulasi', pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      doc.save(`rincian-warisan-${new Date().toISOString().split('T')[0]}.pdf`);
      setIsGeneratingPDF(false);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
      setIsGeneratingPDF(false);
    }
  };

  const getDalil = (kode, fraction, jenis) => {
    if (jenis?.includes('ashabah_bil_ghairi')) {
      return {
        arab: 'لِلذَّكَرِ مِثْلُ حَظِّ الْأُنْثَيَيْنِ',
        arti: '"Bagian anak laki-laki adalah dua kali bagian anak perempuan." (QS An-Nisa: 11)',
        desc: 'Anak laki-laki dan perempuan menjadi ashabah, dimana bagian laki-laki dua kali bagian perempuan sesuai ketentuan syariat.'
      };
    }
    if (jenis?.includes('ashabah')) {
       return {
         arab: 'يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ',
         arti: '"Allah mensyariatkan bagimu tentang (pembagian pusaka untuk) anak-anakmu..." (QS An-Nisa: 11)',
         desc: 'Menerima seluruh sisa harta setelah ashabul furudh mengambil bagiannya.'
       };
    }
    
    switch(kode) {
      case HEIR.ISTRI:
        return fraction === '1/8' ? {
          arab: 'وَلَهُنَّ الثُّمُنُ مِمَّا تَرَكْتُمْ إِنْ كَانَ لَكُمْ وَلَدٌ',
          arti: '"Istri memperoleh 1/8 dari harta yang ditinggalkan jika pewaris memiliki anak." (QS An-Nisa: 12)',
          desc: 'Istri mendapatkan 1/8 karena pewaris memiliki keturunan (anak/cucu).'
        } : {
          arab: 'وَلَهُنَّ الرُّبُعُ مِمَّا تَرَكْتُمْ إِنْ لَمْ يَكُنْ لَكُمْ وَلَدٌ',
          arti: '"Para istri memperoleh 1/4 harta yang kamu tinggalkan jika kamu tidak mempunyai anak." (QS An-Nisa: 12)',
          desc: 'Istri mendapatkan 1/4 karena pewaris tidak memiliki keturunan.'
        };
      case HEIR.SUAMI:
        return fraction === '1/4' ? {
          arab: 'فَلَكُمُ الرُّبُعُ مِمَّا تَرَكْنَ إِنْ كَانَ لَهُنَّ وَلَدٌ',
          arti: '"Jika istri-istrimu itu mempunyai anak, maka kamu mendapat 1/4 dari harta yang ditinggalkannya." (QS An-Nisa: 12)',
          desc: 'Suami mendapatkan 1/4 karena istri memiliki keturunan.'
        } : {
          arab: 'وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ إِنْ لَمْ يَكُنْ لَهُنَّ وَلَدٌ',
          arti: '"Dan bagimu (suami-suami) 1/2 dari harta yang ditinggalkan oleh istri-istrimu, jika mereka tidak mempunyai anak." (QS An-Nisa: 12)',
          desc: 'Suami mendapatkan 1/2 karena istri tidak memiliki keturunan.'
        };
      case HEIR.AYAH:
        return {
          arab: 'وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِنْهُمَا السُّدُسُ مِمَّا تَرَكَ إِنْ كَانَ لَهُ وَلَدٌ',
          arti: '"Dan untuk dua orang ibu-bapak, bagi masing-masingnya 1/6 dari harta yang ditinggalkan, jika yang meninggal itu mempunyai anak." (QS An-Nisa: 11)',
          desc: 'Ayah mendapatkan 1/6 karena pewaris memiliki anak laki-laki.'
        };
      case HEIR.IBU:
        return fraction === '1/6' ? {
          arab: 'فَإِنْ كَانَ لَهُ إِخْوَةٌ فَلِأُمِّهِ السُّدُسُ',
          arti: '"Jika yang meninggal itu mempunyai beberapa saudara, maka ibunya mendapat 1/6." (QS An-Nisa: 11)',
          desc: 'Ibu mendapatkan 1/6 karena adanya anak atau minimal dua saudara.'
        } : {
          arab: 'فَإِنْ لَمْ يَكُنْ لَهُ وَلَدٌ وَوَرِثَهُ أَبَوَاهُ فَلِأُمِّهِ الثُّلُثُ',
          arti: '"Jika orang yang meninggal tidak mempunyai anak dan ia diwarisi oleh ibu-bapaknya (saja), maka ibunya mendapat 1/3." (QS An-Nisa: 11)',
          desc: 'Ibu mendapatkan 1/3 karena pewaris tidak memiliki anak dan saudara tidak lebih dari satu.'
        };
      case HEIR.ANAK_PR:
        return fraction === '1/2' ? {
          arab: 'وَإِنْ كَانَتْ وَاحِدَةً فَلَهَا النِّصْفُ',
          arti: '"Jika anak perempuan itu seorang saja, maka ia memperoleh 1/2 harta." (QS An-Nisa: 11)',
          desc: 'Anak perempuan tunggal mendapatkan bagian setengah.'
        } : {
          arab: 'فَإِنْ كُنَّ نِسَاءً فَوْقَ اثْنَتَيْنِ فَلَهُنَّ ثُلُثَا مَا تَرَكَ',
          arti: '"Jika anak itu semuanya perempuan lebih dari dua, maka bagi mereka 2/3 dari harta." (QS An-Nisa: 11)',
          desc: 'Dua anak perempuan atau lebih berbagi 2/3 bagian.'
        };
      default:
        return { arab: '', arti: '', desc: 'Sesuai ketentuan hukum faraidh.' };
    }
  };

  const getHijabReason = (terhijab, penghalang) => {
    const terhijabLabel = HEIR_INFO[terhijab]?.label || terhijab;
    const penghalangLabel = HEIR_INFO[penghalang]?.label || penghalang;

    if (terhijab === HEIR.SDR_LK_SEIBU || terhijab === HEIR.SDR_PR_SEIBU) {
      return `Terhalang oleh ${penghalangLabel} karena saudara seibu terhalang oleh semua Ashul (ayah/kakek) dan Furu' (anak/cucu).`;
    }
    
    return `Terhalang oleh ${penghalangLabel} karena ${penghalangLabel} lebih dekat hubungan nasabnya kepada pewaris.`;
  };

  const summaryExplanation = useMemo(() => {
    if (!calculationResult || !calculationResult.distribusi) return '';
    const { kasus, hasil } = calculationResult.distribusi;
    let text = '';
    
    if (kasus === 'radd') {
      const parts = hasil.map(h => {
        return `${h.label} mendapatkan bagian awal ${h.bagianFraksi.replace(' + Radd', '')} karena ${getDalil(h.kode, h.bagianFraksi.replace(' + Radd', ''), h.jenis).desc.toLowerCase().replace(/\.$/, '')}.`;
      });
      const raddRecipients = hasil.filter(h => h.isRadd).map(h => h.label).join(' dan ');
      text = parts.join('\n') + `\nSetelah pembagian awal, masih terdapat sisa harta.\nKarena tidak terdapat ahli waris ashabah, maka sisa tersebut dikembalikan kepada ${raddRecipients.toLowerCase()} melalui mekanisme radd.`;
    } else if (kasus === 'aul') {
      text = 'Pembagian warisan dilakukan berdasarkan hukum faraidh dalam Islam. Terjadi kondisi Aul karena total bagian furudh melebihi harta, sehingga semua bagian dikurangi secara proporsional.';
    } else if (kasus === 'ashabah_murni') {
      text = 'Pembagian warisan dilakukan berdasarkan hukum faraidh dalam Islam. Seluruh harta dibagikan secara Ashabah (sisa) karena tidak ada ahli waris dengan bagian tetap (furudh).';
    } else {
      text = 'Pembagian warisan dilakukan berdasarkan hukum faraidh dalam Islam. Kewajiban (hutang, wasiat, biaya pemulasaran) diselesaikan terlebih dahulu, kemudian harta bersih dibagikan kepada ahli waris sesuai bagian yang ditetapkan Al-Qur\'an.';
    }
    return text;
  }, [calculationResult]);

  if (!currentUser) {
    return (
      <div className="bg-ivory min-h-screen font-sans text-emerald-900 antialiased flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-500 border border-slate-100">
          <div className="flex flex-col items-center text-center gap-0">
            <img src={logoBekalMuslim} alt="Bekal Muslim" className="w-full max-w-[140px] sm:max-w-[220px] h-auto object-contain block -mb-8" />
            <h2 className="text-lg font-bold text-emerald-700 m-0 leading-tight mb-2">{authPage === 'login' ? 'Masuk ke Hitung Waris' : 'Buat Akun'}</h2>
            <p className="text-xs text-slate-500 font-medium m-0">
              {authPage === 'login' 
                ? 'Silakan masuk untuk menyimpan dan melihat riwayat perhitungan Anda.'
                : 'Daftar untuk menyimpan riwayat perhitungan waris Anda secara lokal.'}
            </p>
          </div>

          {authError && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold text-center border border-rose-100">{authError}</div>}
          {authSuccess && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-xs font-bold text-center border border-emerald-100">{authSuccess}</div>}

          <form onSubmit={authPage === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
            {authPage === 'register' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-emerald-700 ml-1">Nama</label>
                <input type="text" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" placeholder="Nama Lengkap" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-emerald-700 ml-1">Email</label>
              <input type="text" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" placeholder="alamat@email.com" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-emerald-700 ml-1">Password</label>
              <input type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" placeholder="••••••••" />
            </div>
            {authPage === 'register' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-emerald-700 ml-1">Konfirmasi Password</label>
                <input type="password" value={authForm.confirmPassword} onChange={e => setAuthForm({...authForm, confirmPassword: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" placeholder="••••••••" />
              </div>
            )}
            
            <button type="submit" className="bg-emerald-600 text-white rounded-2xl py-4 font-black shadow-lg mt-2 active:scale-95 transition-transform text-sm uppercase tracking-widest">
              {authPage === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          <div className="text-center mt-2">
            {authPage === 'login' ? (
              <p className="text-xs text-slate-500 font-medium mt-1">Belum punya akses? Silahkan <a href="https://bekalmuslim.com/hitungwaris" target="_blank" rel="noopener noreferrer" className="text-blue-600 italic cursor-pointer hover:underline">klik disini</a></p>
            ) : (
              <p className="text-xs text-slate-500 font-medium">Sudah punya akun? <button onClick={() => {setAuthPage('login'); setAuthError(''); setAuthSuccess('');}} className="text-emerald-600 font-bold hover:underline">Masuk</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen font-sans text-emerald-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 flex justify-center items-start">
      <div className="w-full max-w-[480px] p-4 flex flex-col gap-0 pb-32 pt-6 relative bg-ivory shadow-2xl sm:border-x sm:border-slate-200/50">
        {/* Logout Button (Only on Step 0) */}
        {step === 0 && !viewHistory && (
          <div className="absolute top-6 right-6 z-50">
            <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-full shadow-sm transition-colors" title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        )}

        {/* Global Info Popup Overlay */}
        {activeInfoPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveInfoPopup(null)}>
            <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-emerald-900 uppercase tracking-widest text-sm flex items-center gap-2">
                  <span className="text-emerald-500">ℹ️</span> Informasi
                </h3>
                <button onClick={() => setActiveInfoPopup(null)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full font-bold hover:bg-slate-100">✕</button>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed font-medium">
                {activeInfoPopup === 'gender' && (
                  <>
                    <p className="mb-3">Yang dimaksud adalah jenis kelamin PEWARIS (orang yang meninggal), bukan Anda sebagai pengguna.</p>
                    <p className="font-bold text-slate-700">Contoh:</p>
                    <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                      <li>Ayah meninggal → pilih Laki-laki</li>
                      <li>Ibu meninggal → pilih Perempuan</li>
                    </ul>
                  </>
                )}
                {activeInfoPopup === 'will' && (
                  <>
                    <p className="mb-3">Wasiat adalah pemberian dari almarhum kepada pihak di luar ahli waris.</p>
                    <p className="font-bold text-slate-700">Contoh:</p>
                    <ul className="list-disc pl-4 mt-1 flex flex-col gap-1 mb-3">
                      <li>Donasi ke masjid</li>
                      <li>Diberikan ke anak angkat</li>
                      <li>Bantuan sosial</li>
                    </ul>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-[10px] uppercase font-black tracking-widest text-emerald-700">
                      Catatan: Wasiat maksimal 1/3 dari total harta sesuai syariat Islam.
                    </div>
                  </>
                )}
                {activeInfoPopup === 'funeral' && (
                  <>
                    <p className="mb-3">Biaya pemulasaran adalah biaya pengurusan jenazah sebelum pemakaman.</p>
                    <p className="font-bold text-slate-700">Meliputi:</p>
                    <ul className="list-disc pl-4 mt-1 flex flex-col gap-1 mb-3">
                      <li>Memandikan jenazah</li>
                      <li>Mengkafani</li>
                      <li>Transportasi</li>
                      <li>Pemakaman</li>
                    </ul>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] uppercase font-black tracking-widest text-amber-700">
                      Biaya ini diambil dari harta pewaris sebelum pembagian warisan.
                    </div>
                  </>
                )}
                {activeInfoPopup === 'parents' && (
                  <>
                    <p className="mb-3">Centang Ayah/Ibu jika orang tua pewaris masih hidup saat pewaris meninggal. Jika sudah wafat lebih dulu, jangan dicentang.</p>
                  </>
                )}
              </div>
              <button onClick={() => setActiveInfoPopup(null)} className="w-full mt-2 py-4 bg-emerald-600 text-white font-black text-sm uppercase rounded-2xl active:scale-95 transition-transform">Tutup</button>
            </div>
          </div>
        )}
        
        {/* Step 0: Landing Page */}
        {step === 0 && !viewHistory && (
          <div className="flex flex-col items-center justify-start text-center p-0 m-0 animate-in fade-in zoom-in duration-700">
            <div className="flex flex-col items-center w-full gap-0">
              {/* 1. Icon Timbangan */}
              <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] bg-emerald-600 rounded-[3.5rem] flex items-center justify-center shadow-2xl shadow-emerald-200 rotate-12 transition-transform hover:rotate-0 m-0 -mb-6">
                <span className="text-6xl sm:text-7xl">⚖️</span>
              </div>
              
              {/* 2. Logo Hitung Waris */}
              <img src={logoHitungWaris} alt="Hitung Waris" className="w-full max-w-[250px] sm:max-w-[310px] h-auto object-contain block m-0 -mb-16 -mt-6" />
              
              {/* 3. Powered by */}
              <span className="text-[13px] sm:text-[14px] font-medium text-emerald-900/40 tracking-[0.2em] m-0 z-10 relative">Powered by</span>
              
              {/* 4. Logo BekalMuslimID */}
              <img src={logoBekalMuslim} alt="Bekal Muslim" className="w-full max-w-[130px] sm:max-w-[160px] h-auto object-contain block m-0 -mt-16 mb-4" />
            </div>

            <div className="flex flex-col gap-[16px] px-6 mb-[24px]">
              <p className="text-lg text-emerald-800 font-medium leading-tight">
                Alat bantu untuk menghitung pembagian warisan sesuai syariat Islam dengan mudah dan akurat.
              </p>
              <div className="bg-emerald-50 self-center px-4 py-1.5 rounded-full border border-emerald-100">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">Berdasarkan Hukum Faraidh dalam Islam</span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-4 px-4 mt-8">
              <button 
                onClick={() => navigate(1)}
                className="group relative overflow-hidden bg-emerald-600 text-white h-16 rounded-3xl font-black text-lg shadow-xl shadow-emerald-200 active:scale-95 transition-all w-full flex items-center justify-center"
              >
                <span className="relative z-10">Mulai Perhitungan</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button 
                onClick={handleOpenHistory}
                className="h-16 rounded-3xl font-black text-emerald-700 border-2 border-emerald-100 active:scale-95 transition-all text-sm uppercase tracking-widest hover:bg-emerald-50"
              >
                Riwayat Perhitungan
              </button>
            </div>

            <footer className="mt-auto pt-12 flex justify-center items-center">
              <span className="text-[10px] font-medium text-slate-400 tracking-wider">© BekalMuslimID</span>
            </footer>
          </div>
        )}

        {/* History View */}
        {viewHistory && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-500">
            <header className="flex items-center justify-between pb-4 border-b border-emerald-100">
              <button onClick={() => handleBack(0, false, false)} className="w-10 h-10 rounded-2xl bg-white border border-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm active:scale-90">←</button>
              <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tighter">Riwayat</h2>
              <div className="w-10" />
            </header>

            <div className="flex flex-col gap-4">
              {(() => {
                if (historyItems.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl opacity-20">📜</div>
                      <div className="flex flex-col gap-1">
                        <h4 className="font-black text-slate-400 uppercase text-xs tracking-widest">Belum ada riwayat</h4>
                        <p className="text-sm text-slate-400 font-medium">Mulai hitung warisan pertama Anda.</p>
                      </div>
                      <button 
                        onClick={() => navigate(1)}
                        className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-100"
                      >
                        Mulai Perhitungan
                      </button>
                    </div>
                  );
                }
                return historyItems.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-emerald-200 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <h4 className="font-black text-emerald-950 leading-tight">{item.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.timestamp}</span>
                      </div>
                      <div className="bg-emerald-50 px-2.5 py-1 rounded-full">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{item.summary.recipientCount} Penerima</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Harta Bersih</span>
                        <span className="text-sm font-black text-emerald-700">{formatIDR(item.summary.netAssets)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => deleteHistoryItem(item.id)}
                          className="bg-rose-50 text-rose-500 w-10 h-10 rounded-2xl flex items-center justify-center font-black active:scale-90"
                        >
                          🗑️
                        </button>
                        <button 
                           onClick={() => loadHistoryItem(item)}
                           className="bg-emerald-100 text-emerald-700 px-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 h-10"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Step Indicator Header */}
        {step > 0 && step < 4 && !viewHistory && (
          <header className="flex flex-col gap-2 pt-4">
            <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-emerald-600 uppercase">
              <div className="flex items-center gap-2">
                <button onClick={() => handleBack(step - 1, false, false)} className="w-6 h-6 rounded-full bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 active:scale-95 font-bold">←</button>
                <span>Step {step} of 3</span>
              </div>
              <span>{Math.round((step / 3) * 100)}% Selesai</span>
            </div>
            <div className="w-full bg-emerald-100 h-1.5 rounded-full">
              <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
            <h1 className="text-2xl font-extrabold text-emerald-900 mt-2">{step === 1 ? "Data Pewaris & Harta" : step === 2 ? "Ahli Waris Inti" : "Ahli Waris Lanjutan"}</h1>
          </header>
        )}

        {/* STEP 1: ASSETS */}
        {step === 1 && !viewHistory && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-[-8px]">
              <label className="text-[10px] font-black uppercase text-emerald-700 ml-1 flex items-center gap-1.5">
                Jenis Kelamin Pewaris
                <button onClick={() => setActiveInfoPopup('gender')} className="text-slate-400 hover:text-emerald-600 transition-colors">ℹ️</button>
              </label>
            </div>
            <div className="bg-white/50 p-1.5 rounded-2xl flex border border-emerald-100 shadow-sm">
              <button onClick={() => setGender('lk')} className={`flex-1 py-3 rounded-xl font-bold text-sm ${gender === 'lk' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100'}`}>Laki-laki</button>
              <button onClick={() => setGender('pr')} className={`flex-1 py-3 rounded-xl font-bold text-sm ${gender === 'pr' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100'}`}>Perempuan</button>
            </div>
            <div className="flex flex-col gap-4">
              <CurrencyInput label="Total Seluruh Aset" value={totalAssets} onChange={setTotalAssets} disabled={showAssetDetail} placeholder="0" error={errors.totalAssets} />
              <button onClick={() => setShowAssetDetail(!showAssetDetail)} className="text-xs font-bold text-emerald-600 flex items-center gap-1 ml-1">{showAssetDetail ? "✕ Tutup Detail" : `+ Tambah Detail Aset (Opsional)`}</button>
              {showAssetDetail && (
                <div className="bg-white/40 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-3">
                  {assetItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                      <input className="bg-white border rounded-lg p-2 text-xs" placeholder="Nama Aset" value={item.name} onChange={(e) => { const n = [...assetItems]; n[idx].name = e.target.value; setAssetItems(n); }} />
                      <input type="number" className="bg-white border rounded-lg p-2 text-xs" placeholder="Nilai (Rp)" value={item.value} onChange={(e) => { const n = [...assetItems]; n[idx].value = e.target.value; setAssetItems(n); }} />
                      <button onClick={() => setAssetItems(assetItems.filter(ai => ai.id !== item.id))} className="text-rose-500 font-bold px-1">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setAssetItems([...assetItems, { id: Date.now(), name: '', value: '' }])} className="w-full py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl uppercase">+ Tambah Item Aset</button>
                </div>
              )}
              <div className="h-px bg-slate-200 my-2" />
              <CurrencyInput label="Hutang Pewaris" value={debt} onChange={setDebt} error={errors.debt} />
              <CurrencyInput label="Wasiat" value={will} onChange={setWill} error={errors.will} onInfoClick={() => setActiveInfoPopup('will')} />
              <CurrencyInput label="Biaya Pemulasaran" value={funeral} onChange={setFuneral} error={errors.funeral} onInfoClick={() => setActiveInfoPopup('funeral')} />
            </div>
            <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
              <label className="text-[10px] font-black text-emerald-400 uppercase">HARTA BERSIH (SIAP BAGI)</label>
              <div className="text-3xl font-black mt-1">{formatIDR(netAssets)}</div>
            </div>
            {Object.keys(errors).length > 0 && <p className="text-center text-xs text-rose-500 font-bold animate-bounce">Mohon lengkapi data wajib terlebih dahulu.</p>}
            <button onClick={() => navigate(2)} className="bg-emerald-600 text-white rounded-2xl py-5 font-bold shadow-lg mt-4">Lanjutkan</button>
          </div>
        )}

        {/* STEP 2: MOTIVATED FAMILY */}
        {step === 2 && !viewHistory && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="flex flex-col gap-3 text-emerald-900 font-bold">
              {gender === 'lk' ? <StepperCard label="Istri" sub="(MAKSIMAL 4)" value={heirs[HEIR.ISTRI]} onDec={() => updateHeirCount(HEIR.ISTRI, -1)} onInc={() => updateHeirCount(HEIR.ISTRI, 1)} max={4} /> : <ToggleCard label="Suami" sub="(MAKSIMAL 1)" active={heirs[HEIR.SUAMI] === 1} onToggle={() => toggleHeir(HEIR.SUAMI)} />}
              <StepperCard label="Anak Laki-laki" value={heirs[HEIR.ANAK_LK]} onDec={() => updateHeirCount(HEIR.ANAK_LK, -1)} onInc={() => updateHeirCount(HEIR.ANAK_LK, 1)} />
              <StepperCard label="Anak Perempuan" value={heirs[HEIR.ANAK_PR]} onDec={() => updateHeirCount(HEIR.ANAK_PR, -1)} onInc={() => updateHeirCount(HEIR.ANAK_PR, 1)} />
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Orang Tua Pewaris (Pilih jika masih hidup)</span>
                <button onClick={() => setActiveInfoPopup('parents')} className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full font-bold hover:bg-slate-200 text-xs">ℹ️</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ToggleCard label="Ayah" active={heirs[HEIR.AYAH] === 1} onToggle={() => toggleHeir(HEIR.AYAH)} />
                <ToggleCard label="Ibu" active={heirs[HEIR.IBU] === 1} onToggle={() => toggleHeir(HEIR.IBU)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleBack(1, false, false)} className="flex-1 bg-slate-200 py-5 rounded-2xl font-bold">Kembali</button>
              <button onClick={() => navigate(3)} className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-bold">Lanjutkan</button>
            </div>
          </div>
        )}

        {/* STEP 3: ADDITIONAL ACCORDION */}
        {step === 3 && !viewHistory && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-500">
            <AccordionSection title="1 — Pengganti & Orang Tua Jauh" id="anc" active={activeSection} onToggle={setActiveSection}>
              <div className="flex flex-col gap-4 py-1">
                <MiniStepper label="Cucu Laki-laki" value={heirs[HEIR.CUCU_LK]} onUpdate={(d) => updateHeirCount(HEIR.CUCU_LK, d)} />
                <MiniStepper label="Cucu Perempuan" value={heirs[HEIR.CUCU_PR]} onUpdate={(d) => updateHeirCount(HEIR.CUCU_PR, d)} />
                <MiniStepper label="Kakek (dr Ayah)" value={heirs[HEIR.KAKEK]} onUpdate={(d) => updateHeirCount(HEIR.KAKEK, d)} />
                <MiniStepper label="Nenek (dr Ayah)" value={heirs.NENEK_AYAH} onUpdate={(d) => updateHeirCount('NENEK_AYAH', d)} />
                <MiniStepper label="Nenek (dr Ibu)" value={heirs.NENEK_IBU} onUpdate={(d) => updateHeirCount('NENEK_IBU', d)} />
              </div>
            </AccordionSection>
            <AccordionSection title="2 — Saudara-saudara" id="sib" active={activeSection} onToggle={setActiveSection}>
              <div className="flex flex-col gap-4 py-1">
                <MiniStepper label="Sdr Lk Kandung" value={heirs[HEIR.SDR_LK_KANDUNG]} onUpdate={(d) => updateHeirCount(HEIR.SDR_LK_KANDUNG, d)} />
                <MiniStepper label="Sdr Pr Kandung" value={heirs[HEIR.SDR_PR_KANDUNG]} onUpdate={(d) => updateHeirCount(HEIR.SDR_PR_KANDUNG, d)} />
                <MiniStepper label="Sdr Lk Seayah" value={heirs[HEIR.SDR_LK_SEAYAH]} onUpdate={(d) => updateHeirCount(HEIR.SDR_LK_SEAYAH, d)} />
                <MiniStepper label="Sdr Pr Seayah" value={heirs[HEIR.SDR_PR_SEAYAH]} onUpdate={(d) => updateHeirCount(HEIR.SDR_PR_SEAYAH, d)} />
              </div>
            </AccordionSection>
            <AccordionSection title="3 — Kerabat Laki-laki (Ashabah)" id="ash" active={activeSection} onToggle={setActiveSection}>
              <div className="flex flex-col gap-4 py-1">
                <MiniStepper label="Anak Lk Sdr Kandung" value={heirs[HEIR.ANAK_LK_SDR_KANDUNG]} onUpdate={(d) => updateHeirCount(HEIR.ANAK_LK_SDR_KANDUNG, d)} />
                <MiniStepper label="Anak Lk Sdr Seayah" value={heirs[HEIR.ANAK_LK_SDR_SEAYAH]} onUpdate={(d) => updateHeirCount(HEIR.ANAK_LK_SDR_SEAYAH, d)} />
                <MiniStepper label="Paman Kandung (dr Ayah)" value={heirs[HEIR.PAMAN_KANDUNG]} onUpdate={(d) => updateHeirCount(HEIR.PAMAN_KANDUNG, d)} />
                <MiniStepper label="Paman Seayah (dr Ayah)" value={heirs[HEIR.PAMAN_SEAYAH]} onUpdate={(d) => updateHeirCount(HEIR.PAMAN_SEAYAH, d)} />
                <MiniStepper label="Anak Lk Paman Kandung" value={heirs[HEIR.SEPUPU_LK_KANDUNG]} onUpdate={(d) => updateHeirCount(HEIR.SEPUPU_LK_KANDUNG, d)} />
                <MiniStepper label="Anak Lk Paman Seayah" value={heirs[HEIR.SEPUPU_LK_SEAYAH]} onUpdate={(d) => updateHeirCount(HEIR.SEPUPU_LK_SEAYAH, d)} />
              </div>
            </AccordionSection>
            <div className="flex flex-col gap-4 mt-8">
              <button onClick={performCalculation} className="bg-amber-500 text-white rounded-3xl py-6 font-black text-xl shadow-xl hover:bg-amber-600 transition-all uppercase leading-none">PROSES HASIL</button>
              <button onClick={() => handleBack(2, false, false)} className="bg-transparent text-slate-500 py-2 rounded-xl text-sm font-bold">Kembali</button>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL RESULTS */}
        {step === 4 && calculationResult && !viewHistory && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleBack(openedFromHistory ? 0 : 3, openedFromHistory, false)} 
                className="w-12 h-12 rounded-2xl border flex items-center justify-center bg-white"
              >
                ←
              </button>
              <h1 className="text-2xl font-black text-emerald-900 tracking-tight">Hasil Perhitungan</h1>
            </div>
            
            {showSaveToast && <div className="bg-emerald-600 text-white py-3 px-6 rounded-2xl text-xs font-bold text-center fixed top-4 left-1/2 -translate-x-1/2 z-50">Data berhasil disimpan</div>}

            <div className="bg-emerald-700 p-6 rounded-3xl text-white">
                <div className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">HARTA SIAP DIDISTRIBUSIKAN</div>
                <div className="text-4xl font-black">{formatIDR(calculationResult.hartaBersih.alIrts)}</div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Kasus Banner */}
              {calculationResult.distribusi.kasus === 'aul' && (
                <div className="bg-amber-50 border border-amber-200 px-5 py-3 rounded-2xl">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">⚠ Kondisi AUL</p>
                  <p className="text-xs text-amber-700">Total bagian furudh melebihi harta. Semua bagian dikurangi secara proporsional.</p>
                </div>
              )}
              {calculationResult.distribusi.kasus === 'radd' && (
                <div className="bg-blue-50 border border-blue-200 px-5 py-3 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">↩ Kondisi RADD</p>
                  <p className="text-xs text-blue-700">Tidak ada ashabah. Sisa harta dikembalikan ke ahli waris furudh secara proporsional.</p>
                </div>
              )}
              <h3 className="text-sm font-black text-emerald-800 ml-1 uppercase">Daftar Penerima</h3>
              {calculationResult.distribusi.hasil.map((h, i) => (
                <ResultCard key={i} name={h.label} count={h.jumlah} badge={h.jenis.toUpperCase()} share={h.bagianFraksi} amount={h.totalBagian} perOrang={h.perOrang} isMulti={h.jumlah > 1} />
              ))}
            </div>

            {Object.keys(calculationResult.hijabInfo).length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-black text-rose-800 ml-1 uppercase">Ahli Waris Terhalang</h3>
                {Object.entries(calculationResult.hijabInfo).map(([key, p]) => (
                  <div key={key} className="bg-white p-6 rounded-[2rem] shadow-sm border-l-4 border-rose-500 bg-rose-50/10 transition-transform active:scale-[0.98]">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-rose-900 uppercase tracking-tighter">{HEIR_INFO[key]?.label || key}</span>
                      <div className="bg-rose-100 px-2 py-0.5 rounded-lg text-[8px] font-black text-rose-600 uppercase w-max tracking-wide mb-2">STATUS: TERHALANG</div>
                      <p className="text-[10px] text-rose-700 leading-relaxed font-bold">Alasan: {getHijabReason(key, p)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white/50 p-6 rounded-3xl border border-slate-100">
               <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Penjelasan Singkat</h4>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">{summaryExplanation}</p>
               <button onClick={() => navigate(5)} className="w-full mt-4 py-4 bg-emerald-50 text-emerald-700 text-xs font-black rounded-2xl uppercase">Lihat Penjelasan Detail</button>
            </div>

            <div className="sticky bottom-6 left-0 right-0 flex flex-col gap-3 px-2">
               <button 
                 onClick={generatePDF} 
                 disabled={isGeneratingPDF}
                 className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-2xl active:scale-95 transition-all text-sm uppercase"
               >
                 {isGeneratingPDF ? "SEDANG MEMPROSES..." : "📜 CETAK PDF"}
               </button>
               <div className="flex gap-3">
                  <button onClick={saveToHistory} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">Simpan ke History</button>
                  <button onClick={resetData} className="flex-1 bg-white border border-slate-200 text-rose-500 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-50 transition-all">Hapus Data</button>
               </div>
            </div>
          </div>
        )}

        {/* STEP 5: DETAIL PDF-LIKE VIEW */}
        {step === 5 && calculationResult && !viewHistory && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center gap-4">
              <button onClick={() => handleBack(4, false, openedFromHistory)} className="w-12 h-12 rounded-2xl border flex items-center justify-center bg-white shadow-sm">←</button>
              <h1 className="text-2xl font-black text-emerald-900 tracking-tight">Dasar Pembagian</h1>
            </div>
            <Section title="Ringkasan Perhitungan">
               <div className="flex flex-col gap-2">
                 <SummaryRow label="Total Aset" value={calculationResult.hartaBersih.tirkah} />
                 <SummaryRow label="Hutang" value={calculationResult.hartaBersih.hutang} />
                 <SummaryRow label="Biaya Pemulasaran" value={calculationResult.hartaBersih.tajhiz} />
                 <SummaryRow label="Wasiat" value={calculationResult.hartaBersih.wasiat} />
                 <div className="h-px bg-slate-100 my-1" />
                 <SummaryRow label="Harta Bersih" value={calculationResult.hartaBersih.alIrts} highlight />
               </div>
            </Section>
            <Section title="Detail Dasar Syariah">
               <div className="flex flex-col gap-6">
                 {calculationResult.distribusi.hasil.map((h, i) => {
                    const dalil = getDalil(h.kode, h.bagianFraksi, h.jenis);
                    return (
                      <div key={i} className="bg-slate-50 p-5 rounded-2xl border-l-4 border-emerald-600">
                         <h5 className="text-sm font-black text-emerald-800 uppercase mb-2">{h.label} ({h.bagianFraksi})</h5>
                         
                         <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg">
                               <span className="text-[10px] font-black text-slate-400">STATUS</span>
                               <span className={`text-[10px] font-black ${h.jenis.includes('ashabah') ? 'text-amber-600' : h.isRadd ? 'text-blue-600' : 'text-emerald-600'}`}>
                                  {h.jenis.includes('ashabah') ? 'ASHABAH' : h.isRadd ? 'FURUDH + RADD' : 'FURUDH'}
                               </span>
                            </div>

                            {dalil.arab && (
                               <div className="flex flex-col gap-2 mt-1">
                                  <span className="text-[10px] font-black text-slate-400">DALIL:</span>
                                  <p className="text-xl font-arabic text-right leading-loose text-emerald-950 font-medium" dir="rtl">{dalil.arab}</p>
                                  <p className="text-xs text-slate-600 italic font-medium"> artinya: {dalil.arti}</p>
                               </div>
                            )}

                            <div className="mt-1">
                               <span className="text-[10px] font-black text-slate-400">PENJELASAN:</span>
                               <p className="text-xs text-slate-600 leading-relaxed mt-1">{dalil.desc}</p>
                               {h.isRadd && (
                                  <p className="text-xs text-blue-700 leading-relaxed mt-2 font-medium bg-blue-50 p-3 rounded-xl border border-blue-100">
                                     Setelah pembagian kepada ahli waris lainnya, masih terdapat sisa harta. Karena tidak terdapat ahli waris ashabah, maka sisa tersebut dikembalikan kepada {h.label.toLowerCase()} melalui mekanisme radd, sehingga bagian yang diterima menjadi lebih besar.
                                  </p>
                               )}
                            </div>
                         </div>
                      </div>
                    );
                 })}
               </div>
            </Section>

            {Object.keys(calculationResult.hijabInfo).length > 0 && (
              <Section title="Ahli Waris Terhalang (Hijab)">
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">Beberapa ahli waris tidak mendapatkan bagian karena adanya ahli waris lain yang lebih dekat kepada pewaris. Dalam faraidh, kondisi ini disebut hijab.</p>
                <div className="flex flex-col gap-4">
                  {Object.entries(calculationResult.hijabInfo).map(([key, p]) => (
                    <div key={key} className="bg-rose-50 p-5 rounded-2xl border-l-4 border-rose-500">
                      <h5 className="text-sm font-black text-rose-900 uppercase mb-2">{HEIR_INFO[key]?.label || key}</h5>
                      <div className="mt-1">
                         <span className="text-[10px] font-black text-rose-400">ALASAN HIJAB:</span>
                         <p className="text-xs text-rose-700 leading-relaxed mt-1 font-bold">{getHijabReason(key, p)}</p>
                      </div>
                      <div className="mt-2 text-[10px] text-rose-600 italic">
                         {HEIR_INFO[key]?.label || key} tidak mendapat bagian karena pewaris masih memiliki {HEIR_INFO[p]?.label || p}. {HEIR_INFO[p]?.label || p} berada pada tingkat nasab yang lebih dekat sehingga menutup {HEIR_INFO[key]?.label || key}.
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            <button onClick={() => handleBack(4, false, openedFromHistory)} className="bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase">Kembali ke Hasil</button>
          </div>
        )}

        {/* HIDDEN PRINT TEMPLATE */}
        <div className="hidden">
           <div ref={printRef} className="p-10 text-slate-800 bg-white font-sans max-w-[800px]">
              <div className="border-b-4 border-emerald-600 pb-4 mb-8">
                 <h1 className="text-4xl font-black text-emerald-900 uppercase tracking-tighter">Laporan Pembagian Waris</h1>
                 <p className="text-slate-400 text-sm font-bold uppercase mt-1">Dicetak pada {new Date().toLocaleString('id-ID')}</p>
              </div>

              <div className="mb-10">
                 <h2 className="text-xl font-bold text-emerald-800 mb-4 border-l-4 border-emerald-500 pl-3 uppercase">I. Ringkasan Harta</h2>
                 <table className="w-full text-sm border-collapse">
                    <tbody>
                       <tr className="border-b border-slate-100"><td className="py-2 text-slate-500">Total Aset Khas (Tirkah)</td><td className="py-2 text-right font-bold text-slate-800">{formatIDR(calculationResult?.hartaBersih.tirkah)}</td></tr>
                       <tr className="border-b border-slate-100"><td className="py-2 text-slate-500">Hutang Pewaris</td><td className="py-2 text-right font-bold text-slate-800">{formatIDR(calculationResult?.hartaBersih.hutang)}</td></tr>
                       <tr className="border-b border-slate-100"><td className="py-2 text-slate-500">Biaya Pemulasaran Jenazah</td><td className="py-2 text-right font-bold text-slate-800">{formatIDR(calculationResult?.hartaBersih.tajhiz)}</td></tr>
                       <tr className="border-b border-slate-100"><td className="py-2 text-slate-500">Wasiat (Maks 1/3)</td><td className="py-2 text-right font-bold text-slate-800">{formatIDR(calculationResult?.hartaBersih.wasiat)}</td></tr>
                       <tr className="bg-emerald-50"><td className="py-3 px-2 font-black text-emerald-900 uppercase">Harta Bersih (Al-Irts)</td><td className="py-3 px-2 text-right font-black text-emerald-900 text-lg">{formatIDR(calculationResult?.hartaBersih.alIrts)}</td></tr>
                    </tbody>
                 </table>
              </div>

              <div className="mb-10">
                 <h2 className="text-xl font-bold text-emerald-800 mb-4 border-l-4 border-emerald-500 pl-3 uppercase">II. Daftar Penerima</h2>
                 <table className="w-full text-sm border-collapse border border-slate-200">
                    <thead className="bg-slate-50">
                       <tr className="text-left font-black uppercase text-slate-400 text-[10px]">
                          <th className="p-3 border-b border-slate-200">Ahli Waris</th>
                          <th className="p-3 border-b border-slate-200">Kategori</th>
                          <th className="p-3 border-b border-slate-200">Bagian</th>
                          <th className="p-3 border-b border-slate-200 text-right">Nominal</th>
                       </tr>
                    </thead>
                    <tbody>
                       {calculationResult?.distribusi.hasil.map((h, i) => (
                          <tr key={i} className="border-b border-slate-100">
                             <td className="p-3 font-bold text-slate-800">{h.jumlah}x {h.label}</td>
                             <td className="p-3 text-slate-500 text-xs">{h.jenis.toUpperCase()}</td>
                             <td className="p-3 font-black text-emerald-600">{h.bagianFraksi}</td>
                             <td className="p-3 text-right font-black text-slate-800">{formatIDR(h.totalBagian)}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="mb-10">
                 <h2 className="text-xl font-bold text-emerald-800 mb-4 border-l-4 border-emerald-500 pl-3 uppercase">III. Penjelasan Detail</h2>
                 <div className="flex flex-col gap-6">
                    {calculationResult?.distribusi.hasil.map((h, i) => (
                       <div key={i} className="bg-slate-50 p-4 rounded-xl border-l-4 border-emerald-600">
                          <p className="text-[10px] font-black text-emerald-800 uppercase mb-1">Ket. Untuk {h.label}</p>
                          <p className="text-xs text-slate-600 leading-relaxed italic">{h.keterangan}</p>
                       </div>
                    ))}
                    {Object.entries(calculationResult?.hijabInfo || {}).map(([key, p]) => (
                       <div key={key} className="bg-rose-50 p-4 rounded-xl border-l-4 border-rose-500">
                          <p className="text-[10px] font-black text-rose-800 uppercase mb-1">Ket. Terhalang: {HEIR_INFO[key]?.label || key}</p>
                          <p className="text-xs text-rose-600 italic">Terhalang hak warisnya karena adanya {HEIR_INFO[p]?.label || p}.</p>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="mt-20 border-t border-slate-200 pt-6 text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dicetak dari Kalkulator Faraidh — Hasil bersifat simulasi edukatif</p>
                 <p className="text-[9px] text-slate-300 mt-1 italic">Hasil perhitungan ini merupakan simulasi berdasarkan parameter input yang Anda berikan.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
const Section = ({ title, children }) => (
  <div className="bg-white p-6 rounded-3xl border shadow-sm">
    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-3 mb-4">{title}</h3>
    {children}
  </div>
);

const SummaryRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className={`font-black ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>{formatIDR(value)}</span>
  </div>
);

const formatIDR = (v) => `Rp ${Math.round(Number(v) || 0).toLocaleString('id-ID')}`;

const punyaFarWaris = (aw) => (aw[HEIR.ANAK_LK] || 0) > 0 || (aw[HEIR.ANAK_PR] || 0) > 0 || (aw[HEIR.CUCU_LK] || 0) > 0 || (aw[HEIR.CUCU_PR] || 0) > 0;

// REUSED COMPONENTS
const CurrencyInput = ({ label, value, onChange, disabled, placeholder, error, onInfoClick }) => {
  const formatValue = (v) => v ? Number(v).toLocaleString('en-US') : '';
  const handleInputChange = (e) => onChange(e.target.value.replace(/\D/g, ''));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col ml-1">
        <label className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${error ? 'text-rose-500' : 'text-emerald-700'}`}>
          {label}
          {onInfoClick && (
            <button onClick={onInfoClick} className="text-slate-400 hover:text-emerald-600 transition-colors">ℹ️</button>
          )}
        </label>
      </div>
      <div className={`flex items-center border-2 rounded-2xl px-4 h-14 ${error ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-100 bg-white focus-within:border-emerald-600'}`}>
        <span className="text-slate-400 font-black mr-2 text-sm">Rp</span>
        <input type="text" value={formatValue(value)} onChange={handleInputChange} disabled={disabled} className="w-full outline-none bg-transparent font-black text-slate-800 placeholder:text-slate-200" placeholder={placeholder || "0"} />
      </div>
      {error && <p className="text-[9px] text-rose-500 font-bold ml-1">Masukkan nilai. Jika tidak ada, isi 0.</p>}
    </div>
  );
};

const StepperCard = ({ label, sub, value, onDec, onInc, max }) => (
  <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
    <div className="flex flex-col">
      <span className="font-extrabold text-slate-800 text-sm">{label}</span>
      {sub && <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 underline decoration-emerald-200">{sub}</span>}
    </div>
    <div className="flex items-center gap-5">
      <button onClick={onDec} className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xl active:bg-rose-50">-</button>
      <span className="w-6 text-center font-black text-2xl text-emerald-700 tabular-nums">{value}</span>
      <button onClick={() => { if (!max || value < max) onInc(); }} className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xl active:bg-emerald-50">+</button>
    </div>
  </div>
);

const ToggleCard = ({ label, sub, active, onToggle }) => (
  <button onClick={onToggle} className={`flex justify-between items-center p-5 rounded-3xl border-2 transition-all text-left ${active ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl translate-y--1' : 'bg-white border-slate-100 text-slate-400'}`}>
    <div className="flex flex-col">
      <span className="font-black text-[13px] uppercase tracking-tighter">{label}</span>
      {sub && <span className={`text-[8px] font-black uppercase ${active ? 'text-emerald-100' : 'text-slate-400 opacity-60'}`}>{sub}</span>}
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-white border-white' : 'bg-transparent border-slate-200'}`}>{active && "✓"}</div>
  </button>
);

const MiniStepper = ({ label, value, onUpdate }) => (
  <div className="flex justify-between items-center py-2 active:bg-emerald-50/50 rounded-lg px-2 -mx-2 transition-colors">
    <span className="text-xs font-black text-slate-600">{label}</span>
    <div className="flex items-center gap-4">
      <button onClick={() => onUpdate(-1)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold active:bg-rose-50">-</button>
      <span className="w-4 text-center font-black text-xs text-emerald-700">{value}</span>
      <button onClick={() => onUpdate(1)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold active:bg-emerald-50">+</button>
    </div>
  </div>
);

const AccordionSection = ({ title, id, active, onToggle, children }) => {
  const isOpen = active === id;
  return (
    <div className="bg-white rounded-3xl border shadow-sm transition-all duration-300">
      <button onClick={() => onToggle(isOpen ? null : id)} className={`w-full p-6 text-left font-black text-[13px] flex justify-between items-center ${isOpen ? 'text-emerald-800' : 'text-slate-800'}`}>
        <span>{title}</span>
        <span className={`text-[10px] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <div className={`px-6 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[800px] mb-6 opacity-100' : 'max-h-0 opacity-0'}`}>{children}</div>
    </div>
  );
};

const ResultCard = ({ name, count, badge, share, amount, perOrang, isMulti }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-transform active:scale-[0.98]">
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-black text-slate-800 uppercase tracking-tighter break-words">{count > 1 ? `${count}x ` : ''}{name}</span>
        <span className={`text-[7px] px-2 py-0.5 rounded-full font-black tracking-widest w-max ${badge.includes('ASHABAH') ? 'bg-amber-100 text-amber-700' : badge.includes('RADD') || share?.includes('Radd') ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {badge.includes('ASHABAH') ? 'ASHABAH' : share?.includes('Radd') ? 'RADD' : 'FURUDH'}
        </span>
      </div>
      <div className="bg-emerald-50 px-2 py-1 rounded-lg text-[9px] font-black text-emerald-600 uppercase w-max tracking-wide">BAGIAN: {share}</div>
      {isMulti && perOrang && <div className="text-[9px] text-slate-400 font-bold break-words">per orang: {formatIDR(perOrang)}</div>}
    </div>
    <div className="text-lg sm:text-xl font-black text-slate-800 tabular-nums break-words self-start sm:self-auto">{formatIDR(amount)}</div>
  </div>
);

export default App;
