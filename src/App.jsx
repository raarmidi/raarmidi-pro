import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { 
  PlusCircle, Trash2, Package, Search, 
  CalendarDays, X, Phone, Edit3,
  TrendingUp, CalendarRange, ArrowLeft, CheckCircle2, Clock, History, 
  AlertTriangle, PieChart, Star, Ban, CalendarCheck, LayoutDashboard, Hash, MessageCircle,
  Wind, Scissors, Home, ChevronLeft, ChevronRight, Filter, SlidersHorizontal
} from 'lucide-react'
import { exportBackup } from "./utils/exportBackup";
import { useDialog } from "./useDialog";

function App() {
  const { DialogUI, alert, confirm } = useDialog()
  const [products, setProducts] = useState([])
  const [rentals, setRentals] = useState([])
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
  const [isAuthenticated, setIsAuthenticated] = useState(false) // <-- Buraya ekle
  const [loginUser, setLoginUser] = useState('')                // <-- Buraya ekle
  const [loginPass, setLoginPass] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: pData } = await supabase.from('products').select('*').order('id', { ascending: false })
      const { data: rData } = await supabase.from('rentals').select('*').order('start_date', { ascending: true })
      setProducts(pData || [])
      setRentals(rData || [])
    } catch (err) { console.error("Veri hatası:", err) }
    setLoading(false)
  }
 // Sayfa ilk açıldığında veya yenilendiğinde çalışır
  useEffect(() => {
    const logged = sessionStorage.getItem('isLogged');
    if (logged === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Giriş yap butonuna basınca çalışır
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUser === 'admin' && loginPass === 'ramazan123') {
      sessionStorage.setItem('isLogged', 'true'); // Hafızaya al
      setIsAuthenticated(true);
    } else {
      alert("Hatalı kullanıcı adı veya şifre!");
    }
  }

  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
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
  const FILTERS = [
    { key: 'TÜMÜ',        label: 'Tümü',       color: 'bg-slate-800 text-white',   inactive: 'bg-white text-slate-500 border hover:bg-slate-50' },
    { key: 'MÜSAİT',     label: 'Müsait',     color: 'bg-emerald-500 text-white', inactive: 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50' },
    { key: 'MÜŞTERİDE',  label: 'Müşteride',  color: 'bg-rose-500 text-white',    inactive: 'bg-white text-rose-500 border border-rose-200 hover:bg-rose-50' },
    { key: 'REZERVE',    label: 'Rezerve',    color: 'bg-violet-500 text-white',  inactive: 'bg-white text-violet-600 border border-violet-200 hover:bg-violet-50' },
    { key: 'TEMİZLİKTE', label: 'Temizlikte', color: 'bg-blue-500 text-white',    inactive: 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50' },
    { key: 'TERZİDE',    label: 'Terzide',    color: 'bg-amber-500 text-white',   inactive: 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50' },
  ]

  const rentalCountMap = products.reduce((acc, p) => {
    acc[p.id] = rentals.filter(r => r.product_id === p.id).length
    return acc
  }, {})

  const filteredAndSorted = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const loc = getProductLocationStatus(p)
      const matchesFilter = activeFilter === 'TÜMÜ' || loc.label === activeFilter
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'tr')
      if (sortBy === 'most_rented') return (rentalCountMap[b.id] || 0) - (rentalCountMap[a.id] || 0)
      return 0
    })

  const filterCounts = FILTERS.reduce((acc, f) => {
    if (f.key === 'TÜMÜ') { acc['TÜMÜ'] = products.length; return acc }
    acc[f.key] = products.filter(p => getProductLocationStatus(p).label === f.key).length
    return acc
  }, {})

  // --- TAKVİM ---
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const calendarDays = [];
    for (let i = 0; i < startDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-32 border-b border-r bg-slate-50/30"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRentals = rentals.filter(r => !r.is_archived && dateStr >= r.start_date && dateStr <= r.end_date);
      const isToday = dateStr === getTodayDateString();
      calendarDays.push(
        <div key={day} className={`h-32 border-b border-r p-2 transition-all hover:bg-slate-50 overflow-y-auto scrollbar-hide ${isToday ? 'bg-indigo-50/50' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>{day}</span>
          </div>
          <div className="space-y-1">
            {dayRentals.map(r => {
              const prod = products.find(p => p.id === r.product_id);
              return (
                <div key={r.id} onClick={() => { setSelectedRental(r); setTempPhone(r.phone || ''); setTempRentalDate(r.start_date); setTempRentalEndDate(r.end_date); setTempDeposit(r.deposit_amount); setView('rental-detail'); }}
                  className={`text-[8px] font-black p-1 rounded-md border truncate cursor-pointer hover:scale-105 transition-all shadow-sm
                    ${r.status === 'Ödendi' ? 'bg-emerald-500 border-emerald-600 text-white' : r.status === 'Tamamlandı' ? 'bg-slate-400 border-slate-500 text-white opacity-50' : 'bg-indigo-500 border-indigo-600 text-white'}`}>
                  {prod?.name || 'Ürün'} - {r.customer_name}
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
  async function addProduct(e) {
    e.preventDefault(); if (loading || !file) return;
    setLoading(true)
    const fileName = `${Date.now()}_${file.name}`
    await supabase.storage.from('product-images').upload(fileName, file)
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
    await supabase.from('products').insert([{ name, price: parseInt(price), image_url: urlData.publicUrl, status: 'Müsait' }])
    setName(''); setPrice(''); setFile(null); fetchData();
  }

  async function updateProductStatus(newStatus) {
    setLoading(true)
    await supabase.from('products').update({ status: newStatus }).eq('id', selectedProduct.id)
    setSelectedProduct({ ...selectedProduct, status: newStatus })
    fetchData(); setLoading(false)
  }

  async function updateProduct() {
    setLoading(true)
    let updates = { name: selectedProduct.name, price: parseInt(selectedProduct.price) }
    if (file) {
      const fileName = `${Date.now()}_${file.name}`
      await supabase.storage.from('product-images').upload(fileName, file)
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      updates.image_url = urlData.publicUrl
    }
    await supabase.from('products').update(updates).eq('id', selectedProduct.id)
    setEditMode(false); setFile(null); fetchData(); setLoading(false)
  }

  async function handleRent(e) {
    e.preventDefault();
    const loc = getProductLocationStatus(selectedProduct);
    if (loc.label !== 'MÜSAİT') {
      const onay = await confirm(`Bu ürün şu an "${loc.label}" durumunda. Yine de rezervasyon yapmak istiyor musunuz?`, { title: 'Dikkat!', type: 'warn', confirmLabel: 'Evet, Ekle', cancelLabel: 'İptal' })
      if (!onay) return;
    }
    const hasConflict = rentals.some(r => {
      if (r.product_id !== selectedProduct.id || r.is_archived || r.status === 'Tamamlandı') return false;
      return (startDate <= r.end_date && endDate >= r.start_date);
    });
    if (hasConflict) { await alert("Bu tarih aralığı dolu!", { title: 'Tarih Çakışması', type: 'danger' }); return }
    setLoading(true)
    await supabase.from('rentals').insert([{
      product_id: selectedProduct.id, customer_name: customerName, phone, tc_no: tcNo,
      start_date: startDate, end_date: endDate, deposit_amount: parseInt(deposit) || 0,
      total_price: parseInt(selectedProduct.price), status: 'Beklemede', is_archived: false
    }])
    setCustomerName(''); setPhone(''); setTcNo(''); setStartDate(''); setEndDate(''); setDeposit(0);
    fetchData();
    await alert("Rezervasyon başarıyla eklendi!", { title: 'Tamamlandı', type: 'success' })
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
// Eğer giriş yapılmadıysa sadece bu ekranı göster
if (!isAuthenticated) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border-4 border-indigo-500/20">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/40">
            <LayoutDashboard size={32}/>
          </div>
          <h1 className="font-black text-2xl tracking-tighter uppercase italic text-slate-900">
            RaarMidi <span className="text-indigo-600">Pro</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Yönetim Paneli Girişi</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="Kullanıcı Adı" 
            value={loginUser}
            onChange={(e) => setLoginUser(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 ring-indigo-500 transition-all"
          />
          <input 
            type="password" 
            placeholder="Şifre" 
            value={loginPass}
            onChange={(e) => setLoginPass(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 ring-indigo-500 transition-all"
          />
          <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
            SİSTEME GİRİŞ YAP
          </button>
        </form>
      </div>
    </div>
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
              <h1 className="font-black text-xl tracking-tighter uppercase italic">RaarMidi <span className="text-indigo-600">Pro</span></h1>
            </div>
            <div className="order-3 lg:order-2 w-full lg:w-96 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input
                className="w-full bg-slate-100 rounded-2xl py-2.5 pl-12 pr-4 outline-none focus:ring-2 ring-indigo-500 text-sm font-bold"
                placeholder="Model ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 order-2 lg:order-3">
              <button onClick={() => exportBackup(products, rentals)} className="bg-black text-white px-4 py-2 rounded-xl hover:opacity-80">Yedek İndir</button>
              <button onClick={() => setView('calendar')} className="p-3 bg-white border rounded-2xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"><CalendarDays size={20}/></button>
              <button onClick={() => setView('stats')} className="bg-slate-900 text-white px-5 py-2 rounded-2xl flex items-center gap-4 hover:scale-105 transition-all shadow-xl active:scale-95">
                <div className="text-right border-r border-white/10 pr-4">
                  <p className="text-[9px] font-black text-indigo-400 uppercase leading-none mb-1">Ciro</p>
                  <p className="font-black text-lg leading-none">{totalCiro} TL</p>
                </div>
                <TrendingUp size={20} className="text-emerald-400"/>
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
          <header className="px-8 py-6 bg-white border-b flex justify-between items-center sticky top-0 z-[100]">
            <button onClick={() => setView('list')} className="flex items-center gap-2 font-black text-[10px] text-slate-400 uppercase hover:text-indigo-600 transition-all"><ArrowLeft size={16}/> Geri Dön</button>
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronLeft size={24}/></button>
              <h2 className="font-black text-xl uppercase tracking-tighter italic min-w-[200px] text-center">{currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronRight size={24}/></button>
            </div>
            <div className="w-20"></div>
          </header>
          <main className="p-8">
            <div className="max-w-[1600px] mx-auto bg-white rounded-[3rem] shadow-2xl border overflow-hidden">
              <div className="grid grid-cols-7 bg-slate-900 text-white border-b border-slate-800">
                {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(day => (
                  <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest opacity-60">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">{renderCalendar()}</div>
            </div>
            <div className="mt-8 flex justify-center gap-8">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black text-slate-400 uppercase">Kiralamada</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-slate-400 uppercase">Ödendi</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div><span className="text-[10px] font-black text-slate-400 uppercase">Tamamlandı</span></div>
            </div>
          </main>
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
                <div className="bg-slate-50 p-6 rounded-[2rem] border space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 px-2 italic">Hızlı Konum Değiştir</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => updateProductStatus('Müsait')} className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${selectedProduct.status === 'Müsait' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 hover:border-emerald-200'}`}><Home size={16}/><span className="text-[8px] font-black">DÜKKAN</span></button>
                    <button onClick={() => updateProductStatus('Temizlikte')} className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${selectedProduct.status === 'Temizlikte' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 hover:border-blue-200'}`}><Wind size={16}/><span className="text-[8px] font-black">YIKAMA</span></button>
                    <button onClick={() => updateProductStatus('Terzide')} className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${selectedProduct.status === 'Terzide' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-400 hover:border-amber-200'}`}><Scissors size={16}/><span className="text-[8px] font-black">TERZİ</span></button>
                  </div>
                </div>
                {editMode && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border space-y-3">
                    <input value={selectedProduct.name} onChange={e => setSelectedProduct({ ...selectedProduct, name: e.target.value })} className="w-full p-4 rounded-xl border-none font-bold text-sm outline-none shadow-sm" />
                    <input value={selectedProduct.price} type="number" onChange={e => setSelectedProduct({ ...selectedProduct, price: e.target.value })} className="w-full p-4 rounded-xl border-none font-bold text-sm outline-none shadow-sm" />
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
                        <div className="bg-white/5 p-3 rounded-xl opacity-50 border border-white/10">
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Teslim (3. Gün)</label>
                          <input type="date" disabled value={endDate} className="w-full bg-transparent border-none text-white font-bold text-sm" />
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
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] italic flex items-center gap-2 px-2"><History size={14}/> Kayıt Geçmişi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rentals.filter(r => r.product_id === selectedProduct.id && !r.is_archived).map(r => (
                      <div key={r.id} onClick={() => { setSelectedRental(r); setTempPhone(r.phone || ''); setTempRentalDate(r.start_date); setTempRentalEndDate(r.end_date); setTempDeposit(r.deposit_amount); setIsEditingRental(false); setView('rental-detail'); }}
                        className="p-6 bg-slate-50 border rounded-3xl flex justify-between items-center cursor-pointer hover:bg-white transition-all shadow-sm">
                        <div className="truncate pr-4">
                          <p className="font-black text-slate-800 uppercase text-xs truncate mb-1">{r.customer_name}</p>
                          <p className="text-[9px] font-bold text-indigo-500 uppercase italic">{r.start_date} → {r.end_date}</p>
                        </div>
                        <div className={`shrink-0 px-3 py-1 rounded-full text-[8px] font-black ${r.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{r.status.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          </div>
        );
      })()}

      {/* ── STATS ── */}
      {view === 'stats' && (
        <div className="min-h-screen bg-[#f1f5f9] p-6 lg:p-12 overflow-x-hidden">
          <header className="max-w-[1400px] mx-auto flex justify-between items-center mb-10">
            <button onClick={() => setView('list')} className="flex items-center gap-2 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all"><ArrowLeft size={16}/> Ana Sayfa</button>
            <h2 className="font-black text-2xl uppercase tracking-tighter italic">Dükkan <span className="text-indigo-600">Raporları</span></h2>
          </header>
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border text-center">
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><Hash size={24}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Toplam Ürün</p>
              <p className="text-3xl font-black text-slate-900">{totalProductCount} Ürün</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border text-center">
              <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><TrendingUp size={24}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Net Kazanç</p>
              <p className="text-3xl font-black text-slate-900">{totalCiro} TL</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border text-center">
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><PieChart size={24}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Toplam İşlem</p>
              <p className="text-3xl font-black text-slate-900">{rentals.length} Kayıt</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border text-center">
              <div className="bg-amber-50 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"><Clock size={24}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Bekleyen Ödemeler</p>
              <p className="text-3xl font-black text-slate-900">{totalBekleyen}</p>
            </div>
          </div>
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[4rem] shadow-sm border">
              <h3 className="font-black text-sm uppercase text-slate-800 mb-8 flex items-center gap-2 italic"><Star className="text-amber-500" size={18}/> Popüler Ürünler</h3>
              <div className="space-y-6">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <span className="font-black text-indigo-600 text-lg opacity-30 italic">#{idx + 1}</span>
                      <img src={p.image_url} className="w-12 h-12 rounded-xl object-cover" />
                      <p className="font-black uppercase text-[11px] text-slate-700">{p.name}</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl font-black text-[10px] text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">{p.count} KİRALAMA</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 p-10 rounded-[4rem] shadow-xl text-white">
              <h3 className="font-black text-sm uppercase text-slate-300 mb-8 flex items-center gap-2 italic"><Ban className="text-rose-500" size={18}/> Henüz Kiralanmamışlar</h3>
              <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                {nonRentedProducts.length === 0
                  ? <p className="col-span-2 text-center text-slate-500 py-10 text-[10px]">Boşta ürün kalmadı!</p>
                  : nonRentedProducts.map(p => (
                    <div key={p.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center gap-3">
                      <img src={p.image_url} className="w-10 h-10 rounded-lg object-cover grayscale opacity-50" />
                      <p className="font-bold uppercase text-[10px] truncate">{p.name}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <div><label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-2">Alım Günü</label><input type="date" disabled={!isEditingRental} value={tempRentalDate} onChange={e => handleDateLogic(e.target.value, 'edit')} className={`w-full p-3 rounded-xl border font-bold text-sm ${isEditingRental ? 'bg-white border-indigo-200' : 'bg-transparent border-transparent'}`} /></div>
                    <div><label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-2">Kapora</label><input type="number" disabled={!isEditingRental} value={tempDeposit} onChange={e => setTempDeposit(e.target.value)} className={`w-full p-3 rounded-xl border font-bold text-sm ${isEditingRental ? 'bg-white border-indigo-200' : 'bg-transparent border-transparent'}`} /></div>
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
                <button onClick={() => updateRentalStatus(selectedRental.id, 'Ödendi')} className={`w-full py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-3 transition-all ${selectedRental.status === 'Ödendi' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><CheckCircle2 size={16}/> ÖDEME ALINDI</button>
                <button onClick={() => updateRentalStatus(selectedRental.id, 'Teslim Edildi')} className={`w-full py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-3 transition-all ${selectedRental.status === 'Teslim Edildi' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><Package size={16}/> ÜRÜN MÜŞTERİDE</button>
                <button onClick={() => updateRentalStatus(selectedRental.id, 'Tamamlandı')} className={`w-full py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-3 transition-all ${selectedRental.status === 'Tamamlandı' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><Clock size={16}/> ÜRÜN GERİ ALINDI</button>
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
    </>
  )
}

export default App