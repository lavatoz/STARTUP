import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { type CompanyProfile } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import { quoteTemplates, invoiceTemplates, agreementTemplates, proposalTemplates } from '../templates/registry';
import { 
  Building, Palette, FileText, Upload, Trash2, 
  CheckCircle2, Plus, X, 
  Star, Settings as Gear, Check, Eye
} from 'lucide-react';
import { AgreementTemplateManager } from '../components/settings/AgreementTemplateManager';

// Live Mockup Preview Component
interface LivePreviewProps {
  formData: Partial<CompanyProfile>;
  activeModalTab: 'identity' | 'visual' | 'documents' | 'client';
}

const LiveWorkspacePreview: React.FC<LivePreviewProps> = ({ formData, activeModalTab }) => {
  const isDark = formData.themePreset === 'dark';
  
  // Resolve colors safely with fallbacks
  const bg = formData.backgroundColor || (isDark ? '#0c0b0a' : '#FAF9F6');
  const text = formData.textColor || (isDark ? '#fdfbf7' : '#1c1a17');
  const accent = formData.accentColor || '#B89452';
  const secondary = formData.secondaryColor || '#6F6A61';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E7E2D9';

  // Map typography preset to standard system fallbacks (Font Safety rule)
  const fontPreset = formData.typographyPreset || 'CLASSIC';
  const getFontFamily = () => {
    switch (fontPreset) {
      case 'MODERN':
        return '"Space Grotesk", system-ui, sans-serif';
      case 'ELEGANT':
        return '"Cormorant Garamond", Georgia, serif';
      case 'EDITORIAL':
        return '"DM Serif Display", Georgia, serif';
      case 'MINIMAL':
        return '"Inter", system-ui, sans-serif';
      case 'CLASSIC':
      default:
        return '"Playfair Display", Georgia, serif';
    }
  };

  const fontFamily = getFontFamily();

  return (
    <div className="w-full rounded-3xl border border-white/10 overflow-hidden bg-[#12110f] shadow-2xl flex flex-col h-[520px]">
      {/* Phone/Mac Mockup Frame Header */}
      <div className="bg-zinc-900 px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <div className="text-[10px] text-zinc-500 font-mono mx-auto truncate max-w-[200px]">
          {formData.website || 'client.studio.com'}
        </div>
      </div>

      {/* Mock App Content */}
      <div 
        className="flex-1 p-6 flex flex-col justify-between overflow-y-auto"
        style={{ backgroundColor: bg, color: text, fontFamily: fontFamily }}
      >
        {/* Header Section */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: border }}>
            <div className="flex items-center gap-3">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover border" style={{ borderColor: border }} />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ backgroundColor: accent, color: isDark ? '#000' : '#fff' }}
                >
                  {(formData.companyName || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider leading-none">
                  {formData.companyName || 'Studio Workspace'}
                </h4>
                {formData.tagline && (
                  <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                    {formData.tagline}
                  </p>
                )}
              </div>
            </div>
            
            {/* Favicon Indicator */}
            {formData.favicon && (
              <img src={formData.favicon} alt="Favicon" className="w-4 h-4 rounded object-cover opacity-80" />
            )}
          </div>

          {/* Dynamic Content depending on active edit tab */}
          {activeModalTab === 'identity' && (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl border" style={{ borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-2">Business Registry Data</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="opacity-50">Email:</span> <span>{formData.email || 'not set'}</span></div>
                  <div className="flex justify-between"><span className="opacity-50">Phone:</span> <span>{formData.phone || 'not set'}</span></div>
                  <div className="flex justify-between"><span className="opacity-50">WhatsApp:</span> <span>{formData.whatsapp || 'not set'}</span></div>
                  <div className="flex justify-between"><span className="opacity-50">Address:</span> <span className="text-right truncate max-w-[150px]">{formData.address || 'not set'}</span></div>
                </div>
              </div>
              <p className="text-[10px] text-center opacity-40">Identity parameters will populate generated document headers</p>
            </div>
          )}

          {activeModalTab === 'visual' && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-center mt-2">
                Luxury Creative Studio
              </h2>
              <p className="text-[11px] text-center opacity-70 leading-relaxed max-w-xs mx-auto">
                Our dynamic workspace adjusts colors and typography dynamically according to client preferences.
              </p>
              
              <div className="flex justify-center gap-3 mt-4">
                <button 
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                  style={{ backgroundColor: accent, color: isDark ? '#1C1A17' : '#FFFFFF' }}
                >
                  Primary Action
                </button>
                <button 
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all"
                  style={{ borderColor: accent, color: text }}
                >
                  Secondary Action
                </button>
              </div>

              {/* Color Swatch Panel */}
              <div className="grid grid-cols-5 gap-2 mt-6 p-2 rounded-xl border text-[9px] text-center" style={{ borderColor: border }}>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded border" style={{ backgroundColor: bg, borderColor: border }} />
                  <span className="opacity-60 mt-1">BG</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded border" style={{ backgroundColor: text, borderColor: border }} />
                  <span className="opacity-60 mt-1">Text</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded border" style={{ backgroundColor: accent, borderColor: border }} />
                  <span className="opacity-60 mt-1">Accent</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded border" style={{ backgroundColor: secondary, borderColor: border }} />
                  <span className="opacity-60 mt-1">Secondary</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded border" style={{ backgroundColor: formData.primaryColor || '#FAF9F6', borderColor: border }} />
                  <span className="opacity-60 mt-1">Primary</span>
                </div>
              </div>
            </div>
          )}

          {activeModalTab === 'documents' && (
            <div className="mt-6 space-y-4">
              <div className="border p-4 rounded-2xl" style={{ borderColor: border }}>
                <div className="flex justify-between items-start border-b pb-2 mb-3" style={{ borderColor: border }}>
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider">INVOICE</h5>
                    <p className="text-[9px] opacity-60">#{formData.invoicePrefix || 'INV'}-0024</p>
                  </div>
                  <p className="text-[10px] font-mono font-bold" style={{ color: accent }}>Rs. 1,50,000</p>
                </div>
                
                <div className="space-y-1.5 text-[10px] mb-4">
                  <div className="flex justify-between"><span className="opacity-50">Pre-Wedding Shoot</span> <span>Rs. 50,000</span></div>
                  <div className="flex justify-between"><span className="opacity-50">Traditional Coverage</span> <span>Rs. 1,00,000</span></div>
                </div>

                <div className="border-t pt-2 text-[9px] italic opacity-75" style={{ borderColor: border }}>
                  {formData.invoiceNotes || 'Thank you for choosing Studio.'}
                </div>
              </div>
            </div>
          )}

          {activeModalTab === 'client' && (
            <div className="mt-6 space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">Interactive Client Portal</p>
              <div className="grid grid-cols-2 gap-2">
                {formData.portalConfig?.clientPortal !== false && (
                  <div className="p-3 border rounded-xl flex items-center gap-2" style={{ borderColor: border }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Gallery</span>
                  </div>
                )}
                {formData.portalConfig?.staffPortal !== false && (
                  <div className="p-3 border rounded-xl flex items-center gap-2" style={{ borderColor: border }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Crew Tasks</span>
                  </div>
                )}
                {formData.portalConfig?.publicBooking !== false && (
                  <div className="p-3 border rounded-xl flex items-center gap-2" style={{ borderColor: border }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Book Now</span>
                  </div>
                )}
                {formData.portalConfig?.revenueModule !== false && (
                  <div className="p-3 border rounded-xl flex items-center gap-2" style={{ borderColor: border }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Payments</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="pt-4 border-t text-center text-[8px] opacity-50" style={{ borderColor: border }}>
          © {new Date().getFullYear()} {formData.companyName || 'Studio Workspace'} • All rights reserved
        </div>
      </div>
    </div>
  );
};

const CompanySettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'agreements' ? 'agreements' : 'brands';

  const { companies, saveCompanies } = useCompanySettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'default' | 'danger';
    onConfirm: () => void;
  } | null>(null);

  // Form State for Modal
  const [activeModalTab, setActiveModalTab] = useState<'identity' | 'visual' | 'documents' | 'client'>('identity');
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});
  const [themeStudioBrandId, setThemeStudioBrandId] = useState<string>('');

  React.useEffect(() => {
    if (companies.length > 0 && !themeStudioBrandId) {
      setThemeStudioBrandId(companies.find(c => c.isDefault)?.id || companies[0].id);
    }
  }, [companies, themeStudioBrandId]);

  const openModal = (company: CompanyProfile | null = null, tab: 'identity' | 'visual' | 'documents' | 'client' = 'identity') => {
    if (company) {
      setEditingCompany(company);
      setFormData(company);
    } else {
      setEditingCompany(null);
      setFormData({
        id: `comp_${new Date().getTime()}`,
        companyName: '',
        tagline: '',
        projectType: '',
        logo: '',
        favicon: '',
        whatsapp: '',
        email: '',
        phone: '',
        address: '',
        gstin: '',
        pan: '',
        website: '',
        invoicePrefix: '',
        upiId: '',
        bankDetails: { accountName: '', accountNumber: '', ifsc: '', bankName: '' },
        paymentTerms: 'Due on Receipt',
        invoiceNotes: 'Thank you for choosing Studio.',
        primaryColor: '#FAF9F6',
        secondaryColor: '#6F6A61',
        accentColor: '#B89452',
        backgroundColor: '#FAF9F6',
        textColor: '#1C1A17',
        themePreset: 'light',
        graphicsPreset: 'classic',
        typographyPreset: 'CLASSIC',
        portalConfig: { clientPortal: true, staffPortal: true, publicBooking: true, productionWorkflow: true, revenueModule: true, marketingHub: true },
        isDefault: companies.length === 0,
        createdAt: new Date().toISOString()
      });
    }
    setActiveModalTab(tab);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setFormData({});
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedCompanies: CompanyProfile[];

    // Ensure color input safety checks (Hex #RGB or #RRGGBB format validation)
    const colorHexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
    const validateColor = (col: string | undefined, fallback: string) => {
      if (!col || !colorHexRegex.test(col)) return fallback;
      return col;
    };

    const validatedFormData = {
      ...formData,
      primaryColor: validateColor(formData.primaryColor, '#FAF9F6'),
      secondaryColor: validateColor(formData.secondaryColor, '#6F6A61'),
      accentColor: validateColor(formData.accentColor, '#B89452'),
      backgroundColor: validateColor(formData.backgroundColor, '#FAF9F6'),
      textColor: validateColor(formData.textColor, '#1C1A17'),
    };

    if (editingCompany) {
      updatedCompanies = companies.map(c => c.id === editingCompany.id ? (validatedFormData as CompanyProfile) : c);
    } else {
      updatedCompanies = [...companies, validatedFormData as CompanyProfile];
    }

    // If this is set as default, unset others
    if (validatedFormData.isDefault) {
      updatedCompanies = updatedCompanies.map(c => ({
        ...c,
        isDefault: c.id === validatedFormData.id
      }));
    }

    saveCompanies(updatedCompanies);
    setSuccessMsg(editingCompany ? "Branding Settings Updated ✓" : "New Brand Portal Initialized ✓");
    closeModal();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteCompany = (id: string, name: string) => {
    if (companies.length <= 1) {
      alert("You must retain at least one default studio configuration.");
      return;
    }
    setPendingConfirm({
      title: 'Decommission Brand Portal',
      message: `Decommission and delete "${name}"? Access will be revoked and linked resources will fall back to default settings.`,
      confirmLabel: 'Decommission',
      tone: 'danger',
      onConfirm: () => {
        const filtered = companies.filter(c => c.id !== id);
        if (!filtered.some(c => c.isDefault) && filtered[0]) {
          filtered[0].isDefault = true;
        }
        saveCompanies(filtered);
        setSuccessMsg("Brand portal removed ✓");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleSetDefault = (id: string) => {
    const updated = companies.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    saveCompanies(updated);
    setSuccessMsg("Primary platform brand updated ✓");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds the maximum 2MB threshold.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512 * 1024) {
        alert("Favicon size exceeds the maximum 512KB threshold.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, favicon: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const projectTypes = Array.from(new Set(companies.map(c => c.projectType))).filter(Boolean);

  return (
    <>
    <ConfirmDialog
      isOpen={!!pendingConfirm}
      title={pendingConfirm?.title || ''}
      message={pendingConfirm?.message || ''}
      confirmLabel={pendingConfirm?.confirmLabel || 'Confirm'}
      tone={pendingConfirm?.tone || 'default'}
      onCancel={() => setPendingConfirm(null)}
      onConfirm={() => {
        const action = pendingConfirm?.onConfirm;
        setPendingConfirm(null);
        action?.();
      }}
    />
    <div className="max-w-7xl mx-auto pb-32 animate-ios-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
           <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-3">
              Settings
           </h1>
           <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">
              Central Brand Portals & Experience Configuration
           </p>
        </div>
        {successMsg && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-6 py-4 rounded-[2rem] animate-ios-slide-up shadow-2xl">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{successMsg}</span>
          </div>
        )}
      </div>

      {/* Main Settings Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-10 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSearchParams({ tab: 'brands' })}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'brands'
              ? 'bg-white text-black shadow-xl scale-[1.02]'
              : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Brand Portals & Ecosystem</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'agreements' })}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'agreements'
              ? 'bg-white text-black shadow-xl scale-[1.02]'
              : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Agreement Templates</span>
        </button>
      </div>

      {activeTab === 'agreements' ? (
        <AgreementTemplateManager />
      ) : (
        <>
      {/* Companies Grid */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
           <Building className="w-6 h-6 text-primary" />
           <h2 className="text-xl font-black text-white uppercase tracking-widest">Brand Portals</h2>
           <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 uppercase">{companies.length} Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {companies.map((company) => (
              <div 
                key={company.id}
                className={`glass-panel p-8 squircle-lg border transition-all duration-500 group relative flex flex-col h-full ${
                  company.isDefault 
                    ? 'border-primary/30 bg-primary/[0.02] ring-1 ring-primary/10' 
                    : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                }`}
              >
                {company.isDefault && (
                  <div className="absolute -top-3 -right-3 px-4 py-2 bg-primary text-black rounded-full shadow-2xl flex items-center gap-2 transform group-hover:scale-110 transition-transform cursor-help" title="Primary platform entity">
                    <Star className="w-3 h-3 fill-black" />
                    <span className="text-xs font-bold uppercase tracking-widest">Primary</span>
                  </div>
                )}

                <div className="flex items-start gap-6 mb-8">
                   <div className="relative shrink-0">
                      {company.logo ? (
                        <img src={company.logo} alt={company.companyName} className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-xl" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-3xl font-black text-zinc-700">
                          {company.companyName.charAt(0)}
                        </div>
                      )}
                      {company.accentColor && (
                        <div 
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-black shadow-lg" 
                          style={{ backgroundColor: company.accentColor }} 
                        />
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate leading-tight mb-1">{company.companyName}</h3>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest truncate">{company.tagline || 'No tagline set'}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                         <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-widest border border-white/5">TYPE: {company.projectType}</span>
                         <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-widest border border-white/5">PFX: {company.invoicePrefix}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openModal(company, 'identity')}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all active:scale-90"
                        title="Edit Identity"
                      >
                         <Gear className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal(company, 'visual')}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all active:scale-90"
                        title="Edit Visual Identity"
                      >
                         <Palette className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCompany(company.id, company.companyName)}
                        className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all active:scale-90"
                        title="Decommission Portal"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                   {!company.isDefault && (
                      <button 
                        onClick={() => handleSetDefault(company.id)}
                        className="px-5 py-3 bg-white/5 hover:bg-primary hover:text-black text-xs font-bold text-zinc-400 uppercase tracking-widest rounded-xl transition-all active:scale-95"
                      >
                         Make Primary
                      </button>
                   )}
                </div>
              </div>
           ))}

           {/* Add New Card */}
           <button 
             onClick={() => openModal()}
             className="glass-panel p-8 squircle-lg border-2 border-dashed border-white/5 hover:border-white/10 bg-transparent hover:bg-white/[0.01] transition-all flex flex-col items-center justify-center gap-6 group"
           >
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                 <Plus className="w-8 h-8" />
              </div>
              <div className="text-center">
                 <p className="text-lg font-black text-white uppercase tracking-tighter mb-1">Initialize New Brand</p>
                 <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Deploy a separate business vertical</p>
              </div>
           </button>
        </div>
      </section>
      </>
      )}

      {/* Add/Edit Modal (Redesigned Split Screen & Live Preview) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-12 pt-safe md:pt-12">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md md:backdrop-blur-3xl animate-ios-fade-in" onClick={closeModal} />
           <div className="relative w-full h-full md:max-h-[92vh] md:w-full md:max-w-6xl overflow-y-auto glass-panel border border-white/10 rounded-none md:rounded-[3rem] shadow-4xl animate-ios-slide-up no-scrollbar flex flex-col bg-zinc-950/95 md:bg-zinc-950/80">
              
              <div className="sticky top-0 z-10 p-6 md:p-8 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl hidden md:block">
                       <Building className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                           {editingCompany ? 'Configure Branding Settings' : 'Deploy Brand Instance'}
                        </h2>
                        <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[200px]">Portal ID: {formData.id}</p>
                    </div>
                 </div>
                 <button type="button" onClick={closeModal} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Tab Bar */}
              <div className="sticky top-[89px] md:top-[113px] z-10 px-6 md:px-8 flex overflow-x-auto no-scrollbar gap-8 border-b border-white/5 bg-zinc-950/95 backdrop-blur-xl pt-4">
                 <button type="button" onClick={() => setActiveModalTab('identity')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'identity' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Business Identity</button>
                 <button type="button" onClick={() => setActiveModalTab('visual')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'visual' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Visual Identity</button>
                 <button type="button" onClick={() => setActiveModalTab('documents')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'documents' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Document Branding</button>
                 <button type="button" onClick={() => setActiveModalTab('client')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'client' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Client Experience</button>
              </div>

              {/* Split Screen Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
                
                {/* Left Form Column (col-span-7) */}
                <form onSubmit={handleSaveCompany} className="lg:col-span-7 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar pb-24">
                  
                  {activeModalTab === 'identity' && (
                    <div className="space-y-8 animate-ios-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Studio Logo (Icon)</label>
                          <div className="flex items-center gap-4">
                            <div className="logo-checkerboard relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 flex items-center justify-center group">
                              {formData.logo ? (
                                <img src={formData.logo} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <Upload className="w-6 h-6 text-zinc-500" />
                              )}
                              <input type="file" id="logo-up" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                              <label htmlFor="logo-up" className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Plus className="w-5 h-5 text-white" />
                              </label>
                            </div>
                            <div className="text-[10px] text-zinc-500 leading-relaxed uppercase">
                              PNG / JPG (Max 2MB)<br/>1:1 Aspect ratio recommended
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Studio Favicon</label>
                          <div className="flex items-center gap-4">
                            <div className="logo-checkerboard relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 flex items-center justify-center group">
                              {formData.favicon ? (
                                <img src={formData.favicon} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <Upload className="w-6 h-6 text-zinc-500" />
                              )}
                              <input type="file" id="favicon-up" className="hidden" accept="image/*" onChange={handleFaviconUpload} />
                              <label htmlFor="favicon-up" className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Plus className="w-5 h-5 text-white" />
                              </label>
                            </div>
                            <div className="text-[10px] text-zinc-500 leading-relaxed uppercase">
                              PNG (Max 512KB)<br/>16x16 or 32x32 recommended
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Studio Business Name *</label>
                          <input required type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-primary outline-none" value={formData.companyName} onChange={e => setFormData(p => ({...p, companyName: e.target.value}))} placeholder="e.g. Oakridge Photography" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Business Tagline</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-primary outline-none" value={formData.tagline} onChange={e => setFormData(p => ({...p, tagline: e.target.value}))} placeholder="e.g. Timeless Stories Stilled" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Workspace Link (Project Status Vector) *</label>
                          <input required type="text" list="projectTypes" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-primary outline-none uppercase" value={formData.projectType} onChange={e => setFormData(p => ({...p, projectType: e.target.value.toUpperCase()}))} placeholder="e.g. WEDDING" />
                          <datalist id="projectTypes">
                            {projectTypes.map(t => <option key={t} value={t} />)}
                          </datalist>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Invoice Code Prefix *</label>
                          <input required type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-primary outline-none uppercase" value={formData.invoicePrefix} onChange={e => setFormData(p => ({...p, invoicePrefix: e.target.value.toUpperCase()}))} placeholder="e.g. OR" />
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-6 space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Communication & Contact Registry</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Support Email</label>
                            <input type="email" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} placeholder="hello@oakridge.com" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Support Hotline</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} placeholder="+91 99999 99999" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">WhatsApp Integration</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.whatsapp} onChange={e => setFormData(p => ({...p, whatsapp: e.target.value}))} placeholder="+91 99999 99999" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Website URL</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.website} onChange={e => setFormData(p => ({...p, website: e.target.value}))} placeholder="www.oakridge.com" />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Base Operational Address</label>
                            <textarea rows={2} className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none resize-none" value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} placeholder="Studio Suite 101, Oakridge Avenue" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModalTab === 'visual' && (
                    <div className="space-y-8 animate-ios-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Interface Theme Preset</label>
                          <select className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-primary outline-none cursor-pointer" value={formData.themePreset} onChange={e => setFormData(p => ({...p, themePreset: e.target.value}))}>
                            <option value="light">Premium Light (Cream & Charcoal)</option>
                            <option value="dark">Luxury Dark (charcoal & Obsidian)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Typography Preset</label>
                          <select className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-primary outline-none cursor-pointer" value={formData.typographyPreset} onChange={e => setFormData(p => ({...p, typographyPreset: e.target.value}))}>
                            <option value="CLASSIC">Classic Serif (Playfair Display)</option>
                            <option value="MODERN">Modern Sans (Space Grotesk)</option>
                            <option value="ELEGANT">Elegant Editorial (Cormorant Garamond)</option>
                            <option value="EDITORIAL">Editorial Heavy (DM Serif Display)</option>
                            <option value="MINIMAL">Minimalist Mono (Inter)</option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-6 space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Custom Color Architecture</h4>
                        <p className="text-[10px] text-zinc-500 uppercase leading-none">Colors must follow safe hex formats (#RGB or #RRGGBB)</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <div>
                              <span className="text-xs font-bold uppercase text-white tracking-widest block">Background Color</span>
                              <span className="text-[9px] font-mono text-zinc-500">{formData.backgroundColor || '#FAF9F6'}</span>
                            </div>
                            <input type="color" className="w-10 h-10 bg-transparent border-none cursor-pointer" value={formData.backgroundColor || '#FAF9F6'} onChange={e => setFormData(p => ({...p, backgroundColor: e.target.value}))} />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <div>
                              <span className="text-xs font-bold uppercase text-white tracking-widest block">Typography Color</span>
                              <span className="text-[9px] font-mono text-zinc-500">{formData.textColor || '#1C1A17'}</span>
                            </div>
                            <input type="color" className="w-10 h-10 bg-transparent border-none cursor-pointer" value={formData.textColor || '#1C1A17'} onChange={e => setFormData(p => ({...p, textColor: e.target.value}))} />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <div>
                              <span className="text-xs font-bold uppercase text-white tracking-widest block">Accent Highlight</span>
                              <span className="text-[9px] font-mono text-zinc-500">{formData.accentColor || '#B89452'}</span>
                            </div>
                            <input type="color" className="w-10 h-10 bg-transparent border-none cursor-pointer" value={formData.accentColor || '#B89452'} onChange={e => setFormData(p => ({...p, accentColor: e.target.value}))} />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <div>
                              <span className="text-xs font-bold uppercase text-white tracking-widest block">Secondary Details</span>
                              <span className="text-[9px] font-mono text-zinc-500">{formData.secondaryColor || '#6F6A61'}</span>
                            </div>
                            <input type="color" className="w-10 h-10 bg-transparent border-none cursor-pointer" value={formData.secondaryColor || '#6F6A61'} onChange={e => setFormData(p => ({...p, secondaryColor: e.target.value}))} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModalTab === 'documents' && (
                    <div className="space-y-8 animate-ios-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Quote Layout Template</label>
                          <select className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer" value={formData.defaultQuoteTemplate || 'default_v1'} onChange={e => setFormData(p => ({...p, defaultQuoteTemplate: e.target.value}))}>
                            {Object.values(quoteTemplates).map(t => (
                              <option key={t.metadata.id} value={t.metadata.id}>{t.metadata.name} (v{t.metadata.version})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Invoice Layout Template</label>
                          <select className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer" value={formData.defaultInvoiceTemplate || 'default_v1'} onChange={e => setFormData(p => ({...p, defaultInvoiceTemplate: e.target.value}))}>
                            {Object.values(invoiceTemplates).map(t => (
                              <option key={t.metadata.id} value={t.metadata.id}>{t.metadata.name} (v{t.metadata.version})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Agreement Legal Terms Template</label>
                          <select className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer" value={formData.defaultAgreementTemplate || 'default_v1'} onChange={e => setFormData(p => ({...p, defaultAgreementTemplate: e.target.value}))}>
                            {Object.values(agreementTemplates).map(t => (
                              <option key={t.metadata.id} value={t.metadata.id}>{t.metadata.name} (v{t.metadata.version})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Proposal Layout Template</label>
                          <select className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer" value={formData.defaultProposalTemplate || 'default_v1'} onChange={e => setFormData(p => ({...p, defaultProposalTemplate: e.target.value}))}>
                            {Object.values(proposalTemplates).map(t => (
                              <option key={t.metadata.id} value={t.metadata.id}>{t.metadata.name} (v{t.metadata.version})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Baseline Payment Milestones</label>
                            <select className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer" value={formData.paymentTerms} onChange={e => setFormData(p => ({...p, paymentTerms: e.target.value}))}>
                              <option value="Due on Receipt">Due on Receipt (Standard)</option>
                              <option value="Net 7">Net 7 Business Days</option>
                              <option value="Net 15">Net 15 Business Days</option>
                              <option value="Net 30">Net 30 Business Days</option>
                              <option value="50% Advance, 50% on Delivery">50/50 Advance/Delivery Structure</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Dynamic PDF Footer Notes</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.invoiceNotes} onChange={e => setFormData(p => ({...p, invoiceNotes: e.target.value}))} placeholder="e.g. Terms apply. Payments are non-refundable." />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-6 space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Financial Settlements & Tax Indexing</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">UPI Virtual Payment Address (VPA)</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.upiId} onChange={e => setFormData(p => ({...p, upiId: e.target.value}))} placeholder="business@upi" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">GSTIN Registry</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none uppercase" value={formData.gstin} onChange={e => setFormData(p => ({...p, gstin: e.target.value.toUpperCase()}))} placeholder="22AAAAA0000A1Z5" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Bank Name</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.bankName} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), bankName: e.target.value}}))} placeholder="Federal Bank" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Account Holder Name</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.accountName} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), accountName: e.target.value}}))} placeholder="Oakridge Studio LLP" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Account Number</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.accountNumber} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), accountNumber: e.target.value}}))} placeholder="99990100023456" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest px-1">Bank IFSC Route Code</label>
                            <input type="text" className="w-full glass-panel rounded-2xl p-4 text-sm font-bold text-white focus:border-white/20 outline-none uppercase" value={formData.bankDetails?.ifsc} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), ifsc: e.target.value.toUpperCase()}}))} placeholder="FDRL0001234" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModalTab === 'client' && (
                    <div className="space-y-8 animate-ios-fade-in">
                      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                        <Building className="w-5 h-5 text-purple-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Client Portal Configuration</h3>
                      </div>
                      
                      <p className="text-xs text-zinc-500 uppercase leading-normal">
                        Toggle functional portals and digital access privileges for this brand ecosystem.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries({
                          clientPortal: ['Client Workspace', 'External client access to quotes, signed agreements & photo galleries'],
                          staffPortal: ['Creative Team Hub', 'Internal workspaces for assigned coordinators, operators and crew'],
                          publicBooking: ['Lead Intake Engine', 'Public contact booking page and client questionnaire capture'],
                          productionWorkflow: ['Workflow Management', 'Client pipeline states, deliverables Kanban, and event status'],
                          revenueModule: ['Revenue & Financials', 'Milestone reminders, automatic balance tracking and receipts'],
                          marketingHub: ['Campaign & Outreach', 'Dynamic referral templates and CRM analytics']
                        }).map(([key, [title, desc]]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData(p => ({ 
                              ...p, 
                              portalConfig: { 
                                ...(p.portalConfig || { clientPortal: true, staffPortal: true, publicBooking: true, productionWorkflow: true, revenueModule: true, marketingHub: true }), 
                                [key]: !p.portalConfig?.[key as keyof typeof p.portalConfig]
                              } 
                            }))}
                            className={`p-6 rounded-2xl border transition-all text-left flex items-start gap-4 ${
                              formData.portalConfig?.[key as keyof typeof formData.portalConfig] !== false
                                ? 'bg-white/5 border-white/20' 
                                : 'bg-transparent border-white/5 opacity-55'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                              formData.portalConfig?.[key as keyof typeof formData.portalConfig] !== false
                                ? 'bg-primary text-black' 
                                : 'bg-white/10'
                            }`}>
                              {formData.portalConfig?.[key as keyof typeof formData.portalConfig] !== false && <Check className="w-3 h-3" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white uppercase tracking-widest">{title}</p>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1 leading-relaxed">{desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Sticky Footer Inside Form Scroll */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5 mt-10">
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="peer hidden" 
                          checked={formData.isDefault} 
                          onChange={e => setFormData(p => ({...p, isDefault: e.target.checked}))}
                          disabled={editingCompany?.isDefault}
                        />
                        <div className="w-12 h-6 bg-zinc-800 rounded-full border border-white/10 peer-checked:bg-primary transition-all p-1">
                          <div className={`w-4 h-4 bg-white rounded-full transition-all transform ${formData.isDefault ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">Primary Studio Settings</p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none mt-0.5">Primary default configuration fallback</p>
                      </div>
                    </label>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                      <button 
                        type="button" 
                        onClick={closeModal}
                        className="px-6 py-4 bg-white/5 text-zinc-400 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>

                </form>

                {/* Right Sticky Preview Column (col-span-5) */}
                <div className="lg:col-span-5 border-l border-white/5 bg-zinc-950/40 p-6 md:p-8 overflow-y-auto hidden lg:block">
                  <div className="sticky top-0 space-y-6">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-zinc-500" />
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Branded Studio Preview</h3>
                    </div>
                    
                    <LiveWorkspacePreview 
                      formData={formData} 
                      activeModalTab={activeModalTab} 
                    />

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Workspace Presets Info</p>
                      <p className="text-[9px] leading-relaxed text-zinc-600 uppercase">
                        This panel simulates the layout aesthetics, fonts and color variables that will render dynamically when clients switch organizations.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

           </div>
        </div>
      )}

      <style>{`
        .logo-checkerboard {
          background-image: linear-gradient(45deg, #18181b 25%, transparent 25%),
                          linear-gradient(-45deg, #18181b 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #18181b 75%),
                          linear-gradient(-45deg, transparent 75%, #18181b 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
    </>
  );
};

export default CompanySettingsPage;
