// Authentication Service Abstraction
// Handles Patient (Phone + OTP) and Pharmacy (Account + PIN/Password) auth states

const AUTH_STORAGE_KEY = 'pharmagarde_auth_session';

export const DEMO_PATIENT = {
  id: 'user_pat_001',
  name: 'Moussa Ndiaye',
  phone: '+221 77 654 32 10',
  role: 'patient',
  zone: 'Keur Massar'
};

export const DEMO_PHARMACIES_ACCOUNTS = [
  {
    pharmacyId: 'pharmacy_test',
    name: 'Dr. Admin Test',
    pharmacyName: 'Pharmacie Test',
    email: 'admin@pharmagarde.sn',
    phone: '+221 77 000 00 00',
    role: 'pharmacist'
  },
  {
    pharmacyId: 'pharmacy_005',
    name: 'Dr. Ibrahima Ndiaye',
    pharmacyName: 'Pharmacie Aïnoumadi',
    email: 'ainoumadi@pharmagarde.sn',
    phone: '+221 33 878 30 30',
    role: 'pharmacist'
  },
  {
    pharmacyId: 'pharmacy_001',
    name: 'Dr. Ousmane Diop',
    pharmacyName: 'Pharmacie Keur Massar',
    email: 'keurmassar@pharmagarde.sn',
    phone: '+221 77 123 45 67',
    role: 'pharmacist'
  },
  {
    pharmacyId: 'pharmacy_002',
    name: 'Dr. Aïssatou Sow',
    pharmacyName: 'Pharmacie Al Amin Keur Massar',
    email: 'alamin@pharmagarde.sn',
    phone: '+221 77 234 56 78',
    role: 'pharmacist'
  },
  {
    pharmacyId: 'pharmacy_003',
    name: 'Dr. Cheikh Tidiane Sy',
    pharmacyName: 'Pharmacie Diaraf Keur Massar',
    email: 'diaraf@pharmagarde.sn',
    phone: '+221 77 345 67 89',
    role: 'pharmacist'
  }
];

class AuthService {
  constructor() {
    this.listeners = new Set();
    this.session = this.loadSession() || {
      role: 'patient',
      user: null, // Personne pas encore connectée
      activePharmacyId: 'pharmacy_005'
    };
    if (this.session && (!this.session.activePharmacyId || this.session.activePharmacyId === 'pharmacy_maya')) {
      this.session.activePharmacyId = 'pharmacy_005';
      this.saveSession();
    }
  }

  loadSession() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveSession() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.session));
      }
    } catch {}
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    if (this.listeners) {
      this.listeners.forEach((cb) => cb(this.session));
    }
  }

  getSession() {
    return this.session;
  }

  setRole(role) {
    this.session.role = role;
    this.saveSession();
  }

  setActivePharmacy(pharmacyId) {
    const acc = DEMO_PHARMACIES_ACCOUNTS.find((p) => p.pharmacyId === pharmacyId);
    this.session.activePharmacyId = pharmacyId;
    if (acc) {
      this.session.user = acc;
    }
    this.saveSession();
  }

  // Patient OTP Auth Simulator
  async sendOtp(phoneNumber) {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: `Code envoyé au ${phoneNumber}` };
  }

  loginWithEmail({ email, password }) {
    const cleanIdent = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Accès rapide démo pour test pharmacie avec deux téléphones
    if (
      (cleanIdent === 'admin' ||
        cleanIdent === 'admin@pharmagarde.sn' ||
        cleanIdent === 'admin@gmail.com') &&
      cleanPass === 'admin'
    ) {
      const demoAccount = DEMO_PHARMACIES_ACCOUNTS[0]; // Pharmacie Aïnoumadi
      this.session.user = {
        ...demoAccount,
        id: 'user_admin_demo',
        role: 'pharmacist',
        isAdminDemo: true
      };
      this.session.role = 'pharmacist';
      this.session.activePharmacyId = demoAccount.pharmacyId;
      this.saveSession();
      return { success: true, user: this.session.user, role: 'pharmacist' };
    }

    const extractedName = email ? email.split('@')[0] : 'Patient';
    const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
    this.session.user = {
      id: `user_email_${Date.now()}`,
      name: formattedName,
      email: email,
      phone: '+221 77 000 00 00',
      commune: 'Keur Massar',
      role: 'patient',
      authProvider: 'email',
      createdAt: new Date().toISOString()
    };
    this.session.role = 'patient';
    this.saveSession();
    return { success: true, user: this.session.user, role: 'patient' };
  }

  loginWithGoogle() {
    this.session.user = {
      id: `user_google_${Date.now()}`,
      name: 'Utilisateur Google',
      email: 'user@gmail.com',
      role: 'patient',
      authProvider: 'google',
      commune: 'Dakar',
      createdAt: new Date().toISOString()
    };
    this.session.role = 'patient';
    this.saveSession();
    return { success: true, user: this.session.user };
  }

  loginWithApple() {
    this.session.user = {
      id: `user_apple_${Date.now()}`,
      name: 'Utilisateur Apple',
      email: 'user@privaterelay.appleid.com',
      role: 'patient',
      authProvider: 'apple',
      commune: 'Dakar',
      createdAt: new Date().toISOString()
    };
    this.session.role = 'patient';
    this.saveSession();
    return { success: true, user: this.session.user };
  }

  registerPatient({ fullName, phone, email, commune, password }) {
    this.session.user = {
      id: `user_pat_${Date.now()}`,
      name: fullName,
      phone: phone || '',
      email: email || '',
      commune: commune || 'Keur Massar',
      role: 'patient',
      authProvider: 'email',
      createdAt: new Date().toISOString()
    };
    this.session.role = 'patient';
    this.saveSession();
    return { success: true, user: this.session.user };
  }

  logoutPatient() {
    this.session.user = null;
    this.saveSession();
  }

  isPatientLoggedIn() {
    return !!(this.session && this.session.user && this.session.user.role === 'patient');
  }

  async verifyOtp(phoneNumber, code) {
    await new Promise((r) => setTimeout(r, 600));
    if (code === '1234' || code.length === 4) {
      this.session.user = {
        id: `user_${Date.now()}`,
        name: 'Patient PharmaGarde',
        phone: phoneNumber,
        role: 'patient',
        zone: 'Keur Massar'
      };
      this.session.role = 'patient';
      this.saveSession();
      return { success: true, user: this.session.user };
    }
    return { success: false, error: 'Code OTP invalide (utilisez 1234 pour la démo)' };
  }
}

export const authService = new AuthService();
