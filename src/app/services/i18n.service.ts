import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'es';

const translations = {
  en: {
    dashboard: 'Dashboard',
    kanbanBoard: 'Kanban Board',
    kanbanSubtitle: 'Drag and drop applications to update their status.',
    newApplication: '+ New Application',
    welcome: 'Welcome back!',
    hello: 'Hello',
    subtitle: "Here's what's happening with your job search today.",
    totalApplications: 'Total Applications',
    interviews: 'Interviews',
    offers: 'Offers',
    rejected: 'Rejected',
    wishlist: 'Wishlist',
    statusBreakdown: 'Status Breakdown',
    areaBreakdown: 'Area Breakdown',
    salaryDistribution: 'Salary Distribution',
    edit: 'Edit',
    delete: 'Delete',
    import: 'Import',
    exportCsv: 'Export CSV',
    clearAll: 'Clear All',
    company: 'Company',
    position: 'Position',
    status: 'Status',
    areas: 'Areas',
    // Area translations
    areaFrontend: 'Frontend',
    areaBackend: 'Backend',
    areaFullStack: 'Full Stack',
    areaMobile: 'Mobile',
    areaDataScience: 'Data Science',
    areaDevOps: 'DevOps',
    areaCloud: 'Cloud',
    areaAIML: 'AI/ML',
    areaCybersecurity: 'Cybersecurity',
    areaQATesting: 'QA/Testing',
    areaUIUX: 'UI/UX',
    areaProductManagement: 'Product Management',
    areaITSupport: 'IT Support',
    areaDatabase: 'Database',
    areaAPIDevelopment: 'API Development',
    salary: 'Salary',
    dateApplied: 'Date Applied',
    notes: 'Notes',
    link: 'Link',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    update: 'Update',
    confirmDelete: "Are you sure you want to delete this application?",
    confirmClearAll: "Are you sure you want to delete ALL applications? This cannot be undone.",
    editApplication: 'Edit Application',
    newApplicationTitle: 'New Application',
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    required: 'is required',
    minLength: 'Must be at least {{min}} characters',
    maxLength: 'Must be no more than {{max}} characters',
    companyPlaceholder: 'e.g. Google',
    positionPlaceholder: 'e.g. Frontend Developer',
    salaryPlaceholder: 'e.g. $120k',
    linkPlaceholder: 'https://...',
    notesPlaceholder: 'Any additional notes...',
    noSalaryData: 'No salary data available.',
    noAreaData: 'No area data available.',
    addAreaHint: 'Add areas to your job applications to see the breakdown.',
    addSalaryHint: 'Add salaries to applications to see distribution.',
    invalidSalaryFormat: 'Invalid salary format. Use $120k or $120,000',
    invalidLinkFormat: 'Invalid URL format',
    basedOnSalaries: 'Based on {{n}} salary{{plural}}',
    toggleTheme: 'Toggle theme',
    changeLanguage: 'Change language',
    // Authentication
    loginTitle: 'Login',
    registerTitle: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Full Name',
    nameRequired: 'Name is required',
    nameInvalidCharacters: 'Name can only contain letters and spaces',
    nameTooManySpaces: 'Name can have up to 3 spaces maximum',
    nameOptional: 'Name (optional)',
    loginButton: 'Login',
    registerButton: 'Register',
    logout: 'Logout',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    switchToRegister: 'Create account',
    switchToLogin: 'Sign in',
    invalidCredentials: 'Invalid email or password',
    emailAlreadyExists: 'Email already exists',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    invalidEmail: 'Invalid email format',
    passwordMinLength: 'Password must be at least 6 characters',
    // Footer
    footer: 'Developed by Miguel Rodríguez - 2026 - v1.2.0 - All rights reserved',
  },
  es: {
    dashboard: 'Panel',
    kanbanBoard: 'Tablero Kanban',
    kanbanSubtitle: 'Arrastra y suelta postulaciones para actualizar su estado.',
    newApplication: '+ Nueva Postulación',
    welcome: '¡Bienvenido de nuevo!',
    hello: 'Hola',
    subtitle: 'Así va tu búsqueda de trabajo hoy.',
    totalApplications: 'Total Postuladas',
    interviews: 'Entrevistas',
    offers: 'Ofertas',
    rejected: 'Rechazadas',
    wishlist: 'Deseos',
    statusBreakdown: 'Distribución por Estado',
    areaBreakdown: 'Distribución por Área',
    salaryDistribution: 'Distribución de Salarios',
    edit: 'Editar',
    delete: 'Eliminar',
    import: 'Importar',
    exportCsv: 'Exportar CSV',
    clearAll: 'Borrar Todo',
    company: 'Empresa',
    position: 'Puesto',
    status: 'Estado',
    areas: 'Áreas',
    // Area translations
    areaFrontend: 'Frontend',
    areaBackend: 'Backend',
    areaFullStack: 'Full Stack',
    areaMobile: 'Móvil',
    areaDataScience: 'Ciencia de Datos',
    areaDevOps: 'DevOps',
    areaCloud: 'Nube',
    areaAIML: 'IA/ML',
    areaCybersecurity: 'Ciberseguridad',
    areaQATesting: 'QA/Testing',
    areaUIUX: 'UI/UX',
    areaProductManagement: 'Gestión de Producto',
    areaITSupport: 'Soporte IT',
    areaDatabase: 'Base de Datos',
    areaAPIDevelopment: 'Desarrollo de APIs',
    salary: 'Salario',
    dateApplied: 'Fecha Postulación',
    notes: 'Notas',
    link: 'Enlace',
    save: 'Guardar',
    cancel: 'Cancelar',
    create: 'Crear',
    update: 'Actualizar',
    confirmDelete: '¿Seguro que quieres eliminar esta postulación?',
    confirmClearAll: '¿Seguro que quieres eliminar TODAS las postulaciones? Esta acción no se puede deshacer.',
    editApplication: 'Editar Postulación',
    newApplicationTitle: 'Nueva Postulación',
    applied: 'Postulada',
    interview: 'Entrevista',
    offer: 'Oferta',
    required: 'es requerido',
    minLength: 'Debe tener al menos {{min}} caracteres',
    maxLength: 'No debe tener más de {{max}} caracteres',
    companyPlaceholder: 'ej. Google',
    positionPlaceholder: 'ej. Desarrollador Frontend',
    salaryPlaceholder: 'ej. $120k',
    linkPlaceholder: 'https://...',
    notesPlaceholder: 'Notas adicionales...',
    noSalaryData: 'No hay datos de salario disponibles.',
    noAreaData: 'No hay datos de área disponibles.',
    addAreaHint: 'Agrega áreas a tus postulaciones para ver la distribución.',
    addSalaryHint: 'Agrega salarios a las postulaciones para ver la distribución.',
    invalidSalaryFormat: 'Formato de salario inválido. Usa $120k o $120,000',
    invalidLinkFormat: 'Formato de URL inválido',
    basedOnSalaries: 'Basado en {{n}} salario{{plural}}',
    toggleTheme: 'Cambiar tema',
    changeLanguage: 'Cambiar idioma',
    // Authentication
    loginTitle: 'Iniciar sesión',
    registerTitle: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    name: 'Nombre completo',
    nameRequired: 'El nombre es requerido',
    nameInvalidCharacters: 'El nombre solo puede contener letras y espacios',
    nameTooManySpaces: 'El nombre puede tener hasta 3 espacios máximo',
    nameOptional: 'Nombre (opcional)',
    loginButton: 'Entrar',
    registerButton: 'Registrarse',
    logout: 'Cerrar sesión',
    noAccount: '¿No tienes cuenta?',
    hasAccount: '¿Ya tienes cuenta?',
    switchToRegister: 'Crear cuenta',
    switchToLogin: 'Iniciar sesión',
    invalidCredentials: 'Credenciales inválidas',
    emailAlreadyExists: 'El correo ya existe',
    emailRequired: 'El correo es requerido',
    passwordRequired: 'La contraseña es requerida',
    invalidEmail: 'Formato de correo inválido',
    passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
     // Footer
     footer: 'Desarrollado por Miguel Rodríguez - 2026 - v1.3.0 - Todos los derechos reservados',
  }
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLang = signal<Language>('es');
  private storageKey = 'jobquest_language';

  constructor() {
    const saved = localStorage.getItem(this.storageKey) as Language;
    if (saved && (saved === 'en' || saved === 'es')) {
      this.currentLang.set(saved);
    }
  }

  get currentLanguage(): Language {
    return this.currentLang();
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    localStorage.setItem(this.storageKey, lang);
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang() === 'en' ? 'es' : 'en');
  }

  translate(key: string): string {
    const dict = translations[this.currentLang()] as Record<string, string>;
    return dict[key] || key;
  }
}