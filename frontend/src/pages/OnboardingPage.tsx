import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Command, 
  Palette, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  Clock,
  Coins
} from 'lucide-react';
import { api } from '../services/api';
import { getAuthUser, setAuthUser } from '../utils/storage';

const TIMEZONES = [
  'UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 
  'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' }
];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');
  const [businessDesc, setBusinessDesc] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  // Branding state
  const [primaryColor, setPrimaryColor] = useState('#F7F5F0');
  const [secondaryColor, setSecondaryColor] = useState('#77736B');
  const [accentColor, setAccentColor] = useState('#B89452');
  const [themePreset, setThemePreset] = useState('light');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  useEffect(() => {
    // Detect system timezone
    try {
      const sysTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (sysTimezone) setTimezone(sysTimezone);
    } catch (e) {
      // ignore
    }

    const user = getAuthUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setContactEmail(user.email);
  }, [navigate]);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Studio name is required.');
        return;
      }
      if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug)) {
        setError('Please enter a valid slug (lowercase letters, numbers, and hyphens only).');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 800));

    try {
      const res = await api.onboard({
        name,
        slug,
        timezone,
        currency,
        businessDesc,
        contactEmail,
        phone,
        whatsapp,
        address,
        website,
        primaryColor,
        secondaryColor,
        accentColor,
        themePreset,
        logoUrl,
        faviconUrl
      });

      // Update user memberships storage
      const user = getAuthUser();
      if (user) {
        // Initialize memberships on user object
        const updatedUser = {
          ...user,
          memberships: [
            ...(user.memberships || []),
            res.organization
          ]
        };
        setAuthUser(updatedUser);
      }

      // Save preferred active workspace in localStorage
      localStorage.setItem('active_org_id', res.organization.id);
      localStorage.setItem('active_org_slug', res.organization.slug);

      // Force page reload or redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('[ONBOARDING ERROR]', err);
      setError(err.message || 'Onboarding failed. Please review your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg animate-ios-slide-up relative z-10">
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="text-zinc-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            Step {step} of 3
          </div>
          <div className="flex items-center gap-2">
            <Command className="w-6 h-6 text-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Studio Onboarding</span>
          </div>
        </div>

        <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-white">
              {step === 1 && 'Launch Your Studio'}
              {step === 2 && 'Business details'}
              {step === 3 && 'Design Your Brand'}
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              {step === 1 && 'Define your unique studio workspace address.'}
              {step === 2 && 'Set up your studio contact and business profiles.'}
              {step === 3 && 'Inject your color palette and custom branding.'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-mono leading-relaxed">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Studio Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                      placeholder="Royal Moments Studio"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Workspace Slug (URL suffix)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-[15px] text-zinc-600 text-xs font-mono">studio/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                      className="w-full pl-16 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all font-mono"
                      placeholder="royal-moments"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Timezone</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-white/20 transition-all appearance-none"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Currency</label>
                    <div className="relative">
                      <Coins className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-white/20 transition-all appearance-none"
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Business Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                        placeholder="+1 555-0199"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">WhatsApp Contact</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                      placeholder="+1 555-0199"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Studio Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                      placeholder="123 Creative St, New York"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                      placeholder="https://royalmoments.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Description</label>
                  <textarea
                    value={businessDesc}
                    onChange={(e) => setBusinessDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all h-20 resize-none"
                    placeholder="Briefly describe your services..."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 text-center">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Primary Color</label>
                    <div className="flex items-center gap-2 justify-center mt-1">
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-full border border-white/10 cursor-pointer overflow-hidden bg-transparent"
                      />
                      <span className="text-[10px] font-mono uppercase text-zinc-400">{primaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Secondary Color</label>
                    <div className="flex items-center gap-2 justify-center mt-1">
                      <input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded-full border border-white/10 cursor-pointer overflow-hidden bg-transparent"
                      />
                      <span className="text-[10px] font-mono uppercase text-zinc-400">{secondaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Accent Color</label>
                    <div className="flex items-center gap-2 justify-center mt-1">
                      <input 
                        type="color" 
                        value={accentColor} 
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-8 h-8 rounded-full border border-white/10 cursor-pointer overflow-hidden bg-transparent"
                      />
                      <span className="text-[10px] font-mono uppercase text-zinc-400">{accentColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Preset Theme</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setThemePreset('light')}
                      className={`py-3 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${themePreset === 'light' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/10 hover:border-white/20'}`}
                    >
                      Light Minimal
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemePreset('dark')}
                      className={`py-3 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${themePreset === 'dark' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/10 hover:border-white/20'}`}
                    >
                      Cinematic Dark
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Logo Image URL</label>
                  <div className="relative">
                    <Palette className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Favicon URL</label>
                  <div className="relative">
                    <Palette className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-[0.4] py-4 bg-transparent border border-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-full transition-all duration-300 hover:border-white/20 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-full transition-all duration-300 hover:bg-zinc-200 flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-full transition-all duration-300 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? 'Launching Studio...' : 'Complete Launch'} <CheckCircle className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
