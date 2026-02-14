
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Event, Table, Sale, User, Category, Organization, SaaSExpense, SaaSTransaction, Announcement, AppNotification } from '../types';

// Varsayılan Ana Şirket (Eski veriler için)
const DEFAULT_ORG_ID = 'org-default';
const DEFAULT_ORG: Organization = {
    id: DEFAULT_ORG_ID,
    name: 'Demo Organizasyon',
    commercialTitle: 'Demo Turizm Ltd. Şti.',
    isActive: true,
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString()
};

const EMPTY_EVENT: Event = {
  id: '',
  organizationId: '',
  name: '',
  organizer: '', 
  date: '',
  time: '',
  venue: '',
  location: '',
  status: 'active',
  categories: [],
};

// Süper Admin (Tüm sistemi yöneten)
const INITIAL_SUPER_ADMIN: User = {
  id: 'sys-admin',
  organizationId: 'system',
  username: 'root',
  password: 'root',
  name: 'Sistem Yöneticisi',
  role: 'super_admin',
  permissions: [
      'MANAGE_ORGANIZATIONS', 
      'VIEW_DASHBOARD', 
      'MANAGE_EVENTS', 
      'VIEW_SALES', 
      'MAKE_SALES', 
      'VIEW_CUSTOMERS', 
      'SCAN_TICKETS', 
      'MANAGE_STAFF'
  ]
};

const INITIAL_ADMIN: User = {
  id: 'admin-1',
  organizationId: DEFAULT_ORG_ID,
  username: 'admin',
  password: '123',
  name: 'Firma Yöneticisi',
  role: 'admin',
  permissions: ['VIEW_DASHBOARD', 'MANAGE_EVENTS', 'VIEW_SALES', 'MAKE_SALES', 'VIEW_CUSTOMERS', 'SCAN_TICKETS', 'MANAGE_STAFF']
};

// SECURITY & UTILS
const sanitizeString = (str: string): string => {
    if (!str) return '';
    return str.replace(/[<>]/g, '').trim().substring(0, 500);
};

const sanitizeNumber = (num: any): number => {
    const n = parseFloat(num);
    return isNaN(n) ? 0 : n;
};

// --- KRİPTOGRAFİK GÜÇLÜ ID ÜRETİCİ ---
const generateId = (prefix: string): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${prefix}-${s4()}${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

interface AppContextType {
  user: User | null;
  organizations: Organization[];
  addOrganization: (org: Organization, adminUser: User, initialPayment?: number) => void;
  updateOrganization: (org: Organization) => void;
  deleteOrganization: (orgId: string) => void;
  
  saasExpenses: SaaSExpense[];
  addSaaSExpense: (expense: SaaSExpense) => void;
  deleteSaaSExpense: (id: string) => void;
  
  saasTransactions: SaaSTransaction[];
  addSaaSTransaction: (transaction: SaaSTransaction) => void;
  deleteSaaSTransaction: (id: string) => void;
  getOrganizationBalance: (orgId: string) => number;

  announcements: Announcement[];
  addAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;

  licenseDaysLeft: number | null;
  isLicenseExpired: boolean;

  users: User[]; 
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  
  events: Event[];
  currentEvent: Event;
  setCurrentEvent: (event: Event) => void;
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;

  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;

  tables: Table[];
  addTable: (table: Table) => boolean;
  addBulkTables: (tables: Table[]) => number;
  updateTable: (table: Table) => boolean;
  deleteTable: (tableId: string) => void;
  deleteAllTables: () => void;
  checkTableNumberExists: (number: string, excludeTableId?: string) => boolean;

  sales: Sale[];
  addSale: (sale: Sale) => void;
  cancelSale: (saleId: string) => void;
  updateSaleAndTable: (saleId: string, targetTableId: string | null, newCapacity: number | null) => void;
  
  checkTicket: (qrCode: string) => { valid: boolean; message: string; sale?: Sale; table?: Table; code?: 'INVALID' | 'WRONG_EVENT' | 'FULL' | 'SUCCESS' };
  approveEntry: (saleId: string, count: number, note?: string, authorizer?: User) => void;
  collectDebtAndApprove: (saleId: string, count: number, authorizer?: User) => void;

  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getStored = <T,>(key: string, initial: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initial;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return initial;
  }
};

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`LocalStorage Error (${key}):`, e);
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('UYARI: Tarayıcı hafızası doldu! Son işlem kaydedilemedi.');
    }
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- RAW DATA ---
  const [organizations, setOrganizations] = useState<Organization[]>(() => getStored('app_orgs', [DEFAULT_ORG]));
  const [saasExpenses, setSaasExpenses] = useState<SaaSExpense[]>(() => getStored('app_saas_expenses', []));
  const [saasTransactions, setSaasTransactions] = useState<SaaSTransaction[]>(() => getStored('app_saas_transactions', []));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getStored('app_announcements', []));

  const [allUsers, setAllUsers] = useState<User[]>(() => {
      const stored = getStored<User[]>('app_users', []);
      let users = stored;
      if (users.length === 0) users = [INITIAL_SUPER_ADMIN, INITIAL_ADMIN];
      users = users.map(u => u.organizationId ? u : { ...u, organizationId: DEFAULT_ORG_ID });
      
      users = users.filter(u => u.username !== INITIAL_SUPER_ADMIN.username);
      users.push(INITIAL_SUPER_ADMIN);

      return users;
  });
  
  const [allEvents, setAllEvents] = useState<Event[]>(() => {
      const stored = getStored<Event[]>('app_events', []);
      return Array.isArray(stored) ? stored.map(e => ({
          ...e,
          organizationId: e.organizationId || DEFAULT_ORG_ID,
          categories: Array.isArray(e.categories) ? e.categories : []
      })) : [];
  });

  const [user, setUser] = useState<User | null>(() => getStored('app_user', null));
  const [currentEvent, setCurrentEvent] = useState<Event>(EMPTY_EVENT); 
  
  const [allTables, setAllTables] = useState<Table[]>(() => getStored('app_tables', []));
  const [allSales, setAllSales] = useState<Sale[]>(() => getStored('app_sales', []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getStored('app_notifications', []));
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => { saveToStorage('app_orgs', organizations); }, [organizations]);
  useEffect(() => { saveToStorage('app_saas_expenses', saasExpenses); }, [saasExpenses]);
  useEffect(() => { saveToStorage('app_saas_transactions', saasTransactions); }, [saasTransactions]);
  useEffect(() => { saveToStorage('app_announcements', announcements); }, [announcements]);
  useEffect(() => { saveToStorage('app_user', user); }, [user]);
  useEffect(() => { saveToStorage('app_users', allUsers); }, [allUsers]);
  useEffect(() => { saveToStorage('app_events', allEvents); }, [allEvents]);
  useEffect(() => { saveToStorage('app_tables', allTables); }, [allTables]);
  useEffect(() => { saveToStorage('app_sales', allSales); }, [allSales]);
  useEffect(() => { saveToStorage('app_notifications', notifications); }, [notifications]);

  // --- FILTERED DATA (SECURITY LAYER) ---
  const visibleEvents = useMemo(() => {
      if (!user) return [];
      if (user.role === 'super_admin') return allEvents; 
      return allEvents.filter(e => e.organizationId === user.organizationId);
  }, [allEvents, user]);

  const visibleUsers = useMemo(() => {
      if (!user) return [];
      if (user.role === 'super_admin') return allUsers;
      return allUsers.filter(u => u.organizationId === user.organizationId);
  }, [allUsers, user]);

  // FIX: Masaları doğrudan visibleEvents üzerinden değil, allEvents ve organizationId eşleşmesiyle filtrele
  const visibleTables = useMemo(() => {
      if (!user) return [];
      if (user.role === 'super_admin') return allTables;
      
      // Güvenli Filtreleme: Masanın ait olduğu etkinlik, kullanıcının organizasyonuna ait mi?
      return allTables.filter(t => {
          const event = allEvents.find(e => e.id === t.eventId);
          return event && event.organizationId === user.organizationId;
      });
  }, [allTables, allEvents, user]);

  const visibleSales = useMemo(() => {
      if (!user) return [];
      if (user.role === 'super_admin') return allSales;
      
      return allSales.filter(s => {
          const event = allEvents.find(e => e.id === s.eventId);
          return event && event.organizationId === user.organizationId;
      });
  }, [allSales, allEvents, user]);

  // --- NOTIFICATION HELPER ---
  const createNotification = (title: string, message: string, type: 'sale' | 'alert' | 'info' | 'success', relatedSaleId?: string) => {
      if (!user) return;
      const newNotif: AppNotification = {
          id: generateId('notif'),
          organizationId: user.organizationId,
          type,
          title,
          message,
          timestamp: new Date().toISOString(),
          isRead: false,
          relatedSaleId
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  
  const clearAllNotifications = () => {
      if (!user) return;
      setNotifications(prev => prev.map(n => n.organizationId === user.organizationId ? { ...n, isRead: true } : n));
  };

  // --- LICENSE LOGIC ---
  const { licenseDaysLeft, isLicenseExpired } = useMemo(() => {
      if (!user || user.role === 'super_admin') return { licenseDaysLeft: null, isLicenseExpired: false };
      const org = organizations.find(o => o.id === user.organizationId);
      if (!org || !org.subscriptionEndDate) return { licenseDaysLeft: null, isLicenseExpired: false };
      const today = new Date();
      const end = new Date(org.subscriptionEndDate);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return { licenseDaysLeft: diffDays, isLicenseExpired: diffDays <= 0 || !org.isActive };
  }, [user, organizations]);

  useEffect(() => {
    if (visibleEvents.length > 0) {
        if (currentEvent.id === '' || (currentEvent.organizationId && currentEvent.organizationId !== user?.organizationId)) {
            setCurrentEvent(visibleEvents[0]);
        }
    } else if (visibleEvents.length === 0 && currentEvent.id !== '') {
      setCurrentEvent(EMPTY_EVENT);
    }
  }, [visibleEvents, user]);

  // --- ACTIONS ---

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const login = (username: string, password: string) => {
    const foundUser = allUsers.find(u => u.username === username && u.password === password);
    if (foundUser) { 
        setUser(foundUser); 
        return true; 
    }
    return false;
  };

  const logout = () => { setUser(null); closeMobileMenu(); };

  const addOrganization = (org: Organization, adminUser: User, initialPayment: number = 0) => {
      const orgId = org.id || generateId('org'); 
      const cleanOrg = { 
          ...org, 
          id: orgId, 
          name: sanitizeString(org.name), 
          contactPerson: sanitizeString(org.contactPerson || '') 
      };
      
      const cleanAdmin = {
          ...adminUser,
          id: generateId('u'), 
          organizationId: orgId
      };

      const licensePrice = parseFloat(org.licensePrice?.toString() || '0');
      const discountValue = parseFloat(org.discountValue?.toString() || '0');
      let discountAmount = 0;

      if (org.discountType === 'percentage') {
          discountAmount = licensePrice * (discountValue / 100);
      } else {
          discountAmount = discountValue;
      }

      const netPrice = Math.max(0, licensePrice - discountAmount);
      const newTransactions: SaaSTransaction[] = [];

      if (netPrice > 0) {
          const description = discountAmount > 0 
            ? `Lisans Bedeli (Liste: ${licensePrice}TL - İskonto: ${discountAmount}TL)`
            : 'Lisans Bedeli (Açılış)';

          newTransactions.push({
              id: generateId('tr-inv'), 
              organizationId: orgId,
              type: 'invoice',
              amount: netPrice,
              description: description,
              date: new Date().toISOString(),
              processedBy: 'Sistem'
          });
      }

      if (initialPayment > 0) {
          newTransactions.push({
              id: generateId('tr-pay'),
              organizationId: orgId,
              type: 'payment',
              amount: initialPayment,
              description: 'Lisans Peşinatı',
              date: new Date().toISOString(),
              processedBy: 'Sistem'
          });
      }

      setOrganizations(prev => [...prev, cleanOrg]);
      setAllUsers(prev => [...prev, cleanAdmin]);
      
      if (newTransactions.length > 0) {
          setSaasTransactions(prev => [...newTransactions, ...prev]);
      }
  };

  const updateOrganization = (org: Organization) => {
    const cleanOrg = { ...org, name: sanitizeString(org.name), contactPerson: sanitizeString(org.contactPerson || '') };
    setOrganizations(prev => prev.map(o => o.id === org.id ? cleanOrg : o));
  };

  const deleteOrganization = (orgId: string) => {
      if (!orgId) return;
      const orgExists = organizations.some(o => o.id === orgId);
      if (!orgExists) return;

      setOrganizations(prev => prev.filter(o => o.id !== orgId));
      setAllUsers(prev => prev.filter(u => u.organizationId !== orgId));
      
      const orgEvents = allEvents.filter(e => e.organizationId === orgId).map(e => e.id);
      setAllEvents(prev => prev.filter(e => e.organizationId !== orgId));
      setAllTables(prev => prev.filter(t => !orgEvents.includes(t.eventId)));
      setAllSales(prev => prev.filter(s => !orgEvents.includes(s.eventId)));
      
      setSaasTransactions(prev => prev.filter(t => t.organizationId !== orgId));
      setNotifications(prev => prev.filter(n => n.organizationId !== orgId));
  };

  const addSaaSExpense = (expense: SaaSExpense) => setSaasExpenses(prev => [{...expense, id: generateId('exp'), title: sanitizeString(expense.title)}, ...prev]);
  const deleteSaaSExpense = (id: string) => setSaasExpenses(prev => prev.filter(e => e.id !== id));
  
  const addSaaSTransaction = (transaction: SaaSTransaction) => {
      if (!transaction.organizationId) {
          console.error("HATA: Organizasyon ID'si olmayan işlem eklenemez!", transaction);
          return;
      }
      const newTransaction = { 
          ...transaction, 
          id: generateId('tr'), 
          description: sanitizeString(transaction.description) 
      };
      setSaasTransactions(prev => [newTransaction, ...prev]);
  };
  
  const deleteSaaSTransaction = (id: string) => {
      if(!id) return;
      setSaasTransactions(prev => prev.filter(t => t.id !== id));
  };
  
  const getOrganizationBalance = (orgId: string) => {
      if (!orgId) return 0;
      const txs = saasTransactions.filter(t => t.organizationId === orgId);
      let balance = 0;
      txs.forEach(t => {
          if (t.type === 'invoice') balance += t.amount;
          else if (t.type === 'payment') balance -= t.amount;
          else if (t.type === 'refund') balance += t.amount;
      });
      return balance;
  };

  const addAnnouncement = (announcement: Announcement) => setAnnouncements(prev => [{...announcement, id: generateId('ann'), title: sanitizeString(announcement.title), message: sanitizeString(announcement.message)}, ...prev]);
  const deleteAnnouncement = (id: string) => setAnnouncements(prev => prev.filter(a => a.id !== id));

  const addUser = (newUser: User) => {
      const userOrgId = user?.role === 'super_admin' ? (newUser.organizationId || DEFAULT_ORG_ID) : user?.organizationId;
      setAllUsers(prev => [...prev, { ...newUser, id: generateId('u'), name: sanitizeString(newUser.name), organizationId: userOrgId! }]);
  };
  const deleteUser = (userId: string) => setAllUsers(prev => prev.filter(u => u.id !== userId));

  const addEvent = (event: Event) => {
      const eventOrgId = user?.role === 'super_admin' ? (event.organizationId || DEFAULT_ORG_ID) : user?.organizationId;
      setAllEvents(prev => [...prev, { ...event, id: generateId('evt'), name: sanitizeString(event.name), venue: sanitizeString(event.venue), location: sanitizeString(event.location), organizationId: eventOrgId! }]);
  };
  const updateEvent = (event: Event) => setAllEvents(prev => prev.map(e => e.id === event.id ? {...event, name: sanitizeString(event.name)} : e));
  const deleteEvent = (eventId: string) => {
    setAllEvents(prev => prev.filter(e => e.id !== eventId));
    if (currentEvent.id === eventId) setCurrentEvent(EMPTY_EVENT);
  };

  const addCategory = (category: Category) => {
    const cleanCat = { ...category, id: generateId('cat'), name: sanitizeString(category.name), pricePerPerson: sanitizeNumber(category.pricePerPerson) };
    setAllEvents(prev => prev.map(ev => ev.id !== category.eventId ? ev : { ...ev, categories: [...(ev.categories || []), cleanCat] }));
    if (currentEvent.id === category.eventId) setCurrentEvent(prev => ({ ...prev, categories: [...(prev.categories || []), cleanCat] }));
  };
  const updateCategory = (category: Category) => {
    const cleanCat = { ...category, name: sanitizeString(category.name), pricePerPerson: sanitizeNumber(category.pricePerPerson) };
    setAllEvents(prev => prev.map(ev => ev.id !== category.eventId ? ev : { ...ev, categories: (ev.categories || []).map(c => c.id === category.id ? cleanCat : c) }));
    if (currentEvent.id === category.eventId) setCurrentEvent(prev => ({ ...prev, categories: (prev.categories || []).map(c => c.id === category.id ? cleanCat : c) }));
  };
  const deleteCategory = (categoryId: string) => {
    setAllEvents(prev => prev.map(ev => ({ ...ev, categories: (ev.categories || []).filter(c => c.id !== categoryId) })));
    setCurrentEvent(prev => ({ ...prev, categories: (prev.categories || []).filter(c => c.id !== categoryId) }));
  };

  const checkTableNumberExists = (number: string, excludeTableId?: string) => {
    return allTables.some(t => t.eventId === currentEvent.id && t.number.toLowerCase() === number.toLowerCase() && t.id !== excludeTableId);
  };
  
  const addTable = (table: Table) => {
    if (checkTableNumberExists(table.number)) return false;
    setAllTables(prev => [...prev, { ...table, id: generateId('tbl'), number: sanitizeString(table.number), capacity: sanitizeNumber(table.capacity) }]);
    return true;
  };
  
  const addBulkTables = (newTables: Table[]) => {
    const existingNumbers = new Set(allTables.filter(t => t.eventId === currentEvent.id).map(t => t.number.toLowerCase()));
    const uniqueTables = newTables
        .filter(t => !existingNumbers.has(t.number.toLowerCase()))
        .map(t => ({...t, id: generateId('tbl')})); // Her biri için yeni ID
    
    if (uniqueTables.length > 0) setAllTables(prev => [...prev, ...uniqueTables]);
    return uniqueTables.length;
  };
  
  const updateTable = (table: Table) => {
    if (checkTableNumberExists(table.number, table.id)) return false;
    setAllTables(prev => prev.map(t => t.id === table.id ? { ...table, number: sanitizeString(table.number) } : t));
    return true;
  };
  
  const deleteTable = (tableId: string) => setAllTables(prev => prev.filter(t => t.id !== tableId));
  const deleteAllTables = () => setAllTables(prev => prev.filter(t => t.eventId !== currentEvent.id));

  const addSale = (sale: Sale) => {
    const cleanSale = {
        ...sale,
        id: generateId('sale'),
        customerName: sanitizeString(sale.customerName),
        customerPhone: sanitizeString(sale.customerPhone),
        salesNote: sanitizeString(sale.salesNote || ''),
        finalAmount: sanitizeNumber(sale.finalAmount),
        paidAmount: sanitizeNumber(sale.paidAmount),
        remainingDebt: sanitizeNumber(sale.remainingDebt)
    };
    const historyEntry = {
        id: generateId('h'),
        date: new Date().toISOString(),
        staffId: user?.id || 'sys',
        staffName: user?.name || 'Sistem',
        action: 'SATIŞ',
        details: `${cleanSale.paidAmount} TL tahsilat ile bilet kesildi.`
    };
    setAllSales(prev => [...prev, { ...cleanSale, history: [historyEntry] }]);
    setAllTables(prev => prev.map(t => t.id === sale.tableId ? { ...t, status: 'sold' } : t));

    const table = allTables.find(t => t.id === sale.tableId);
    createNotification(
        'Yeni Bilet Satışı',
        `${cleanSale.customerName} için Masa ${table?.number} satışı yapıldı. (₺${cleanSale.finalAmount})`,
        'sale',
        cleanSale.id
    );
  };
  
  const cancelSale = (saleId: string) => {
    const sale = allSales.find(s => s.id === saleId);
    if (sale) {
      setAllTables(prev => prev.map(t => t.id === sale.tableId ? { ...t, status: 'available' } : t));
      setAllSales(prev => prev.filter(s => s.id !== saleId));
      createNotification('Bilet İptali', `${sale.customerName} bilet satışı iptal edildi.`, 'alert');
    }
  };

  const updateSaleAndTable = (saleId: string, targetTableId: string | null, _newCapacity: number | null) => {
    setAllSales(prev => prev.map(s => {
      if (s.id !== saleId) return s;
      const oldTableId = s.tableId;
      
      if (targetTableId && oldTableId !== targetTableId) {
          const oldTable = allTables.find(t => t.id === oldTableId);
          const newTable = allTables.find(t => t.id === targetTableId);
          createNotification('Masa Değişikliği', `${s.customerName} masası değiştirildi: ${oldTable?.number} -> ${newTable?.number}`, 'info', s.id);

          setAllTables(tPrev => tPrev.map(t => {
            if (t.id === oldTableId) return { ...t, status: 'available' as const };
            if (t.id === targetTableId) return { ...t, status: 'sold' as const };
            return t;
          }));
      }

      return {
        ...s,
        tableId: targetTableId || s.tableId,
        history: [...(s.history || []), {
          id: generateId('h'),
          date: new Date().toISOString(),
          staffId: user?.id || 'sys',
          staffName: user?.name || 'Sistem',
          action: 'DÜZENLEME',
          details: targetTableId ? `Masa değiştirildi.` : `Satış güncellendi.`
        }]
      };
    }));
  };

  const checkTicket = (qrCode: string) => {
    const sale = allSales.find(s => s.qrCode === qrCode);
    if (!sale) return { valid: false, message: 'Geçersiz QR Kod.', code: 'INVALID' as const };
    const event = allEvents.find(e => e.id === sale.eventId);
    if (event && event.organizationId !== user?.organizationId && user?.role !== 'super_admin') {
         return { valid: false, message: 'Farklı Firma Bileti!', code: 'WRONG_EVENT' as const };
    }
    if (sale.eventId !== currentEvent.id) return { valid: false, message: 'Başka Etkinlik!', code: 'WRONG_EVENT' as const, sale };
    const table = allTables.find(t => t.id === sale.tableId);
    if (sale.peopleEntered >= (table?.capacity || 0)) return { valid: false, message: `Kapasite Doldu!`, code: 'FULL' as const, sale, table };
    return { valid: true, message: 'Geçerli Bilet', code: 'SUCCESS' as const, sale, table };
  };

  const approveEntry = (saleId: string, count: number, note?: string, authorizer?: User) => {
    setAllSales(prev => prev.map(s => {
        if (s.id !== saleId) return s;
        const historyEntry = {
            id: generateId('h'),
            date: new Date().toISOString(),
            staffId: authorizer?.id || user?.id || 'sys',
            staffName: authorizer?.name || user?.name || 'Sistem',
            action: 'GİRİŞ ONAYI',
            details: `${count} kişi giriş yaptı. Not: ${sanitizeString(note || 'Yok')}`
        };

        if (authorizer || s.remainingDebt > 0) {
            createNotification('Riskli Giriş / Yetkili Onayı', `${s.customerName} için borçlu/manuel giriş yapıldı. Onaylayan: ${authorizer?.name || 'Sistem'}`, 'alert', s.id);
        }

        return { 
            ...s, 
            ticketUsed: true, 
            peopleEntered: (s.peopleEntered || 0) + count,
            entryTime: new Date().toISOString(),
            entryNote: sanitizeString(note || ''),
            history: [...(s.history || []), historyEntry]
        };
    }));
  };

  const collectDebtAndApprove = (saleId: string, count: number, authorizer?: User) => {
    setAllSales(prev => prev.map(s => {
        if (s.id !== saleId) return s;
        const historyEntry = {
            id: generateId('h'),
            date: new Date().toISOString(),
            staffId: authorizer?.id || user?.id || 'sys',
            staffName: authorizer?.name || user?.name || 'Sistem',
            action: 'BORÇ TAHSİLAT & GİRİŞ',
            details: `₺${s.remainingDebt} tahsil edildi ve ${count} kişi girişi onaylandı.`
        };

        if (s.remainingDebt > 0) {
            createNotification('Tahsilat Yapıldı', `${s.customerName} borcu (₺${s.remainingDebt}) kapıda tahsil edildi.`, 'success', s.id);
        }

        return {
            ...s,
            paidAmount: s.finalAmount || s.totalAmount,
            remainingDebt: 0,
            paymentStatus: 'full',
            ticketUsed: true,
            peopleEntered: (s.peopleEntered || 0) + count,
            entryTime: new Date().toISOString(),
            history: [...(s.history || []), historyEntry]
        };
    }));
  };

  const values: any = {
    user, organizations, addOrganization, updateOrganization, deleteOrganization,
    saasExpenses, addSaaSExpense, deleteSaaSExpense,
    saasTransactions, addSaaSTransaction, deleteSaaSTransaction, getOrganizationBalance,
    announcements, addAnnouncement, deleteAnnouncement,
    licenseDaysLeft, isLicenseExpired,
    users: visibleUsers, isAuthenticated: !!user, login, logout, addUser, deleteUser,
    events: visibleEvents, currentEvent, setCurrentEvent, addEvent, updateEvent, deleteEvent,
    addCategory, updateCategory, deleteCategory,
    tables: visibleTables,
    addTable, addBulkTables, updateTable, deleteTable, deleteAllTables, checkTableNumberExists,
    sales: visibleSales,
    addSale, cancelSale, updateSaleAndTable,
    checkTicket, approveEntry, collectDebtAndApprove,
    notifications, markNotificationRead, clearAllNotifications,
    isMobileMenuOpen, toggleMobileMenu, closeMobileMenu
  };

  return <AppContext.Provider value={values}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
