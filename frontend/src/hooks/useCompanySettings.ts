import { useState, useEffect } from 'react';
import { type CompanyProfile, type Client, type GlobalSettings } from '../types';
import { api, getAccessToken } from '../services/api';
import { getAuthUser } from '../utils/storage';

const DEFAULT_GLOBAL: GlobalSettings = {
  pdfOwnerPassword: 'Artisans@2026',
  pdfWatermarkEnabled: true,
  pdfQrEnabled: true,
  pdfHashEnabled: true,
  pdfSecureRenderEnabled: false,
  pdfVerifyLinkEnabled: true,
  pdfSecretSalt: `SALT_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
  customThemes: []
};

const DEFAULT_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp_default',
    companyName: 'Studio Workspace',
    tagline: 'Luxury Creative Management',
    projectType: 'GENERAL',
    logo: '',
    email: 'info@studio.com',
    phone: '0000000000',
    address: 'Creative Studio Avenue',
    gstin: '',
    pan: '',
    website: '',
    invoicePrefix: 'INV',
    upiId: '',
    bankDetails: { accountName: 'STUDIO WORKSPACE', accountNumber: '', ifsc: '', bankName: '' },
    paymentTerms: 'Due on Receipt',
    invoiceNotes: 'Thank you for choosing Studio.',
    primaryColor: '#FAF9F6',
    secondaryColor: '#6F6A61',
    accentColor: '#B89452',
    backgroundColor: '#FAF9F6',
    textColor: '#1C1A17',
    themePreset: 'light',
    graphicsPreset: 'default',
    typographyPreset: 'CLASSIC',
    portalConfig: { clientPortal: true, staffPortal: true, publicBooking: true, productionWorkflow: true, revenueModule: true, marketingHub: true },
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];

// Tenant-specific module-level caches to share settings state across all active hook instances
const cachedCompaniesMap = new Map<string, CompanyProfile[]>();
const cachedGlobalSettingsMap = new Map<string, GlobalSettings>();
const hydratedMap = new Map<string, boolean>();
const hydrationPromiseMap = new Map<string, Promise<void> | null>();
const listeners = new Set<() => void>();

const getActiveOrgId = (): string => {
  return localStorage.getItem('active_org_id') || 'default_tenant';
};

const addListener = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(l => l());
};

export const clearCompanySettingsCache = () => {
  const orgId = getActiveOrgId();
  cachedCompaniesMap.delete(orgId);
  cachedGlobalSettingsMap.delete(orgId);
  hydratedMap.delete(orgId);
  hydrationPromiseMap.delete(orgId);
  localStorage.removeItem(`org_companies_${orgId}`);
  localStorage.removeItem(`org_global_settings_${orgId}`);
  notifyListeners();
};

export const useCompanySettings = () => {
  const orgId = getActiveOrgId();
  const tokenExists = !!getAccessToken();

  const [companies, setCompaniesState] = useState<CompanyProfile[]>(() => {
    const cached = cachedCompaniesMap.get(orgId);
    if (cached) return cached;
    const stored = localStorage.getItem(`org_companies_${orgId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        cachedCompaniesMap.set(orgId, parsed);
        return parsed;
      } catch {
        // fallback
      }
    }
    cachedCompaniesMap.set(orgId, DEFAULT_COMPANIES);
    localStorage.setItem(`org_companies_${orgId}`, JSON.stringify(DEFAULT_COMPANIES));
    return DEFAULT_COMPANIES;
  });

  const [globalSettings, setGlobalSettingsState] = useState<GlobalSettings>(() => {
    const cached = cachedGlobalSettingsMap.get(orgId);
    if (cached) return cached;
    const stored = localStorage.getItem(`org_global_settings_${orgId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        cachedGlobalSettingsMap.set(orgId, parsed);
        return parsed;
      } catch {
        // fallback
      }
    }
    cachedGlobalSettingsMap.set(orgId, DEFAULT_GLOBAL);
    localStorage.setItem(`org_global_settings_${orgId}`, JSON.stringify(DEFAULT_GLOBAL));
    return DEFAULT_GLOBAL;
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('All');

  // Synchronize internal component state when cache updates
  useEffect(() => {
    const handleUpdate = () => {
      setCompaniesState(cachedCompaniesMap.get(orgId) || DEFAULT_COMPANIES);
      setGlobalSettingsState(cachedGlobalSettingsMap.get(orgId) || DEFAULT_GLOBAL);
    };
    return addListener(handleUpdate);
  }, [orgId]);

  // Asynchronous background hydration from backend on component mount or active tenant changes
  useEffect(() => {
    if (!tokenExists) {
      hydratedMap.set(orgId, false);
      return;
    }
    if (hydratedMap.get(orgId)) return;
    let active = true;

    const hydrate = async () => {
      // Re-use active promise if hydration is already in progress for this tenant
      const activePromise = hydrationPromiseMap.get(orgId);
      if (activePromise) {
        try {
          await activePromise;
        } catch {
          // ignore
        }
        return;
      }

      const promise = (async () => {
        try {
          const [backendCompanies, backendGlobal] = await Promise.all([
            api.getCompanies(),
            api.getGlobalSettings()
          ]);

          if (!active) return;

          let changed = false;
          const authUser = getAuthUser();
          const isAdmin = authUser && authUser.role === 'Admin';

          // Handle companies list
          if (backendCompanies && Array.isArray(backendCompanies)) {
            if (backendCompanies.length > 0) {
              const currentStr = JSON.stringify(cachedCompaniesMap.get(orgId));
              const backendStr = JSON.stringify(backendCompanies);
              if (currentStr !== backendStr) {
                cachedCompaniesMap.set(orgId, backendCompanies);
                localStorage.setItem(`org_companies_${orgId}`, backendStr);
                changed = true;
              }
            } else if (isAdmin) {
              // Seed empty backend with initial defaults (Only for authorized Admin role)
              const toSeed = cachedCompaniesMap.get(orgId) || DEFAULT_COMPANIES;
              for (const comp of toSeed) {
                await api.saveCompany(comp.id, comp);
              }
              const fresh = await api.getCompanies();
              cachedCompaniesMap.set(orgId, fresh);
              localStorage.setItem(`org_companies_${orgId}`, JSON.stringify(fresh));
              changed = true;
            }
          }

          // Handle global settings
          if (backendGlobal) {
            const hasKeys = Object.keys(backendGlobal).length > 0;
            if (hasKeys) {
              const currentStr = JSON.stringify(cachedGlobalSettingsMap.get(orgId));
              const backendStr = JSON.stringify(backendGlobal);
              if (currentStr !== backendStr) {
                cachedGlobalSettingsMap.set(orgId, backendGlobal);
                localStorage.setItem(`org_global_settings_${orgId}`, backendStr);
                changed = true;
              }
            } else if (isAdmin) {
              // Seed empty global settings (Only for authorized Admin role)
              const toSeed = cachedGlobalSettingsMap.get(orgId) || DEFAULT_GLOBAL;
              await api.saveGlobalSettings(toSeed);
              const fresh = await api.getGlobalSettings();
              cachedGlobalSettingsMap.set(orgId, fresh);
              localStorage.setItem(`org_global_settings_${orgId}`, JSON.stringify(fresh));
              changed = true;
            }
          }

          hydratedMap.set(orgId, true);
          if (changed) {
            notifyListeners();
          }
        } catch (err) {
          console.warn("Failed to asynchronously hydrate settings from backend:", err);
          hydratedMap.set(orgId, true);
        }
      })();

      hydrationPromiseMap.set(orgId, promise);
      try {
        await promise;
      } finally {
        hydrationPromiseMap.set(orgId, null);
      }
    };

    hydrate();
    return () => { active = false; };
  }, [tokenExists, orgId]);

  const saveCompanies = async (updated: CompanyProfile[]) => {
    const previous = cachedCompaniesMap.get(orgId) || companies;
    cachedCompaniesMap.set(orgId, updated);
    localStorage.setItem(`org_companies_${orgId}`, JSON.stringify(updated));
    setCompaniesState([...updated]);
    notifyListeners();

    // Sync the default company logo as the "global" logo for sidebar fallback if none selected
    const def = updated.find(c => c.isDefault) || updated[0];
    if (def && def.logo) {
      localStorage.setItem(`org_company_logo_${orgId}`, def.logo);
    }

    // Persist changes and deletions to backend
    try {
      const deletedIds = previous
        .filter(prev => !updated.some(upd => upd.id === prev.id))
        .map(prev => prev.id);

      for (const id of deletedIds) {
        await api.deleteCompany(id);
      }

      for (const comp of updated) {
        await api.saveCompany(comp.id, comp);
      }
    } catch (err) {
      console.error("Failed to save company settings to backend:", err);
    }
  };

  const saveGlobalSettings = async (updated: GlobalSettings) => {
    cachedGlobalSettingsMap.set(orgId, updated);
    localStorage.setItem(`org_global_settings_${orgId}`, JSON.stringify(updated));
    setGlobalSettingsState({ ...updated });
    notifyListeners();

    try {
      await api.saveGlobalSettings(updated);
    } catch (err) {
      console.error("Failed to save global settings to backend:", err);
    }
  };

  const defaultCompany = companies.find(c => c.isDefault) || companies[0] || DEFAULT_COMPANIES[0];

  const settings = (selectedCompanyId === 'All'
    ? defaultCompany
    : (companies.find(c => c.id === selectedCompanyId) || defaultCompany)) || DEFAULT_COMPANIES[0];

  return {
    companies,
    saveCompanies,
    settings,
    defaultCompany,
    setSelectedCompanyId,
    selectedCompanyId,
    globalSettings,
    saveGlobalSettings
  };
};

export const useCompanyForClient = (client: Client | null) => {
  const { companies, defaultCompany } = useCompanySettings();
  if (!client) return defaultCompany;

  const clientType = (client.projectType || client.brand || '').toUpperCase();

  const matched = companies.find(c =>
    c.projectType.toUpperCase() === clientType
  );

  return matched || defaultCompany;
};
