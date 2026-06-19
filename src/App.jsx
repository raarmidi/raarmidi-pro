import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { 
  PlusCircle, Trash2, Package, Search, 
  CalendarDays, X, Phone, Edit3,
  TrendingUp, CalendarRange, ArrowLeft, CheckCircle2, Clock, History, 
  AlertTriangle, PieChart, Star, Ban, CalendarCheck, LayoutDashboard, Hash, MessageCircle,
  Wind, Scissors, Home, ChevronLeft, ChevronRight, Filter, SlidersHorizontal, Settings, Lock, Shield, Power, Users
} from 'lucide-react'
import { exportBackup } from "./utils/exportBackup";
import { useDialog } from "./useDialog";

function App() {
  const { DialogUI, alert, confirm } = useDialog()
  const [products, setProducts] = useState([])
  const [rentals, setRentals] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list') 
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedRental, setSelectedRental] = useState(null)

  // Filtre States
  const [activeFilter, setActiveFilter] = useState('TÜMÜ')
  const [sortBy, setSortBy] = useState('default')

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [name, setName] = useState(''); const [price, setPrice] = useState(''); const [file, setFile] = useState(null)
  const [customerName, setCustomerName] = useState(''); const [phone, setPhone] = useState('')
  const [tcNo, setTcNo] = useState(''); const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(''); const [deposit, setDeposit] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [isEditingRental, setIsEditingRental] = useState(false)
  const [tempRentalDate, setTempRentalDate] = useState('')
  const [tempRentalEndDate, setTempRentalEndDate] = useState('')
  const [tempDeposit, setTempDeposit] = useState(0)
  const [tempPhone, setTempPhone] = useState('')
  const [session, setSession] = useState(null)
const [currentClient, setCurrentClient] = useState(null);
  // --- PATRON (SUPER ADMIN) AYARLARI ---
  const PATRON_EMAIL = 'patron@raarmidi.com'; // KENDİ MAİLİNİ BURAYA YAZACAKSIN
  const [clients, setClients] = useState([]);
  
  // Patron panelindeki verileri çekmek için:
  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) setClients(data);
  }

  // Patron, "Lisans Uzat" butonuna basınca çalışacak kod
  const extendLicense = async (clientId, currentEndDate) => {
    const date = new Date(currentEndDate);
    date.setDate(date.getDate() + 30); // 30 Gün Ekle
    const newDate = date.toISOString().split('T')[0];
    
    setLoading(true);
    await supabase.from('clients').update({ license_end_date: newDate, is_active: true }).eq('id', clientId);
    await fetchClients();
    setLoading(false);
    alert("Lisans 30 gün uzatıldı!", { title: 'Başarılı', type: 'success' });
  }

  // Patron, "Şalteri İndir/Kaldır" butonuna basınca çalışacak kod
  const toggleClientStatus = async (clientId, currentStatus) => {
    const onay = await confirm(currentStatus ? "Bu dükkanın sisteme erişimini kapatmak (banlamak) istiyor musunuz?" : "Dükkanın erişimini tekrar açmak istiyor musunuz?");
    if (!onay) return;
    
    setLoading(true);
    await supabase.from('clients').update({ is_active: !currentStatus }).eq('id', clientId);
    await fetchClients();
    setLoading(false);
  }
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [historySearch, setHistorySearch] = useState('') // Kayıt geçmişi arama çubuğu için
// --- GİDER (EXPENSE) STATES ---
  const [showExpModal, setShowExpModal] = useState(false)
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('Kira')
  const [expCustomCat, setExpCustomCat] = useState('')
  const [expTitle, setExpTitle] = useState('')
  // --- AYARLAR STATES ---
  const [newPassword, setNewPassword] = useState('')
  // Dükkan adını tarayıcı hafızasında (localStorage) tutuyoruz ki yenilenince silinmesin
  const [shopName, setShopName] = useState(() => localStorage.getItem('shopName') || 'Abiyem Van')

  useEffect(() => {
    // Supabase Oturum Kontrolü
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // --- SUPABASE GİRİŞ YAPMA FONKSİYONU ---
  // --- SUPABASE GİRİŞ YAPMA FONKSİYONU ---
  // --- RÖNTGEN CİHAZLI GİRİŞ FONKSİYONU ---
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("1. GİRİŞ BUTONUNA BASILDI! Mail:", loginEmail);
    setAuthLoading(true);
    
    try {
      console.log("2. SUPABASE İLE İLETİŞİM KURULUYOR...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      console.log("3. SUPABASE'DEN CEVAP GELDİ!");
      if (error) {
        console.error("4. SUPABASE HATA FIRLATTI:", error.message);
        await alert("Giriş Başarısız: " + error.message, { title: 'Hata', type: 'danger' });
      } else {
        console.log("4. GİRİŞ BAŞARILI! Veri:", data);
      }
    } catch (err) {
      console.error("KRİTİK SİSTEM HATASI:", err);
      alert("Sistemde bir hata oluştu, lütfen F12 konsoluna bakın.");
    } finally {
      setAuthLoading(false);
      console.log("5. İŞLEM TAMAMLANDI, BUTON NORMALE DÖNDÜ.");
    }
  }

  // --- ŞİFRE DEĞİŞTİRME FONKSİYONU (Supabase Auth) ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      await alert("Şifre en az 6 karakter olmalıdır!", { title: 'Uyarı', type: 'warn' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      await alert("Şifre güncellenemedi: " + error.message, { title: 'Hata', type: 'danger' });
    } else {
      await alert("Şifreniz başarıyla güncellendi. Bir sonraki girişinizde yeni şifrenizi kullanabilirsiniz.", { title: 'Başarılı', type: 'success' });
      setNewPassword('');
    }
    setLoading(false);
  }

  // --- DÜKKAN AYARLARINI KAYDETME ---
  const saveShopSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('shopName', shopName);
    alert("Dükkan adı başarıyla güncellendi!", { title: 'Kaydedildi', type: 'success' });
  }

  // --- SUPABASE ÇIKIŞ YAPMA FONKSİYONU ---
  const handleLogout = async () => {
    const onay = await confirm("Hesabınızdan çıkış yapmak istediğinize emin misiniz?", { title: 'Çıkış Yap', type: 'warn', confirmLabel: 'Evet, Çıkış', cancelLabel: 'İptal' });
    if (onay) await supabase.auth.signOut();
  }
  
  // --- FOTOĞRAF SIKIŞTIRMA MOTORU ---
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Fotoğrafı maksimum 800px genişliğe çeker (Telefonda/PC'de jilet gibi görünür)
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // %70 kaliteyle JPEG olarak sıkıştır (10MB'ı ~150KB yapar)
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7); 
        };
      };
    });
  };

  // --- JSON YEDEK ALMA (DIŞA AKTAR) ---
  const exportJSONBackup = () => {
    const backupData = {
      products: products,
      rentals: rentals,
      expenses: expenses,
      timestamp: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadNode = document.createElement('a');
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", `AbiyemVan_SISTEM_YEDEGI_${getTodayDateString()}.json`);
    document.body.appendChild(downloadNode);
    downloadNode.click();
    downloadNode.remove();
  }

  // --- JSON YEDEĞİ YÜKLEME (İÇE AKTAR / GERİ YÜKLE) ---
  // --- JSON YEDEĞİ YÜKLEME (SON VE EN GÜÇLÜ VERSİYON) ---
  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        if (!jsonData.products || !jsonData.rentals || !jsonData.expenses) {
          await alert("Geçersiz veya bozuk yedek dosyası!", { title: 'Hata', type: 'danger' });
          return;
        }

        const onay = await confirm("DİKKAT! Sistemdeki mevcut tüm veriler silinip, yedekteki veriler yüklenecek. Emin misiniz?", { title: 'Sistemi Geri Yükle', type: 'danger', confirmLabel: 'Evet, Yükle', cancelLabel: 'İptal' });
        if (!onay) { e.target.value = ''; return; }

        setLoading(true);

        // 1. ESKİ VERİLERİ TEMİZLE (Kesin Silme Mantığı ve Hata Kontrolü)
        const { error: d1 } = await supabase.from('rentals').delete().not('id', 'is', null);
        if (d1) throw new Error("Eski kiralamalar silinemedi: " + d1.message);

        const { error: d2 } = await supabase.from('expenses').delete().not('id', 'is', null);
        if (d2) throw new Error("Eski giderler silinemedi: " + d2.message);

        const { error: d3 } = await supabase.from('products').delete().not('id', 'is', null);
        if (d3) throw new Error("Eski ürünler silinemedi: " + d3.message);

        // 2. YENİ VERİLERİ YÜKLE (UPSERT: Varsa üzerine yaz, yoksa ekle - Hata vermez!)
        if (jsonData.products.length > 0) {
          const { error: pErr } = await supabase.from('products').upsert(jsonData.products);
          if (pErr) throw new Error("Ürünler Yüklenemedi: " + pErr.message);
        }
        
        if (jsonData.rentals.length > 0) {
          const { error: rErr } = await supabase.from('rentals').upsert(jsonData.rentals);
          if (rErr) throw new Error("Kiralamalar Yüklenemedi: " + rErr.message);
        }
        
        if (jsonData.expenses.length > 0) {
          const { error: eErr } = await supabase.from('expenses').upsert(jsonData.expenses);
          if (eErr) throw new Error("Giderler Yüklenemedi: " + eErr.message);
        }

        await alert("Sistem başarıyla eski haline döndürüldü!", { title: 'Harika!', type: 'success' });
        fetchData(); // Başarılıysa ekranı yenile

      } catch (err) {
        // HATA VARSA EKRANA YAZ!
        await alert(err.message, { title: 'Geri Yükleme Durduruldu', type: 'danger' });
        fetchData(); 
      } finally {
        setLoading(false);
        e.target.value = ''; // Aynı dosyayı tekrar seçebilmek için inputu temizle
      }
    };
    reader.readAsText(file);
  }

  // GİDER EKLEME FONKSİYONU (Bunu addProduct fonksiyonunun oralara bir yere yapıştır)
  async function handleAddExpense(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const finalCat = expCategory === 'Diğer' ? expCustomCat : expCategory;
    await supabase.from('expenses').insert([{ title: expTitle, amount: parseInt(expAmount), category: finalCat }]);
    setExpAmount(''); setExpTitle(''); setExpCategory('Kira'); setExpCustomCat(''); setShowExpModal(false);
    fetchData(); // Verileri yenile
    setLoading(false);
  }
  useEffect(() => { fetchData() }, [])

 async function fetchData() {
    setLoading(true);
    try {
      // 1. GÜVENLİK KONTROLÜ (Patron değilse her veri çekildiğinde kontrol et)
      if (session && session.user.email !== PATRON_EMAIL) {
        const { data: clientData, error: clientErr } = await supabase
          .from('clients')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        if (clientData) {
          setCurrentClient(clientData); // En güncel ban/lisans bilgisini state'e at

          const isExpired = new Date(clientData.license_end_date) < new Date();
          
          // EĞER BANLIYSA VEYA SÜRESİ BİTTİYSE:
          if (!clientData.is_active || isExpired) {
             setProducts([]); // Verileri sakla (gösterme)
             setLoading(false);
             return; // Fonksiyonu burada durdur, aşağıya geçip verileri çekme!
          }
        } else {
          // Eğer clients tablosunda bu mail hiç yoksa, yine girişe izin verme
          await supabase.auth.signOut();
          return;
        }
      }

      // 2. EĞER GÜVENLİK GEÇİLDİYSE VERİLERİ ÇEK
      const { data: pData } = await supabase.from('products').select('*').order('id', { ascending: false });
      const { data: rData } = await supabase.from('rentals').select('*').order('start_date', { ascending: true });
      const { data: eData } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      
      setProducts(pData || []);
      setRentals(rData || []);
      setExpenses(eData || []);
    } catch (err) { 
      console.error("Sistem hatası:", err); 
    }
    setLoading(false);
  }
 



  

  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  }

  const getTomorrowDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localTomorrow = new Date(today.getTime() - (offset * 60 * 1000));
    localTomorrow.setDate(localTomorrow.getDate() + 1);
    return localTomorrow.toISOString().split('T')[0];
  }

  const handleDateLogic = (val, type = 'form') => {
    const date = new Date(val); 
    date.setDate(date.getDate() + 2); 
    const formatted = date.toISOString().split('T')[0];
    if (type === 'form') { setStartDate(val); setEndDate(formatted); }
    else { setTempRentalDate(val); setTempRentalEndDate(formatted); }
  }

  function getProductLocationStatus(prod) {
    const today = getTodayDateString();
    const activeRental = rentals.find(r =>
      r.product_id === prod.id && !r.is_archived &&
      today >= r.start_date && today <= r.end_date && r.status !== 'Tamamlandı'
    );
    if (activeRental) return { label: 'MÜŞTERİDE', color: 'bg-rose-500', icon: <Package size={12}/> };
    const futureRental = rentals.find(r =>
      r.product_id === prod.id && !r.is_archived &&
      r.start_date > today && r.status !== 'Tamamlandı'
    );
    if (futureRental) return { label: 'REZERVE', color: 'bg-violet-500', icon: <CalendarCheck size={12}/> };
    if (prod.status === 'Temizlikte') return { label: 'TEMİZLİKTE', color: 'bg-blue-500', icon: <Wind size={12}/> };
    if (prod.status === 'Terzide') return { label: 'TERZİDE', color: 'bg-amber-500', icon: <Scissors size={12}/> };
    return { label: 'MÜSAİT', color: 'bg-emerald-500', icon: <CheckCircle2 size={12}/> };
  }

  // --- FİLTRELEME + SIRALAMA ---
  // --- FİLTRELEME + SIRALAMA ---
  const FILTERS = [
    { key: 'TÜMÜ',        label: 'Tümü',       color: 'bg-slate-800 text-white',   inactive: 'bg-white text-slate-500 border hover:bg-slate-50' },
    { key: 'MÜSAİT',      label: 'Müsait',     color: 'bg-emerald-500 text-white', inactive: 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50' },
    { key: 'MÜŞTERİDE',   label: 'Müşteride',  color: 'bg-rose-500 text-white',    inactive: 'bg-white text-rose-500 border border-rose-200 hover:bg-rose-50' },
    // YENİ EKLENEN FİLTRELER
    { key: 'YARIN_GİDECEK', label: 'Yarın Gidecekler', color: 'bg-violet-500 text-white', inactive: 'bg-white text-violet-600 border border-violet-200 hover:bg-violet-50' },
    { key: 'YARIN_DÖNECEK', label: 'Yarın Dönecekler', color: 'bg-orange-500 text-white', inactive: 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50' },
    // BAŞKA İŞLETMELER İÇİN SAKLANAN (GİZLENEN) FİLTRELER
    { key: 'TERZİDE',     label: 'Terzide',    color: 'bg-amber-500 text-white',   inactive: 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50' }
    /* { key: 'REZERVE',    label: 'Rezerve',    color: 'bg-violet-500 text-white',  inactive: 'bg-white text-violet-600 border border-violet-200 hover:bg-violet-50' }, */
    /* { key: 'TEMİZLİKTE', label: 'Temizlikte', color: 'bg-blue-500 text-white',    inactive: 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50' }, */
    /* { key: 'TERZİDE',    label: 'Terzide',    color: 'bg-amber-500 text-white',   inactive: 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50' }, */
  ]

  const rentalCountMap = products.reduce((acc, p) => {
    acc[p.id] = rentals.filter(r => r.product_id === p.id).length
    return acc
  }, {})

  const filterCounts = FILTERS.reduce((acc, f) => {
    if (f.key === 'TÜMÜ') { acc['TÜMÜ'] = products.length; return acc }
    
    // YENİ FİLTRELERİN SAYIM MANTIĞI
    if (f.key === 'YARIN_GİDECEK') {
        const tomorrow = getTomorrowDateString();
        acc[f.key] = products.filter(p => rentals.some(r => r.product_id === p.id && !r.is_archived && r.start_date === tomorrow && r.status !== 'Tamamlandı')).length;
        return acc;
    }
    if (f.key === 'YARIN_DÖNECEK') {
        const tomorrow = getTomorrowDateString();
        acc[f.key] = products.filter(p => rentals.some(r => r.product_id === p.id && !r.is_archived && r.end_date === tomorrow && r.status !== 'Tamamlandı')).length;
        return acc;
    }

    acc[f.key] = products.filter(p => getProductLocationStatus(p).label === f.key).length
    return acc
  }, {})

  const filteredAndSorted = products
    .filter(p => {
      // YENİ ARAMA MANTIĞI: Ürün adına VEYA bu ürünü kiralayan müşterinin adına bak
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                            rentals.some(r => r.product_id === p.id && !r.is_archived && r.customer_name.toLowerCase().includes(searchLower));
      const loc = getProductLocationStatus(p)
      
      let matchesFilter = false;
      if (activeFilter === 'TÜMÜ') {
          matchesFilter = true;
      } else if (activeFilter === 'YARIN_GİDECEK') {
          const tomorrow = getTomorrowDateString();
          matchesFilter = rentals.some(r => r.product_id === p.id && !r.is_archived && r.start_date === tomorrow && r.status !== 'Tamamlandı');
      } else if (activeFilter === 'YARIN_DÖNECEK') {
          const tomorrow = getTomorrowDateString();
          matchesFilter = rentals.some(r => r.product_id === p.id && !r.is_archived && r.end_date === tomorrow && r.status !== 'Tamamlandı');
      } else {
          matchesFilter = loc.label === activeFilter;
      }

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'tr')
      if (sortBy === 'most_rented') return (rentalCountMap[b.id] || 0) - (rentalCountMap[a.id] || 0)
      return 0
    })

  // --- TAKVİM ---
  // --- TAKVİM ---
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const calendarDays = [];

    // Boş günler
    for (let i = 0; i < startDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="min-h-[140px] bg-slate-50/50 border-b border-r border-slate-100"></div>);
    }

    // Dolu günler
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRentals = rentals.filter(r => !r.is_archived && dateStr >= r.start_date && dateStr <= r.end_date);
      const isToday = dateStr === getTodayDateString();

      calendarDays.push(
        <div key={day} className={`min-h-[140px] border-b border-r border-slate-100 p-2 md:p-3 transition-all group ${isToday ? 'bg-indigo-50/40' : 'bg-white hover:bg-slate-50'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 group-hover:text-slate-700'}`}>{day}</span>
            {dayRentals.length > 0 && <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{dayRentals.length} İşlem</span>}
          </div>
          
          <div className="space-y-1.5 max-h-[95px] overflow-y-auto scrollbar-hide pr-1">
            {dayRentals.map(r => {
              const prod = products.find(p => p.id === r.product_id);
              
              // Estetik Durum Renkleri
              let statusColors = 'bg-indigo-50 text-indigo-700 border-indigo-100'; // Beklemede
              if (r.status === 'Ödendi') statusColors = 'bg-emerald-50 text-emerald-700 border-emerald-100';
              if (r.status === 'Tamamlandı') statusColors = 'bg-slate-50 text-slate-400 border-slate-200 opacity-70';

              return (
                <div key={r.id} onClick={() => { setSelectedRental(r); setTempPhone(r.phone || ''); setTempRentalDate(r.start_date); setTempRentalEndDate(r.end_date); setTempDeposit(r.deposit_amount); setView('rental-detail'); }}
                  className={`text-[9px] font-bold p-2 rounded-lg border cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex flex-col ${statusColors}`}
                  title={`${prod?.name || 'Ürün'} - ${r.customer_name}`}
                >
                  <span className="font-black uppercase truncate">{r.customer_name}</span> 
                  <span className="opacity-70 text-[8px] truncate">{prod?.name || 'Ürün'}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return calendarDays;
  };

  // --- WHATSAPP ---
  const sendWhatsAppReminder = async (rental) => {
    if (!rental.phone) { await alert("Telefon numarası kayıtlı değil!", { title: 'Uyarı', type: 'warn' }); return }
    let cleanPhone = rental.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;
    const productName = products.find(p => p.id === rental.product_id)?.name || "Ürün";
    const message = `Sayın ${rental.customer_name}, kiraladığınız ${productName} modelimizin iade günü bugündür (${rental.end_date}). İyi günler dileriz.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  // --- İSTATİSTİKLER ---
  const todayStr = getTodayDateString();
  const todayRentals = rentals.filter(r => r.end_date === todayStr && !r.is_archived && r.status !== 'Tamamlandı');
  const totalCiro = rentals.filter(r => r.status === 'Ödendi' || r.status === 'Tamamlandı').reduce((acc, curr) => acc + (curr.total_price || 0), 0)
  const totalBekleyen = rentals.filter(r => r.status === 'Beklemede').length
  const totalProductCount = products.length;
  const productStats = products.map(p => ({ ...p, count: rentals.filter(r => r.product_id === p.id).length })).sort((a, b) => b.count - a.count);
  const topProducts = productStats.filter(p => p.count > 0).slice(0, 5);
  const nonRentedProducts = productStats.filter(p => p.count === 0);

  // --- ACTIONS ---
  // --- ÜRÜN EKLEME (SIKIŞTIRMALI) ---
  async function addProduct(e) {
    e.preventDefault(); 
    if (loading || !file) { alert("Lütfen bir fotoğraf seçin!"); return; }
    setLoading(true); 
    
    try {
      // 1. Fotoğrafı Sıkıştır
      const compressedFile = await compressImage(file);
      
      // 2. Sıkıştırılmış Fotoğrafı Yükle
      const fileName = `${Date.now()}_compressed.jpg`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, compressedFile);
      
      if (uploadError) throw new Error("Fotoğraf yüklenemedi!");
      
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      
      // 3. Veritabanına Yaz
      const { error: dbError } = await supabase.from('products').insert([{ name, price: parseInt(price), image_url: urlData.publicUrl, status: 'Müsait' }]);
      if (dbError) throw new Error("Veritabanına kaydedilemedi.");

      setName(''); setPrice(''); setFile(null); fetchData();
      alert("Ürün başarıyla eklendi! (Fotoğraf sıkıştırıldı)");

    } catch (error) {
      alert("HATA: " + error.message);
    }
    setLoading(false);
  }

  async function updateProductStatus(newStatus) {
    setLoading(true)
    await supabase.from('products').update({ status: newStatus }).eq('id', selectedProduct.id)
    setSelectedProduct({ ...selectedProduct, status: newStatus })
    fetchData(); setLoading(false)
  }

  // --- ÜRÜN GÜNCELLEME (Eski Fotoğrafı Silen ve Yeni Fotoğrafı Sıkıştıran Versiyon) ---
  async function updateProduct() {
    setLoading(true)
    let updates = { name: selectedProduct.name, price: parseInt(selectedProduct.price) }
    
    if (file) {
      try {
        // 1. ADIM: ESKİ FOTOĞRAFI DEPODAN SİL
        if (selectedProduct.image_url) {
          // İnternet adresinin en sonundaki dosya adını (örn: 171324_compressed.jpg) koparıp alıyoruz
          const oldFileName = selectedProduct.image_url.split('/').pop();
          // Supabase'e "Bunu sil" diyoruz
          await supabase.storage.from('product-images').remove([oldFileName]);
        }

        // 2. ADIM: YENİ FOTOĞRAFI SIKIŞTIR VE YÜKLE
        const compressedFile = await compressImage(file); // Sıkıştırma motorunu burada da kullanıyoruz
        const fileName = `${Date.now()}_compressed.jpg`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, compressedFile)
        
        if (uploadError) throw new Error("Yeni fotoğraf yüklenemedi!");
        
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        updates.image_url = urlData.publicUrl

      } catch (err) {
        alert("Hata: " + err.message);
        setLoading(false);
        return; // Hata varsa kaydetme işlemini durdur
      }
    }

    // 3. ADIM: VERİTABANINI GÜNCELLE
    await supabase.from('products').update(updates).eq('id', selectedProduct.id)
    
    // YENİ EKLENEN SATIR: Ekranda açık olan ürünün fotoğrafını ve bilgilerini anında yenile!
    setSelectedProduct(prev => ({ ...prev, ...updates }));

    setEditMode(false); setFile(null); fetchData(); setLoading(false)
  }

  async function handleRent(e) {
    e.preventDefault();
    if (loading) return; // Çift tıklamayı (iki kere eklemeyi) anında engeller!

    const loc = getProductLocationStatus(selectedProduct);
    if (loc.label !== 'MÜSAİT') {
      const onay = await confirm(`Bu ürün şu an "${loc.label}" durumunda. Yine de rezervasyon yapmak istiyor musunuz?`, { title: 'Dikkat!', type: 'warn', confirmLabel: 'Evet, Ekle', cancelLabel: 'İptal' })
      if (!onay) return;
    }

    const hasConflict = rentals.some(r => {
      if (r.product_id !== selectedProduct.id || r.is_archived || r.status === 'Tamamlandı') return false;
      return (startDate <= r.end_date && endDate >= r.start_date);
    });
    
    if (hasConflict) { 
      await alert("Bu tarih aralığı dolu!", { title: 'Tarih Çakışması', type: 'danger' }); 
      return; 
    }

    setLoading(true); // Sistemi "Yükleniyor" moduna al
    
    // VERİTABANINA YAZMA VE HATAYI YAKALAMA AŞAMASI
    const { error } = await supabase.from('rentals').insert([{
      product_id: selectedProduct.id, 
      customer_name: customerName, 
      phone, 
      tc_no: tcNo,
      start_date: startDate, 
      end_date: endDate, 
      deposit_amount: parseInt(deposit) || 0,
      total_price: parseInt(selectedProduct.price), 
      status: 'Beklemede', 
      is_archived: false
    }]);

    setLoading(false); // Yüklemeyi bitir

    // EĞER HATA VARSA EKRANA YAZ VE DUR!
    if (error) {
      console.error("Kayıt Hatası:", error);
      await alert("Kayıt başarısız: " + error.message, { title: 'Veritabanı Hatası', type: 'danger' });
      return;
    }

    // HATA YOKSA FORMU TEMİZLE VE BİLGİ VER
    setCustomerName(''); setPhone(''); setTcNo(''); setStartDate(''); setEndDate(''); setDeposit(0);
    fetchData(); // Listeyi yenile
    await alert("Rezervasyon başarıyla eklendi!", { title: 'Tamamlandı', type: 'success' });
  }

  async function saveRentalUpdate() {
    setLoading(true)
    await supabase.from('rentals').update({
      start_date: tempRentalDate, end_date: tempRentalEndDate,
      deposit_amount: parseInt(tempDeposit), phone: tempPhone
    }).eq('id', selectedRental.id)
    setIsEditingRental(false); fetchData();
    await alert("Bilgiler güncellendi!", { title: 'Kaydedildi', type: 'success' })
  }

  async function updateRentalStatus(id, newStatus) {
    setLoading(true)
    await supabase.from('rentals').update({ status: newStatus }).eq('id', id)
    await fetchData();
    if (selectedRental) setSelectedRental(prev => ({ ...prev, status: newStatus }))
    setLoading(false)
  }

// EĞER KULLANICI GİRİŞ YAPMAMIŞSA, BU ŞIK GİRİŞ EKRANINI GÖSTER
  if (!session) {
    
    return (
      
      <>
        <DialogUI /> {/* <--- HATA PENCEREMİZ BURAYA EKLENDİ */}
        
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 md:p-12 border">
            {/* WHITE-LABEL MANTIĞI: Dükkanın Adı */}
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{shopName}</h1>
              <p className="text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase">Yönetim Paneli</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">E-Posta Adresi</label>
                <input 
                  type="email" required 
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)} 
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border focus:ring-2 ring-indigo-500" 
                  placeholder="Örn: işletmeadı@moda.com" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Şifre</label>
                <input 
                  type="password" required 
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)} 
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border focus:ring-2 ring-indigo-500" 
                  placeholder="••••••••" 
                />
              </div>
              <button disabled={authLoading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                {authLoading ? 'GİRİŞ YAPILIYOR...' : 'SİSTEME GİRİŞ YAP'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Powered by <span className="text-indigo-600">Raarmidi Web Studio</span></p>
            </div>
          </div>
        </div>
      </>
    )
  }
// EĞER GİRİŞ YAPAN KİŞİ "PATRON" İSE, ONA DÜKKANI DEĞİL YÖNETİM PANELİNİ GÖSTER
  if (session && session.user.email === PATRON_EMAIL) {
    if (clients.length === 0) fetchClients(); // Verileri getir

    return (
      <>
        <DialogUI /> {/* <--- SİSTEMİ DONDURMAYI ENGELLEYEN SİHİRLİ KOD BURADA */}
        
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-10 font-sans">
          <header className="max-w-[1200px] mx-auto flex justify-between items-center mb-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/50"><Shield size={24}/></div>
              <div>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">RaarMidi <span className="text-indigo-400">HQ</span></h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Süper Admin Kontrol Merkezi</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-5 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-black text-xs uppercase hover:bg-rose-500 hover:text-white transition-all">Sistemden Çık</button>
          </header>

          <main className="max-w-[1200px] mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 md:p-10 backdrop-blur-md">
              <h2 className="text-lg font-black uppercase mb-6 flex items-center gap-2"><Users className="text-indigo-400"/> Aktif Müşteriler (Lisanslar)</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase text-slate-400 tracking-widest">
                      <th className="p-4 font-black">Dükkan Adı</th>
                      <th className="p-4 font-black">E-Posta (Giriş)</th>
                      <th className="p-4 font-black text-center">Kalan Süre</th>
                      <th className="p-4 font-black text-center">Durum</th>
                      <th className="p-4 font-black text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => {
                      // Kalan günü hesapla
                      const diffTime = Math.abs(new Date(client.license_end_date) - new Date());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isExpired = new Date(client.license_end_date) < new Date();

                      return (
                        <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="p-4 font-black text-sm">{client.shop_name}</td>
                          <td className="p-4 text-xs font-bold text-slate-300">{client.email}</td>
                          <td className="p-4 text-center">
                            {isExpired 
                              ? <span className="text-rose-500 font-black text-xs">SÜRE BİTTİ</span> 
                              : <span className="text-emerald-400 font-black text-xs">{diffDays} Gün</span>}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${client.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                              {client.is_active ? 'Aktif' : 'Banlı'}
                            </span>
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2">
                            <button onClick={() => extendLicense(client.id, client.license_end_date)} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase transition-all">+30 Gün Uzat</button>
                            <button onClick={() => toggleClientStatus(client.id, client.is_active)} title={client.is_active ? 'Dükkanı Kapat' : 'Dükkanı Aç'} className={`p-2 rounded-xl transition-all ${client.is_active ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}>
                              <Power size={16}/>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </>
    )
  }
  const isLicenseExpired = currentClient && new Date(currentClient.license_end_date) < new Date();
  const isBanned = currentClient && !currentClient.is_active;

  // 1. Durum: Eğer kullanıcı BANLI veya SÜRESİ BİTMİŞSE (Ve Patron değilse)
  if (session && session.user.email !== PATRON_EMAIL && (isLicenseExpired || isBanned)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full text-center space-y-8 p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-xl">
          <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl mx-auto flex items-center justify-center">
            <Ban size={40} />
          </div>
          <h1 className="text-2xl font-black italic uppercase">ERİŞİM KISITLANDI</h1>
          <p className="text-slate-400 font-bold text-sm">
            {isBanned ? "Hesabınız dondurulmuştur." : "Lisans süreniz dolmuştur."}
          </p>
          <button onClick={handleLogout} className="w-full bg-rose-600 py-4 rounded-2xl font-black uppercase text-xs">Çıkış Yap</button>
        </div>
      </div>
    );
  }

  // 2. Durum: Eğer kullanıcı PATRON ise
  if (session && session.user.email === PATRON_EMAIL) {
    if (clients.length === 0) fetchClients();
    return (
      <>
        <DialogUI />
        <div className="min-h-screen bg-slate-900 text-white p-10">
          {/* Buraya sana daha önce verdiğim koca Süper Admin HTML kodları gelecek */}
          <h1 className="text-2xl font-black">HOŞ GELDİN PATRON</h1>
          <button onClick={handleLogout} className="mt-4 text-rose-400">Çıkış</button>
          {/* ... admin tablosu vs ... */}
        </div>
      </>
    );
  }
  return (
    
    <>
      <DialogUI />

      {/* ── LIST ── */}
      {view === 'list' && (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">

          {/* NAV */}
          <nav className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-[100] px-6 py-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><LayoutDashboard size={20}/></div>
              <h1 className="font-black text-xl tracking-tighter uppercase italic">{shopName}</h1>
            </div>
            <div className="order-3 lg:order-2 w-full lg:w-96 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input
                className="w-full bg-slate-100 rounded-2xl py-2.5 pl-12 pr-4 outline-none focus:ring-2 ring-indigo-500 text-sm font-bold"
                placeholder="Ürün veya Müşteri Ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 order-2 lg:order-3">
              {/* Ayarlar Butonu (YENİ) */}
              <button onClick={() => setView('settings')} className="p-3 bg-white border rounded-2xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"><Settings size={20}/></button>
              
              <button onClick={() => setView('calendar')} className="p-3 bg-white border rounded-2xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"><CalendarDays size={20}/></button>
              
              <button onClick={() => setView('stats')} className="bg-slate-900 text-white px-5 py-2 rounded-2xl flex items-center gap-4 hover:scale-105 transition-all shadow-xl active:scale-95">
                <div className="text-right border-r border-white/10 pr-4">
                  <p className="text-[9px] font-black text-indigo-400 uppercase leading-none mb-1">Ciro</p>
                  <p className="font-black text-lg leading-none">{totalCiro} TL</p>
                </div>
                <TrendingUp size={20} className="text-emerald-400"/>
              </button>
              
              {/* Çıkış Yap Butonu */}
              <button onClick={handleLogout} title="Güvenli Çıkış Yap" className="p-2 ml-2 text-rose-500 hover:bg-rose-50 hover:shadow-sm rounded-xl transition-all border border-rose-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </button>
            </div>
          </nav>

          {/* ── FİLTRE BARI ── */}
          <div className="bg-white border-b px-6 py-3 sticky top-[73px] z-[90] shadow-sm">
            <div className="max-w-[1350px] mx-auto flex flex-wrap items-center justify-between gap-3">

              {/* Durum butonları */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-400 mr-1">
                  <Filter size={13}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Filtre</span>
                </div>
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all active:scale-95 ${activeFilter === f.key ? f.color + ' shadow-md' : f.inactive}`}
                  >
                    {f.label}
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeFilter === f.key ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                      {filterCounts[f.key] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sıralama + sıfırla */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <SlidersHorizontal size={13}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Sırala</span>
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-slate-100 text-slate-700 font-black text-[10px] uppercase px-3 py-2 rounded-xl outline-none cursor-pointer hover:bg-slate-200 transition-all"
                >
                  <option value="default">Varsayılan</option>
                  <option value="price_asc">Fiyat ↑</option>
                  <option value="price_desc">Fiyat ↓</option>
                  <option value="name_asc">İsim A→Z</option>
                  <option value="most_rented">En Çok Kiralanan</option>
                </select>
                {(activeFilter !== 'TÜMÜ' || sortBy !== 'default' || searchTerm) && (
                  <button
                    onClick={() => { setActiveFilter('TÜMÜ'); setSortBy('default'); setSearchTerm(''); }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-500 text-[10px] font-black uppercase hover:bg-rose-100 transition-all"
                  >
                    <X size={11}/> Sıfırla
                  </button>
                )}
              </div>
            </div>

            {/* Sonuç bilgisi */}
            <div className="max-w-[1350px] mx-auto mt-1.5">
              <p className="text-[10px] text-slate-400 font-bold">
                {filteredAndSorted.length === products.length
                  ? `${products.length} ürün listeleniyor`
                  : `${filteredAndSorted.length} / ${products.length} ürün gösteriliyor`}
                {activeFilter !== 'TÜMÜ' && (
                  <span className="ml-2 text-indigo-500">· {FILTERS.find(f => f.key === activeFilter)?.label} filtresi aktif</span>
                )}
              </p>
            </div>
          </div>

          {/* GRID */}
          <main className="max-w-[1350px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <aside className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border sticky top-[148px] lg:-ml-10">
                <h2 className="font-black text-[10px] uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2 italic"><PlusCircle size={14}/> Yeni Ürün Tanımla</h2>
                <form onSubmit={addProduct} className="space-y-4">
                  <input required placeholder="Model İsmi" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" />
                  <input required placeholder="Fiyat" type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" />
                  <input type="file" onChange={e => setFile(e.target.files[0])} className="text-[10px] w-full font-bold text-slate-400" />
                  <button disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">EKLE</button>
                </form>
                <div className="mt-8 pt-8 border-t">
                  <h3 className="font-black text-[10px] uppercase text-rose-500 mb-4 flex items-center gap-2 italic"><CalendarCheck size={16}/> Bugün Getirilecekler ({todayRentals.length})</h3>
                  <div className="space-y-3">
                    {todayRentals.length === 0
                      ? <p className="text-[10px] text-slate-300 font-bold text-center py-4">İade bekleyen ürün yok</p>
                      : todayRentals.map(r => (
                        <div key={r.id} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 shadow-sm flex flex-col gap-3">
                          <div className="cursor-pointer" onClick={() => { setSelectedRental(r); setTempPhone(r.phone || ''); setTempRentalDate(r.start_date); setTempRentalEndDate(r.end_date); setTempDeposit(r.deposit_amount); setView('rental-detail'); }}>
                            <p className="text-[11px] font-black text-slate-700 uppercase truncate">{r.customer_name}</p>
                            <p className="text-[9px] font-bold text-rose-400 mt-1 uppercase italic">Detaylara Git →</p>
                          </div>
                          <button onClick={() => sendWhatsAppReminder(r)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-[9px] font-black flex items-center justify-center gap-2 transition-all">
                            <MessageCircle size={14}/> WHATSAPP HATIRLAT
                          </button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </aside>

            <section className="lg:col-span-9">
              {filteredAndSorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                    <Search size={28} className="text-slate-300"/>
                  </div>
                  <p className="font-black text-slate-300 uppercase text-sm tracking-widest">Ürün Bulunamadı</p>
                  <p className="text-[11px] text-slate-300 mt-2">Filtre veya arama kriterini değiştir</p>
                  <button onClick={() => { setActiveFilter('TÜMÜ'); setSortBy('default'); setSearchTerm(''); }} className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">Filtreyi Sıfırla</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 items-start">
                  {filteredAndSorted.map(p => {
                    const loc = getProductLocationStatus(p);
                    return (
                      <div key={p.id} onClick={() => { setSelectedProduct(p); setView('detail'); }} className="bg-white rounded-[2.5rem] overflow-hidden border hover:shadow-xl transition-all cursor-pointer group flex flex-col relative">
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[8px] font-black shadow-lg text-white flex items-center gap-1.5 ${loc.color}`}>
                            {loc.icon} {loc.label}
                          </div>
                          {rentalCountMap[p.id] > 0 && (
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black px-2 py-1 rounded-full">
                              {rentalCountMap[p.id]}× kiralandı
                            </div>
                          )}
                        </div>
                        <div className="p-3 text-center">
                          <h4 className="font-black uppercase text-slate-700 tracking-tighter truncate text-xs mb-1">{p.name}</h4>
                          <p className="text-indigo-600 font-black text-xs">{p.price} TL</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </main>
        </div>
      )}

      {/* ── CALENDAR ── */}
      {view === 'calendar' && (
        <div className="min-h-screen bg-[#f8fafc]">
          
          {/* MOBİL UYUMLU HEADER */}
          <header className="px-4 md:px-8 py-4 md:py-6 bg-white border-b flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-[100] shadow-sm">
            <button onClick={() => setView('list')} className="w-full md:w-auto flex items-center justify-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-indigo-600 transition-all bg-slate-50 md:bg-transparent py-3 md:py-0 rounded-xl border md:border-none"><ArrowLeft size={16}/> Ana Sayfaya Dön</button>
            
            <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-2xl border md:border-none">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-3 bg-white md:bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all shadow-sm md:shadow-none"><ChevronLeft size={20}/></button>
              <h2 className="font-black text-lg md:text-xl uppercase tracking-tighter italic min-w-[150px] text-center text-slate-800">{currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-3 bg-white md:bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all shadow-sm md:shadow-none"><ChevronRight size={20}/></button>
            </div>
            
            <div className="hidden md:block w-32"></div> {/* Masaüstünde ortalamak için boşluk */}
          </header>

          <main className="p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto bg-white rounded-3xl md:rounded-[3rem] shadow-xl border overflow-hidden">
              
              {/* MOBİLDE YATAY KAYDIRMA ALANI (İşin Sırrı Burası) */}
              <div className="w-full overflow-x-auto scrollbar-hide">
                <div className="min-w-[900px] lg:w-full">
                  
                  {/* HAFTANIN GÜNLERİ */}
                  <div className="grid grid-cols-7 bg-slate-900 text-white">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                      <div key={day} className="py-4 text-center text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-300">{day}</div>
                    ))}
                  </div>
                  
                  {/* TAKVİM IZGARASI */}
                  <div className="grid grid-cols-7 bg-slate-50">{renderCalendar()}</div>
                
                </div>
              </div>

            </div>
            
            {/* BİLGİ ETİKETLERİ */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:gap-8 px-4 pb-10 md:pb-0">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black text-slate-600 uppercase">Kiralamada</span></div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-slate-600 uppercase">Ödendi</span></div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm"><div className="w-3 h-3 rounded-full bg-slate-400"></div><span className="text-[10px] font-black text-slate-600 uppercase">Tamamlandı</span></div>
            </div>
          </main>
        </div>
      )}

      {/* ── SETTINGS (AYARLAR) ── */}
      {view === 'settings' && (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 lg:p-12 overflow-x-hidden">
          
          <header className="max-w-[1000px] mx-auto flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] border shadow-sm sticky top-4 z-50">
            <button onClick={() => setView('list')} className="flex items-center gap-2 font-black text-xs text-slate-500 uppercase hover:text-indigo-600 transition-all"><ArrowLeft size={16}/> Listeye Dön</button>
            <h2 className="font-black text-xl uppercase tracking-tighter italic text-slate-800 flex items-center gap-2"><Settings className="text-slate-400" size={24}/> Sistem <span className="text-indigo-600">Ayarları</span></h2>
            <div className="w-24"></div> {/* Ortalamak için boşluk */}
          </header>

          <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* GÜVENLİK KARTI */}
            <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><Lock size={24}/></div>
                <div>
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">Güvenlik</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hesap Şifresini Değiştir</p>
                </div>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Yeni Şifreniz</label>
                  <input type="password" required minLength="6" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border focus:ring-2 ring-rose-500" placeholder="En az 6 karakter girin" />
                </div>
                <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all">ŞİFREYİ GÜNCELLE</button>
              </form>
            </div>

            {/* ÖZELLEŞTİRME KARTI */}
            <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Edit3 size={24}/></div>
                <div>
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">Özelleştirme</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dükkan Bilgileri</p>
                </div>
              </div>
              <form onSubmit={saveShopSettings} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">İşletme Adı (Ekranda Görünecek İsim)</label>
                  <input type="text" required value={shopName} onChange={e => setShopName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border focus:ring-2 ring-indigo-500" placeholder="Örn: Ayşe Moda Evi" />
                </div>
                <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all">BİLGİLERİ KAYDET</button>
              </form>
            </div>

            {/* VERİ YÖNETİMİ VE YEDEKLEME KARTI (Geniş Kart) */}
            <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-xl text-white md:col-span-2">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h3 className="font-black text-xl text-white uppercase tracking-tight flex items-center gap-3"><History className="text-emerald-400" size={24}/> Veri Güvenliği & Yedekleme</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistemi İndir Veya Geri Yükle</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Excel Butonu */}
                <button onClick={() => exportBackup(products, rentals)} className="bg-white/10 hover:bg-white/20 p-6 rounded-3xl border border-white/10 text-left transition-all group">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </div>
                  <h4 className="font-black text-sm uppercase text-slate-100 mb-1">Excel Tablosu İndir</h4>
                  <p className="text-[10px] font-bold text-slate-400">Ürün ve kiralamaları okunabilir formatta indirir.</p>
                </button>

                {/* Tam Yedek Al (JSON) */}
                <button onClick={exportJSONBackup} className="bg-white/10 hover:bg-white/20 p-6 rounded-3xl border border-white/10 text-left transition-all group">
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" x2="15" y1="9" y2="9"/><line x1="12" x2="12" y1="12" y2="12"/></svg>
                  </div>
                  <h4 className="font-black text-sm uppercase text-slate-100 mb-1">Tam Sistem Yedeği Al</h4>
                  <p className="text-[10px] font-bold text-slate-400">Tüm veritabanını kurtarma dosyası (JSON) olarak indirir.</p>
                </button>

                {/* Yedeği Geri Yükle (JSON) */}
                <label className="bg-rose-500/10 hover:bg-rose-500/20 p-6 rounded-3xl border border-rose-500/30 text-left transition-all group cursor-pointer relative overflow-hidden">
                  <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  </div>
                  <h4 className="font-black text-sm uppercase text-rose-400 mb-1">Sistemi Geri Yükle</h4>
                  <p className="text-[10px] font-bold text-rose-400/70">Aldığınız JSON yedeğini yükleyerek sistemi kurtarın.</p>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>

              </div>
            </div>

          </div>
        </div>
      )}
      
      {/* ── DETAIL ── */}
      {view === 'detail' && selectedProduct && (() => {
        const loc = getProductLocationStatus(selectedProduct);
        return (
          <div className="min-h-screen bg-white">
            <header className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-[100]">
              <button onClick={() => setView('list')} className="flex items-center gap-2 font-black text-[10px] text-slate-400 uppercase hover:text-indigo-600 transition-all"><ArrowLeft size={16}/> Listeye Dön</button>
              <div className="flex gap-2">
                <button onClick={() => setEditMode(!editMode)} className={`p-2.5 rounded-xl ${editMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}><Edit3 size={18}/></button>
                <button onClick={async () => {
                  const onay = await confirm("Bu ürün kalıcı olarak silinecek.", { title: 'Ürünü Sil?', type: 'danger', confirmLabel: 'Evet, Sil', cancelLabel: 'İptal' })
                  if (onay) { await supabase.from('products').delete().eq('id', selectedProduct.id); fetchData(); setView('list'); }
                }} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl"><Trash2 size={18}/></button>
              </div>
            </header>
            <main className="max-w-[1500px] mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-6">
                <div className="rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-slate-50 relative aspect-[3/4.5]">
                  <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                  <div className={`absolute bottom-6 left-6 right-6 p-4 rounded-2xl backdrop-blur-md text-white border border-white/20 flex items-center justify-between shadow-2xl ${loc.color}`}>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase">{loc.icon} {loc.label}</div>
                  </div>
                </div>
                {/* HIZLI DURUM DEĞİŞTİR (TERZİ / DÜKKAN) */}
  <div className="bg-slate-50 p-6 rounded-[2rem] border space-y-3 shadow-sm mb-6">
    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 px-2 italic">Hızlı Konum Değiştir</h4>
    <div className="grid grid-cols-2 gap-2">
      <button 
        onClick={() => updateProductStatus('Müsait')} 
        className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${selectedProduct.status === 'Müsait' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-400 hover:border-emerald-200'}`}
      >
        <Home size={16}/>
        <span className="text-[8px] font-black">DÜKKANDA (MÜSAİT)</span>
      </button>
      
      <button 
        onClick={() => updateProductStatus('Terzide')} 
        className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${selectedProduct.status === 'Terzide' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-400 hover:border-amber-200'}`}
      >
        <Scissors size={16}/>
        <span className="text-[8px] font-black">TERZİDE</span>
      </button>
    </div>
  </div>
                {editMode && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border space-y-3">
                    <input value={selectedProduct.name} onChange={e => setSelectedProduct({ ...selectedProduct, name: e.target.value })} className="w-full p-4 rounded-xl border-none font-bold text-sm outline-none shadow-sm" />
                    <input value={selectedProduct.price} type="number" onChange={e => setSelectedProduct({ ...selectedProduct, price: e.target.value })} className="w-full p-4 rounded-xl border-none font-bold text-sm outline-none shadow-sm" />
                    
                    {/* İŞTE EKSİK OLAN VE YENİ EKLEDİĞİMİZ SATIR BURASI */}
                    <input type="file" onChange={e => setFile(e.target.files[0])} className="text-[10px] w-full font-bold text-slate-400" />
                    
                    <button onClick={updateProduct} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">KAYDET</button>
                  </div>
                )}
              </div>
              <div className="lg:col-span-8 space-y-10">
                <div className={`p-8 md:p-10 rounded-[3rem] text-white shadow-xl transition-all duration-500 ${loc.label === 'MÜSAİT' ? 'bg-slate-900' : 'bg-rose-900/90'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="font-black text-xl flex items-center gap-3 uppercase italic tracking-tighter"><CalendarRange className="text-indigo-400" /> Rezervasyon Oluştur</h3>
                    {loc.label !== 'MÜSAİT' && <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 border border-white/10 animate-pulse"><AlertTriangle size={14} className="text-amber-400"/> ÜRÜN ŞU AN {loc.label}</div>}
                  </div>
                  <form onSubmit={handleRent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <input required placeholder="Müşteri Ad Soyad" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-4 bg-white/10 rounded-xl border-none text-white font-bold placeholder:text-white/20 text-sm outline-none" />
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Telefon" value={phone} onChange={e => setPhone(e.target.value)} className="p-4 bg-white/10 rounded-xl border-none text-white text-sm outline-none" />
                        <input placeholder="TC No" maxLength="11" value={tcNo} onChange={e => setTcNo(e.target.value)} className="p-4 bg-white/10 rounded-xl border-none text-white text-sm outline-none" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                          <label className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Başlangıç</label>
                          <input type="date" required value={startDate} onChange={e => handleDateLogic(e.target.value)} className="w-full bg-transparent border-none text-white font-bold text-sm outline-none" />
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 hover:border-indigo-400 transition-all">
  <label className="text-[8px] font-black text-indigo-200 uppercase block mb-1">İade Tarihi</label>
  <input 
    type="date" 
    required
    value={endDate} 
    onChange={e => setEndDate(e.target.value)} 
    className="w-full bg-transparent border-none text-white font-bold text-sm outline-none cursor-pointer" 
    title="Otomatik hesaplandı, isterseniz değiştirebilirsiniz"
  />
</div>
                      </div>
                      <div className="flex gap-3">
                        <input type="number" placeholder="Kapora" value={deposit} onChange={e => setDeposit(e.target.value)} className="flex-1 p-4 bg-white/10 rounded-xl border-none text-white font-black text-sm outline-none" />
                        <button disabled={loading} className="flex-1 bg-white text-slate-900 py-4 rounded-xl font-black uppercase text-xs active:scale-95 transition-all">KAYDET</button>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] italic flex items-center gap-2"><History size={14}/> Kayıt Geçmişi</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                      <input 
                        type="text" 
                        placeholder="Müşteri ara..." 
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        className="w-full sm:w-48 bg-slate-100 rounded-lg py-2 pl-8 pr-3 outline-none text-[10px] font-bold focus:ring-1 ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {rentals
                      .filter(r => r.product_id === selectedProduct.id && !r.is_archived && r.customer_name.toLowerCase().includes(historySearch.toLowerCase()))
                      .map(r => (
                      <div key={r.id} onClick={() => { setSelectedRental(r); setTempPhone(r.phone || ''); setTempRentalDate(r.start_date); setTempRentalEndDate(r.end_date); setTempDeposit(r.deposit_amount); setIsEditingRental(false); setView('rental-detail'); }}
                        className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center cursor-pointer hover:bg-white transition-all shadow-sm">
                        <div className="flex items-center gap-3 truncate pr-4">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px] shrink-0">
                            {r.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="font-black text-slate-800 uppercase text-xs truncate mb-0.5">{r.customer_name}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><CalendarDays size={10}/> {r.start_date} / {r.end_date}</p>
                          </div>
                        </div>
                        <div className={`shrink-0 px-3 py-1 rounded-full text-[8px] font-black ${r.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-600' : r.status === 'Ödendi' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                          {r.status.toUpperCase()}
                        </div>
                      </div>
                    ))}
                    {rentals.filter(r => r.product_id === selectedProduct.id && !r.is_archived).length === 0 && (
                        <p className="text-[10px] text-slate-400 font-bold text-center py-4">Henüz kiralama geçmişi yok.</p>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        );
      })()}

      {/* ── STATS ── */}
      {view === 'stats' && (() => {
        // --- YENİ MATEMATİKSEL HESAPLAMALAR ---
        const paidRentals = rentals.filter(r => r.status === 'Ödendi' || r.status === 'Tamamlandı');
        const avgOrderValue = paidRentals.length > 0 ? Math.round(totalCiro / paidRentals.length) : 0;
        const activeRentalsCount = rentals.filter(r => !r.is_archived && r.status !== 'Tamamlandı').length;
        const occupancyRate = totalProductCount > 0 ? Math.round((activeRentalsCount / totalProductCount) * 100) : 0;
        const maxRentCount = topProducts.length > 0 ? topProducts[0].count : 1;

        // GİDER HESAPLAMALARI
        const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const netKazanc = totalCiro - totalExpenses; // İŞTE GERÇEK KAZANÇ
        
        // Kategoriye Göre Gider Dağılımı
        const expByCategory = expenses.reduce((acc, curr) => {
          acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
          return acc;
        }, {});

        return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 lg:p-12 overflow-x-hidden relative">
          
          <header className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-md z-50 py-4">
            <button onClick={() => setView('list')} className="w-full md:w-auto flex items-center justify-center gap-2 font-black text-xs text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-all bg-white md:bg-transparent py-3 md:py-0 rounded-xl border md:border-none shadow-sm md:shadow-none"><ArrowLeft size={16}/> Ana Sayfaya Dön</button>
            <h2 className="font-black text-2xl uppercase tracking-tighter italic text-slate-800 flex items-center gap-2"><PieChart className="text-indigo-600" size={28}/> Dükkan <span className="text-indigo-600">Raporları</span></h2>
            <button onClick={() => setShowExpModal(true)} className="w-full md:w-auto bg-rose-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-600 transition-all">
              + GİDER EKLE
            </button>
          </header>

          {/* MATEMATİKSEL KPI KARTLARI */}
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            
            {/* NET KAZANÇ Kartı (Gider Düşülmüş Gerçek Rakam) */}
            <div className={`bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border relative overflow-hidden group hover:shadow-lg transition-all ${netKazanc < 0 ? 'border-rose-200' : 'border-emerald-200'}`}>
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={80}/></div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${netKazanc < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}><TrendingUp size={24}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Net Kazanç (Kâr)</p>
              <p className={`text-3xl font-black tracking-tighter ${netKazanc < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{netKazanc} <span className="text-lg opacity-50">TL</span></p>
            </div>

            {/* TOPLAM GİDER Kartı (YENİ) */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-rose-100 relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="rotate-180" size={80}/></div>
              <div className="bg-rose-50 text-rose-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><TrendingUp className="rotate-180" size={24}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Toplam Gider</p>
              <p className="text-3xl font-black text-rose-600 tracking-tighter">-{totalExpenses} <span className="text-lg opacity-50">TL</span></p>
            </div>

            {/* CİRO Kartı */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><PieChart size={80}/></div>
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><PieChart size={24}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Brüt Ciro</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalCiro} <span className="text-lg text-slate-400">TL</span></p>
            </div>

            {/* Doluluk Oranı Kartı */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><CalendarCheck size={80}/></div>
              <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><CalendarCheck size={24}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Aktif Doluluk Oranı</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">%{occupancyRate}</p>
                <p className="text-[10px] font-bold text-slate-400 mb-1.5">{activeRentalsCount} Ürün Dışarıda</p>
              </div>
            </div>

          </div>

          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            
            {/* GİDER DAĞILIMI (YENİ GÖRSELLEŞTİRME) */}
            <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-sm border flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-sm uppercase text-slate-800 flex items-center gap-2 italic"><PieChart className="text-rose-500" size={20}/> Gider Dağılımı</h3>
                <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full">{Object.keys(expByCategory).length} Kategori</span>
              </div>
              <div className="space-y-4 flex-1 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                {Object.keys(expByCategory).length === 0 ? <p className="text-center text-slate-400 font-bold py-10 text-xs">Henüz gider kaydedilmedi.</p> : 
                  Object.entries(expByCategory).sort((a,b) => b[1] - a[1]).map(([cat, val], idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xs">{cat.charAt(0)}</div>
                      <p className="font-black uppercase text-xs text-slate-700">{cat}</p>
                    </div>
                    <span className="font-black text-sm text-rose-600">{val} TL</span>
                  </div>
                ))}
              </div>
            </div>

            {/* POPÜLER ÜRÜNLER (Daraltıldı) */}
            <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-sm border flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-sm uppercase text-slate-800 flex items-center gap-2 italic"><Star className="text-amber-500" size={20}/> Zirvedeki Ürünler</h3>
              </div>
              <div className="space-y-6 flex-1 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                {topProducts.length === 0 ? <p className="text-center text-slate-400 font-bold py-10 text-xs">Henüz veri yok.</p> : topProducts.map((p, idx) => (
                  <div key={p.id} className="group cursor-pointer" onClick={() => { setSelectedProduct(p); setView('detail'); }}>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-200 text-xl italic w-6">#{idx + 1}</span>
                        <img src={p.image_url} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                        <p className="font-black uppercase text-xs text-slate-700 truncate max-w-[150px] sm:max-w-[200px] group-hover:text-indigo-600 transition-colors">{p.name}</p>
                      </div>
                      <span className="font-black text-xs text-indigo-600">{p.count} İşlem</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GİDER EKLEME MODALI */}
          {showExpModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
              <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 border-4 border-rose-500/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-lg uppercase text-slate-900">Gider Ekle</h3>
                  <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-rose-500"><X size={24}/></button>
                </div>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Tutar (TL)</label>
                    <input type="number" required value={expAmount} onChange={e => setExpAmount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border focus:ring-2 ring-rose-500" placeholder="Örn: 1500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Açıklama</label>
                    <input type="text" required value={expTitle} onChange={e => setExpTitle(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border focus:ring-2 ring-rose-500" placeholder="Örn: Nisan ayı dükkan kirası" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Kategori</label>
                    <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border focus:ring-2 ring-rose-500 cursor-pointer">
                      <option value="Kira">Kira</option>
                      <option value="Yeme İçme">Yeme İçme</option>
                      <option value="Fatura">Fatura</option>
                      <option value="Personel">Personel</option>
                      <option value="Elbise & Terzi">Elbise & Terzi</option>
                      <option value="Diğer">Diğer (Kendim Yazacağım)</option>
                    </select>
                  </div>
                  {expCategory === 'Diğer' && (
                    <div>
                      <input type="text" required value={expCustomCat} onChange={e => setExpCustomCat(e.target.value)} className="w-full p-4 bg-rose-50 rounded-2xl font-bold text-sm outline-none border border-rose-200" placeholder="Kategori ismini yazın" />
                    </div>
                  )}
                  <button disabled={loading} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4">
                    {loading ? 'KAYDEDİLİYOR...' : 'GİDERİ KAYDET'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
        );
      })()}

      {/* ── RENTAL DETAIL ── */}
      {view === 'rental-detail' && selectedRental && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center shrink-0">
              <div><p className="text-[10px] font-black text-indigo-500 uppercase italic mb-1">Müşteri Kartı</p><h2 className="text-2xl font-black uppercase text-slate-900">{selectedRental.customer_name}</h2></div>
              <button onClick={() => setView('list')} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto">
              <div className={`p-6 rounded-[2rem] border-2 transition-all ${isEditingRental ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400">Bilgileri Güncelle</h4>
                  <button onClick={() => setIsEditingRental(!isEditingRental)} className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1">{isEditingRental ? 'İptal' : <><Edit3 size={12}/> Düzenle</>}</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-2">Alım Günü</label>
    <input type="date" disabled={!isEditingRental} value={tempRentalDate} onChange={e => handleDateLogic(e.target.value, 'edit')} className={`w-full p-3 rounded-xl border font-bold text-sm ${isEditingRental ? 'bg-white border-indigo-200 cursor-pointer' : 'bg-transparent border-transparent'}`} />
  </div>
  <div>
    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-2">İade Günü</label>
    <input type="date" disabled={!isEditingRental} value={tempRentalEndDate} onChange={e => setTempRentalEndDate(e.target.value)} className={`w-full p-3 rounded-xl border font-bold text-sm ${isEditingRental ? 'bg-white border-indigo-200 cursor-pointer' : 'bg-transparent border-transparent'}`} />
  </div>
</div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-2">Telefon Numarası</label>
                    <div className="flex gap-2">
                      <input type="text" disabled={!isEditingRental} value={tempPhone} onChange={e => setTempPhone(e.target.value)} className={`flex-1 p-3 rounded-xl border font-bold text-sm ${isEditingRental ? 'bg-white border-indigo-200' : 'bg-transparent border-transparent'}`} />
                      {!isEditingRental && tempPhone && (
                        <div className="flex gap-2">
                          <a href={`tel:${tempPhone}`} className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200 transition-all"><Phone size={18}/></a>
                          <button onClick={() => sendWhatsAppReminder(selectedRental)} className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all"><MessageCircle size={18}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {isEditingRental && <button onClick={saveRentalUpdate} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">KAYDET</button>}
              </div>
              <div className="space-y-3">
    {/* 1. ADIM: ÖDEME BUTONU */}
    <button onClick={() => updateRentalStatus(selectedRental.id, 'Ödendi')} className={`w-full py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-3 transition-all ${selectedRental.status === 'Ödendi' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
      <CheckCircle2 size={16}/> 1- ÖDEME ALINDI
    </button>
    
    {/* 2. ADIM: ÜRÜNÜ GERİ ALMA (BİTİRME) BUTONU */}
    <button onClick={async () => {
      const onay = await confirm("Ürün dükkana teslim alındı ve bu kiralama işlemi bitirilecek. Onaylıyor musunuz?", { title: 'İşlemi Bitir', type: 'warn', confirmLabel: 'Evet, Teslim Alındı', cancelLabel: 'İptal' });
      if (onay) {
        updateRentalStatus(selectedRental.id, 'Tamamlandı');
        setView('list'); // İşlem bitince ana listeye dön
      }
    }} className={`w-full py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-3 transition-all ${selectedRental.status === 'Tamamlandı' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
      <Package size={16}/> 2- ÜRÜN TESLİM ALINDI (KİRALAMAYI BİTİR)
    </button>
  </div>
            </div>
            <div className="p-8 border-t bg-slate-50 shrink-0 flex justify-center">
              <button onClick={async () => {
                const onay = await confirm("Bu kayıt arşivlenecek ve listeden kaldırılacak.", { title: 'Kaydı Sil?', type: 'danger', confirmLabel: 'Evet, Sil', cancelLabel: 'İptal' })
                if (onay) { await supabase.from('rentals').update({ is_archived: true }).eq('id', selectedRental.id); fetchData(); setView('list'); }
              }} className="text-rose-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-rose-50 transition-all">
                <Trash2 size={14}/> Kaydı Kalıcı Olarak Sil
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── GELİŞTİRİCİ CANLI DESTEK BUTONU (Sadece Giriş Yapanlar Görür) ── */}
      {session && (
        <a 
          href={`https://wa.me/905359273759?text=${encodeURIComponent(`Merhaba, ${shopName} yönetim panelinden ulaşıyorum, yazılımla ilgili desteğe ihtiyacım var.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[300] bg-slate-900 text-white p-4 rounded-full shadow-2xl shadow-slate-900/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group border-2 border-slate-700"
        >
          <MessageCircle size={24} />
          
          {/* Mouse üzerine gelince açılan bilgi balonu */}
          <span className="absolute right-16 bg-slate-800 text-white text-[10px] font-black px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Yazılımcıya Ulaş
          </span>
        </a>
      )}
    </>
  )
}

export default App