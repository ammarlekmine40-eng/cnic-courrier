
import React, { useState, useEffect, useRef } from 'react';
import { MailDirection, MailStatus, MailPriority, MailItem, MailStats, Device } from './types';
import { analyzeMailDocument } from './services/geminiService';
import StatsCard from './components/StatsCard';
import MailItemCard from './components/MailItemCard';
import { 
  LayoutDashboard, 
  Inbox, 
  Send as SendIcon, 
  Plus, 
  Search, 
  Camera, 
  X, 
  Loader2, 
  Bell, 
  User, 
  Smartphone,
  Filter,
  Clock,
  Mail,
  Monitor,
  RefreshCw,
  QrCode,
  Download,
  ShieldCheck,
  FileText,
  Scan,
  Archive,
  Hash,
  Eye,
  ExternalLink
} from 'lucide-react';

const App: React.FC = () => {
  const [mails, setMails] = useState<MailItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | MailDirection | 'SYNC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedFileBase64, setCapturedFileBase64] = useState<string | null>(null);
  const [capturedFileType, setCapturedFileType] = useState<string | null>(null);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  
  const [devices] = useState<Device[]>([
    { id: '1', name: 'Android Sync Mobile', type: 'MOBILE', lastSync: 'Connecté', status: 'ONLINE' },
    { id: '2', name: 'Windows Desktop Work', type: 'DESKTOP', lastSync: 'En cours', status: 'ONLINE' }
  ]);

  const [newMail, setNewMail] = useState<Partial<MailItem>>({
    direction: MailDirection.INCOMING,
    status: MailStatus.PENDING,
    priority: MailPriority.NORMAL,
    date: new Date().toLocaleDateString('fr-FR'),
    reference: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initialMails: MailItem[] = [
      {
        id: '1',
        reference: '2024-FACT-001',
        direction: MailDirection.INCOMING,
        status: MailStatus.RECEIVED,
        priority: MailPriority.URGENT,
        sender: 'EDF France',
        recipient: 'Jean Dupont',
        subject: 'Facture Régularisation Annuelle',
        date: '14/05/2024',
        contentSummary: 'Consommation électrique pour la période Janvier-Avril.'
      },
      {
        id: '2',
        reference: 'COUR-OUT-442',
        direction: MailDirection.OUTGOING,
        status: MailStatus.SENT,
        priority: MailPriority.NORMAL,
        sender: 'Jean Dupont',
        recipient: 'Mairie de Lyon',
        subject: 'Demande de Permis de Construire',
        date: '10/05/2024',
        trackingNumber: 'LP123456789FR'
      }
    ];
    setMails(initialMails);
  }, []);

  const stats: MailStats = {
    totalIncoming: mails.filter(m => m.direction === MailDirection.INCOMING).length,
    totalOutgoing: mails.filter(m => m.direction === MailDirection.OUTGOING).length,
    urgentCount: mails.filter(m => m.priority === MailPriority.URGENT).length,
    pendingCount: mails.filter(m => m.status === MailStatus.PENDING).length,
  };

  const filteredMails = mails.filter(mail => {
    const matchesTab = activeTab === 'SYNC' ? false : (activeTab === 'ALL' || mail.direction === activeTab);
    const query = searchQuery.toLowerCase();
    return matchesTab && (
      mail.subject.toLowerCase().includes(query) ||
      mail.sender.toLowerCase().includes(query) ||
      mail.recipient.toLowerCase().includes(query) ||
      mail.reference.toLowerCase().includes(query)
    );
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fullData = event.target?.result as string;
      const base64 = fullData.split(',')[1];
      const mimeType = file.type;
      
      setCapturedFileBase64(fullData);
      setCapturedFileType(mimeType);
      
      // Analyse IA intelligente pour extraire l'objet et la date, même pour le PDF
      const aiResult = await analyzeMailDocument(base64, mimeType);
      
      if (aiResult) {
        setNewMail(prev => ({
          ...prev,
          sender: aiResult.sender,
          recipient: aiResult.recipient,
          subject: aiResult.subject,
          reference: aiResult.reference || prev.reference,
          date: aiResult.date || prev.date,
          priority: aiResult.isUrgent ? MailPriority.URGENT : MailPriority.NORMAL,
          contentSummary: aiResult.summary,
          status: mimeType === 'application/pdf' ? MailStatus.ARCHIVED : MailStatus.PENDING
        }));
      } else {
        // Fallback manuel si l'IA échoue
        setNewMail(prev => ({
          ...prev,
          subject: file.name,
          date: new Date().toLocaleDateString('fr-FR')
        }));
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMail = () => {
    if (!newMail.subject || !newMail.sender) return;
    const mailToSave: MailItem = {
      id: Math.random().toString(36).substr(2, 9),
      reference: newMail.reference || `REF-${Math.floor(Math.random() * 100000)}`,
      direction: newMail.direction || MailDirection.INCOMING,
      status: capturedFileType === 'application/pdf' ? MailStatus.ARCHIVED : (newMail.status || MailStatus.PENDING),
      priority: newMail.priority || MailPriority.NORMAL,
      sender: newMail.sender || '',
      recipient: newMail.recipient || '',
      subject: newMail.subject || '',
      date: newMail.date || new Date().toLocaleDateString('fr-FR'),
      contentSummary: newMail.contentSummary,
      imageUrl: capturedFileBase64 || undefined
    };
    setMails([mailToSave, ...mails]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewMail({ direction: MailDirection.INCOMING, status: MailStatus.PENDING, priority: MailPriority.NORMAL, date: new Date().toLocaleDateString('fr-FR'), reference: '' });
    setCapturedFileBase64(null);
    setCapturedFileType(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Smartphone size={24} />
          </div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">CNIC <span className="text-indigo-600">Sync</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('ALL')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}>
            <LayoutDashboard size={20} /> Tableau de Bord
          </button>
          <button onClick={() => setActiveTab(MailDirection.INCOMING)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === MailDirection.INCOMING ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}>
            <Inbox size={20} /> Courrier Entrant
          </button>
          <button onClick={() => setActiveTab(MailDirection.OUTGOING)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === MailDirection.OUTGOING ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}>
            <SendIcon size={20} /> Courrier Sortant
          </button>
          <button onClick={() => setActiveTab('SYNC')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'SYNC' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}>
            <RefreshCw size={20} /> Appareils & Sync
          </button>
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm">JD</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">Jean Dupont</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full mb-20 md:mb-0">
        {activeTab === 'SYNC' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Synchronisation Appareils</h2>
              <p className="text-gray-500 mt-2 font-medium">Votre écosystème mobile et desktop interconnecté.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Device Section */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                   <Smartphone className="text-indigo-600" size={20} />
                   Terminaux liés
                 </h3>
                 <div className="space-y-4">
                   {devices.map(d => (
                     <div key={d.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:border-indigo-200">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm">
                            {d.type === 'MOBILE' ? <Smartphone size={20} className="text-indigo-500" /> : <Monitor size={20} className="text-indigo-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-black">{d.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{d.lastSync}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-black text-gray-400">EN LIGNE</span>
                        </div>
                     </div>
                   ))}
                 </div>
                 <div className="mt-8 p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] text-white relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                      <div className="bg-white p-4 rounded-2xl shadow-2xl transition-transform group-hover:scale-105">
                        <QrCode size={100} className="text-gray-900" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-black text-xl mb-1">Ajouter un mobile</p>
                        <p className="text-indigo-100 text-xs mb-4 leading-relaxed font-medium">Installez l'APK sur Android et scannez ce code pour synchroniser vos scans OCR.</p>
                        <button className="bg-white text-indigo-700 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all">Générer Code de Liaison</button>
                      </div>
                    </div>
                 </div>
               </div>

               {/* Deploy Section */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Download className="text-teal-600" size={20} />
                    Exportations Disponibles
                  </h3>
                  <div className="space-y-4">
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:border-teal-200">
                       <div className="flex justify-between items-center mb-2">
                         <p className="font-bold text-gray-800 flex items-center gap-2"><Monitor size={18} /> Windows Desktop (.exe)</p>
                         <span className="text-[9px] bg-teal-100 text-teal-700 px-2 py-1 rounded font-black uppercase">Prêt</span>
                       </div>
                       <p className="text-xs text-gray-400 mb-4 leading-relaxed font-medium">Version optimisée pour PC. Support complet du glisser-déposer de PDF.</p>
                       <code className="block bg-gray-900 text-teal-400 p-3 rounded-xl text-[10px] font-mono break-all group-hover:bg-black transition-colors">npm run build:windows</code>
                    </div>
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:border-indigo-200">
                       <div className="flex justify-between items-center mb-2">
                         <p className="font-bold text-gray-800 flex items-center gap-2"><Smartphone size={18} /> Android Mobile (.apk)</p>
                         <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-black uppercase">Mobile</span>
                       </div>
                       <p className="text-xs text-gray-400 mb-4 leading-relaxed font-medium">Application native avec accès direct à la caméra pour le scan OCR intelligent.</p>
                       <code className="block bg-gray-900 text-indigo-300 p-3 rounded-xl text-[10px] font-mono break-all group-hover:bg-black transition-colors">npx cap open android</code>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Gestion <span className="text-indigo-600">Courrier</span></h2>
                <p className="text-gray-500 mt-2 font-semibold">Tableau de bord centralisé pour le suivi des flux physiques.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-indigo-600 transition-all">
                  <Bell size={22} />
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-2xl shadow-indigo-200 transition-all active:scale-95"
                >
                  <Plus size={24} /> Nouveau Scan
                </button>
              </div>
            </header>

            {/* Metrics */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-10">
              <StatsCard title="Entrants" value={stats.totalIncoming} icon={<Inbox size={22} />} color="bg-indigo-600" />
              <StatsCard title="Sortants" value={stats.totalOutgoing} icon={<SendIcon size={22} />} color="bg-teal-600" />
              <StatsCard title="Urgents" value={stats.urgentCount} icon={<Bell size={22} />} color="bg-rose-600" />
              <StatsCard title="Archivés" value={mails.filter(m => m.status === MailStatus.ARCHIVED).length} icon={<Archive size={22} />} color="bg-gray-800" />
            </section>

            {/* Filter Bar */}
            <section className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-[450px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Référence, Objet, Expéditeur..."
                  className="w-full pl-14 pr-6 py-4.5 rounded-3xl bg-white border border-gray-100 focus:ring-[6px] focus:ring-indigo-50 focus:border-indigo-300 outline-none shadow-sm transition-all font-bold text-gray-700 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-[1.25rem] text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm">
                <Filter size={18} /> Filtrer
              </button>
            </section>

            {/* Main Listing */}
            <div className="bg-gray-100/30 p-2 rounded-[2.5rem] border border-gray-200 shadow-inner">
              <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <div className="col-span-2">Référence Unique</div>
                <div className="col-span-4">Détails Courrier / Date</div>
                <div className="col-span-3">Expéditeur / Destinataire</div>
                <div className="col-span-3 text-right">Statut / État</div>
              </div>
              <div className="space-y-3 mt-3">
                {filteredMails.length > 0 ? (
                  filteredMails.map(mail => (
                    <MailItemCard key={mail.id} mail={mail} onClick={setSelectedMail} />
                  ))
                ) : (
                  <div className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-gray-200">
                    <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                      <Search size={40} />
                    </div>
                    <h4 className="text-xl font-black text-gray-400">Aucun courrier répertorié</h4>
                    <p className="text-gray-400 mt-2 font-medium">Importez un PDF ou scannez un document.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-3 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('ALL')} className={`p-3 rounded-2xl transition-all ${activeTab === 'ALL' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><LayoutDashboard size={24} /></button>
        <button onClick={() => setActiveTab(MailDirection.INCOMING)} className={`p-3 rounded-2xl transition-all ${activeTab === MailDirection.INCOMING ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><Inbox size={24} /></button>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-3xl text-white -mt-12 shadow-2xl shadow-indigo-400 active:scale-90 transition-all"><Scan size={32} /></button>
        <button onClick={() => setActiveTab('SYNC')} className={`p-3 rounded-2xl transition-all ${activeTab === 'SYNC' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><RefreshCw size={24} /></button>
        <button className="p-3 rounded-2xl text-gray-400"><User size={24} /></button>
      </nav>

      {/* Add & Scan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-lg" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10 duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-20">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Nouveau Document</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Liaison IA Gemini Active</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              {/* Import Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 border-dashed transition-all group ${capturedFileType?.includes('image') ? 'border-indigo-600 bg-indigo-50' : 'border-indigo-100 bg-gray-50 hover:border-indigo-300'}`}>
                   <div className={`p-4 rounded-2xl shadow-sm transition-all group-hover:scale-110 ${capturedFileType?.includes('image') ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
                      <Camera size={26} />
                   </div>
                   <div className="text-center">
                     <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">Prendre Photo</p>
                     <p className="text-[10px] text-indigo-400 font-bold mt-1">Scan OCR Direct</p>
                   </div>
                </button>
                <button onClick={() => pdfInputRef.current?.click()} className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 border-dashed transition-all group ${capturedFileType === 'application/pdf' ? 'border-teal-600 bg-teal-50' : 'border-teal-100 bg-gray-50 hover:border-teal-300'}`}>
                   <div className={`p-4 rounded-2xl shadow-sm transition-all group-hover:scale-110 ${capturedFileType === 'application/pdf' ? 'bg-teal-600 text-white' : 'bg-white text-teal-600'}`}>
                      <FileText size={26} />
                   </div>
                   <div className="text-center">
                     <p className="text-xs font-black text-teal-700 uppercase tracking-widest">Joindre PDF</p>
                     <p className="text-[10px] text-teal-400 font-bold mt-1">Analyse de Contenu</p>
                   </div>
                </button>
              </div>

              {/* Loader & Preview */}
              {(capturedFileBase64 || isScanning) && (
                <div className="relative h-48 bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-800 group">
                   {capturedFileBase64 && !capturedFileType?.includes('pdf') ? (
                     <img src={capturedFileBase64} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[2s]" />
                   ) : capturedFileType === 'application/pdf' ? (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-teal-900/20">
                       <FileText size={48} className="text-teal-400 animate-bounce" />
                       <p className="text-teal-100 font-black text-xs uppercase tracking-widest mt-2">PDF Détecté</p>
                     </div>
                   ) : null}
                   {isScanning && (
                     <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-white mb-4" size={50} />
                        <p className="text-white font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Extraction de l'Objet & Date...</p>
                        <div className="mt-6 w-1/3 h-1 bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 w-full animate-infinite-scroll"></div>
                        </div>
                     </div>
                   )}
                </div>
              )}

              {/* Dynamic Form */}
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Hash size={12}/> Référence</label>
                       <input type="text" placeholder="REF-AUTO" className="w-full p-4.5 rounded-[1.25rem] bg-gray-50 border border-gray-100 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 font-bold transition-all" value={newMail.reference || ''} onChange={e => setNewMail({...newMail, reference: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Flux</label>
                       <select className="w-full p-4.5 rounded-[1.25rem] bg-gray-50 border border-gray-100 outline-none focus:ring-4 focus:ring-indigo-50 font-bold" value={newMail.direction} onChange={e => setNewMail({...newMail, direction: e.target.value as MailDirection})}>
                         <option value={MailDirection.INCOMING}>Entrant</option>
                         <option value={MailDirection.OUTGOING}>Sortant</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Objet du courrier (Extrait via OCR)</label>
                    <input type="text" placeholder="Détection automatique..." className="w-full p-4.5 rounded-[1.25rem] bg-gray-50 border border-gray-100 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 font-bold transition-all text-indigo-700" value={newMail.subject || ''} onChange={e => setNewMail({...newMail, subject: e.target.value})} />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Expéditeur</label>
                      <input type="text" placeholder="Nom..." className="w-full p-4.5 rounded-[1.25rem] bg-gray-50 border border-gray-100 font-bold" value={newMail.sender || ''} onChange={e => setNewMail({...newMail, sender: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Date d'Origine</label>
                      <input type="text" placeholder="JJ/MM/AAAA" className="w-full p-4.5 rounded-[1.25rem] bg-gray-50 border border-gray-100 font-bold" value={newMail.date || ''} onChange={e => setNewMail({...newMail, date: e.target.value})} />
                   </div>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4 sticky bottom-0">
               <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-200 transition-all">Annuler</button>
               <button onClick={handleSaveMail} className="flex-[2] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all" disabled={isScanning}>
                  {capturedFileType === 'application/pdf' ? 'Confirmer Archivage' : 'Enregistrer Flux'}
               </button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleDocumentUpload} />
            <input type="file" ref={pdfInputRef} className="hidden" accept="application/pdf" onChange={handleDocumentUpload} />
          </div>
        </div>
      )}

      {/* Viewing & Visualizing Modal */}
      {selectedMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" onClick={() => setSelectedMail(null)}></div>
           <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-[85vh] animate-in zoom-in-95 duration-300 border border-white/20">
              
              {/* Left Side: Document Visualizer */}
              <div className="flex-[3] bg-gray-950 flex flex-col items-center justify-center p-4 relative border-b md:border-b-0 md:border-r border-gray-800">
                 <div className="absolute top-6 left-6 z-10 flex gap-2">
                    <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                       <Eye size={12} /> Visualisation Haute Qualité
                    </span>
                 </div>
                 
                 {selectedMail.imageUrl ? (
                    selectedMail.imageUrl.includes('application/pdf') ? (
                      <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-2xl">
                        <iframe src={selectedMail.imageUrl} className="w-full h-full border-none" title="PDF Preview" />
                      </div>
                    ) : (
                      <img src={selectedMail.imageUrl} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all hover:scale-[1.02] duration-700" alt="Scanned Document" />
                    )
                 ) : (
                    <div className="flex flex-col items-center text-gray-700 animate-pulse">
                      <Archive size={120} strokeWidth={1} />
                      <p className="mt-6 font-black text-sm tracking-widest uppercase">Document sans visuel numérique</p>
                      <p className="text-gray-500 text-xs mt-2 font-medium">Archivé physiquement sous la référence {selectedMail.reference}</p>
                    </div>
                 )}

                 <div className="absolute bottom-6 right-6 flex gap-2">
                    <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all border border-white/5">
                       <Download size={20} />
                    </button>
                    <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all border border-white/5">
                       <ExternalLink size={20} />
                    </button>
                 </div>
              </div>

              {/* Right Side: Metadata Panel */}
              <div className="flex-[2] flex flex-col p-10 bg-white overflow-y-auto">
                 <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{selectedMail.reference}</span>
                      <button onClick={() => setSelectedMail(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 leading-tight mb-4">{selectedMail.subject}</h3>
                    <div className="flex gap-2">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${selectedMail.direction === MailDirection.INCOMING ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
                        {selectedMail.direction === MailDirection.INCOMING ? 'Entrant' : 'Sortant'}
                      </span>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest bg-gray-100 text-gray-600`}>
                        {selectedMail.status}
                      </span>
                    </div>
                 </div>

                 <div className="space-y-8 flex-1">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Origine / Expéditeur</p>
                         <p className="text-base font-bold text-gray-900">{selectedMail.sender}</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</p>
                         <p className="text-base font-bold text-gray-900">{selectedMail.recipient}</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Document</p>
                         <p className="text-base font-bold text-gray-900">{selectedMail.date}</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priorité</p>
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${selectedMail.priority === MailPriority.URGENT ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                           <p className="text-base font-bold text-gray-900">{selectedMail.priority}</p>
                         </div>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Résumé Intelligent (Scan Gemini)</p>
                       <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
                          <p className="text-sm text-indigo-900 leading-relaxed font-semibold italic">"{selectedMail.contentSummary || 'Pas de résumé disponible.'}"</p>
                       </div>
                    </div>

                    {selectedMail.trackingNumber && (
                      <div className="pt-8 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Suivi Expédition</p>
                        <p className="text-sm font-mono font-black text-gray-800 bg-gray-50 p-3 rounded-xl inline-block">{selectedMail.trackingNumber}</p>
                      </div>
                    )}
                 </div>

                 <div className="mt-12 flex gap-4">
                    <button className="flex-1 py-4.5 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all">Imprimer Archive</button>
                    <button className="flex-1 py-4.5 bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-gray-100 hover:bg-gray-100 transition-all">Modifier</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes infinite-scroll { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
        .animate-infinite-scroll { animation: infinite-scroll 2s linear infinite; }
        .py-4.5 { padding-top: 1.125rem; padding-bottom: 1.125rem; }
        input::placeholder { color: #cbd5e1; font-weight: 500; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
