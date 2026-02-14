
export type Role = 'super_admin' | 'admin' | 'staff';

export type Permission = 
  | 'VIEW_DASHBOARD'    
  | 'MANAGE_EVENTS'     
  | 'VIEW_SALES'        
  | 'MAKE_SALES'        
  | 'VIEW_CUSTOMERS'    
  | 'SCAN_TICKETS'      
  | 'MANAGE_STAFF'
  | 'MANAGE_ORGANIZATIONS'; // Yeni yetki

export interface Organization {
  id: string;
  name: string;          // Görünen Ad (Örn: Reina Club)
  commercialTitle?: string; // Ticari Unvan (Örn: Reina Turizm A.Ş.)
  taxId?: string;        // VKN / TC
  taxOffice?: string;    // Vergi Dairesi
  address?: string;
  phone?: string;
  contactPerson?: string; // Yetkili Kişi
  contactEmail?: string;
  
  subscriptionStatus: 'active' | 'suspended' | 'expired';
  subscriptionEndDate?: string; // Lisans Bitiş Tarihi
  licensePrice?: number; // Liste Fiyatı
  discountType?: 'amount' | 'percentage'; // YENİ: İndirim Tipi
  discountValue?: number; // YENİ: İndirim Değeri
  maxUsers?: number;     // Kullanıcı Limiti
  
  isActive: boolean;
  createdAt: string;
}

// YENİ: Uygulama İçi Bildirim Yapısı
export interface AppNotification {
    id: string;
    organizationId: string;
    type: 'sale' | 'alert' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    relatedSaleId?: string;
}

// Müşteri Cari Hareketleri
export interface SaaSTransaction {
  id: string;
  organizationId: string;
  type: 'invoice' | 'payment' | 'refund'; // Invoice: Borçlandırma, Payment: Tahsilat, Refund: İade
  amount: number;
  description: string;
  date: string;
  processedBy: string; // İşlemi yapan admin
}

// İşletme Giderleri (Sunucu vb.)
export interface SaaSExpense {
  id: string;
  title: string;
  amount: number;
  category: 'server' | 'marketing' | 'staff' | 'other';
  date: string;
}

// Kampanya ve Duyurular
export interface Announcement {
  id: string;
  title: string;
  message: string;
  startDate: string; // ISO String
  endDate: string;   // ISO String
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string; // Hangi şirkete ait?
  username: string;
  password?: string;
  name: string;
  role: Role;
  permissions: Permission[];
}

export type EventStatus = 'active' | 'completed' | 'cancelled';

export interface Event {
  id: string;
  organizationId: string; // Hangi şirketin etkinliği?
  name: string;
  organizer?: string;
  logo?: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  status: EventStatus;
  categories: Category[];
}

export interface Category {
  id: string;
  eventId: string;
  name: string;
  pricePerPerson: number;
  color: string;
}

export type TableStatus = 'available' | 'sold' | 'reserved';

export interface Table {
  id: string;
  eventId: string;
  categoryId: string;
  number: string;
  capacity: number;
  totalPrice: number;
  status: TableStatus;
  positionX?: number; 
  positionY?: number; 
}

export type PaymentStatus = 'unpaid' | 'partial' | 'full';

export interface Sale {
  id: string;
  eventId: string;
  tableId: string;
  soldBy: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  originalAmount: number; 
  discountType?: 'amount' | 'percentage';
  discountValue?: number;
  finalAmount: number; 
  totalAmount: number; 
  
  paidAmount: number;
  remainingDebt: number;
  promisedPaymentDate?: string;
  salesNote?: string;
  paymentStatus: PaymentStatus;
  qrCode: string;
  
  ticketUsed: boolean;
  peopleEntered: number; 
  entryTime?: string;
  entryNote?: string; 
  createdAt: string;
  
  history: {
      id: string;
      date: string;
      staffId: string;
      staffName: string;
      action: string;
      details: string;
  }[];
}

export interface Stats {
  totalRevenue: number;
  totalCollected: number;
  totalDebt: number;
  ticketsSold: number;
  occupancyRate: number;
}
