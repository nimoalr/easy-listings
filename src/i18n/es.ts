import type en from './en'

const es: Record<keyof typeof en, string> = {
  // Header
  appName: 'Easy Listings',

  // Home page
  myListings: 'Mis Anuncios',
  myListingsDescription: 'Crea y gestiona tus borradores de anuncios de eBay',
  newListing: 'Nuevo Anuncio',
  createNewListing: 'Crear Anuncio',
  itemName: 'Nombre del artículo',
  itemNamePlaceholder: 'ej. Walkman Sony Vintage',
  briefDescription: 'Descripción breve (opcional)',
  briefDescriptionPlaceholder: '¿Qué sabes sobre este artículo?',
  createDraft: 'Crear borrador',
  creating: 'Creando...',
  noListingsYet: 'Sin anuncios aún',
  noListingsHint: 'Crea tu primer anuncio para comenzar',
  imageCount_one: '{{count}} imagen',
  imageCount_other: '{{count}} imágenes',
  statusDraft: 'borrador',
  statusProcessed: 'procesado',

  // Detail page
  back: 'Volver',
  delete: 'Eliminar',
  deleting: 'Eliminando...',
  itemDetails: 'Detalles del artículo',
  itemNameInputPlaceholder: '¿Qué es este artículo?',
  yourDescription: 'Tu Descripción',
  yourDescriptionPlaceholder: '¿Qué sabes sobre este artículo? Estado, marca, modelo, etc.',
  saveDraft: 'Guardar',
  saving: 'Guardando...',
  analyzeWithAI: 'Analizar con IA',
  analyzing: 'Analizando...',
  aiAnalysis: 'Análisis IA',
  suggestedName: 'Nombre sugerido',
  generatedDescription: 'Descripción generada',
  images: 'Imágenes ({{count}})',
  uploading: 'Subiendo...',
  uploadHint: 'Arrastra imágenes aquí o haz clic para subir',

  // Toasts
  toastListingSaved: 'Anuncio guardado',
  toastSaveFailed: 'Error al guardar',
  toastUploadFirst: 'Por favor sube al menos una imagen primero',
  toastAIComplete: 'Análisis IA completado',
  toastAIFailed: 'Error en el análisis IA',
  toastAIApplied: 'Sugerencias IA aplicadas al anuncio',
  applyToListing: 'Aplicar al anuncio',
  hideAnalysis: 'Ocultar',
  toastImageRemoved: 'Imagen eliminada',
  toastImageUploaded_one: '{{count}} imagen subida',
  toastImageUploaded_other: '{{count}} imágenes subidas',
  toastUploadFailed: 'Error al subir las imágenes',
  toastListingDeleted: 'Anuncio eliminado',
  toastDeleteFailed: 'Error al eliminar',

  // Sidebar
  drafts: 'Borradores',
  publishedListings: 'Publicados',

  // Language switcher
  language: 'Idioma',
  languageEN: 'English',
  languageFR: 'Français',

  // Settings
  settings: 'Configuración',
  ebayAccounts: 'Cuentas de eBay',
  connectEbay: 'Conectar con eBay',
  connectNewAccount: 'Conectar nueva cuenta',
  disconnectEbay: 'Desconectar',
  marketplace: 'Mercado',
  sandboxMode: 'Modo Sandbox',
  sandboxBadge: 'Sandbox',
  noAccountsConnected: 'Sin cuentas de eBay conectadas',
  noAccountsHint: 'Conecta tu cuenta de eBay para publicar anuncios',
  toastEbayConnected: 'Cuenta de eBay conectada',
  toastEbayDisconnected: 'Cuenta de eBay desconectada',
  connecting: 'Conectando...',

  // eBay listing
  ebayListing: 'Anuncio de eBay',
  ebayAccount: 'Cuenta de eBay',
  selectAccount: 'Seleccionar cuenta',
  ebayCategory: 'Categoría',
  searchCategories: 'Buscar categorías...',
  ebayCondition: 'Estado',
  conditionDescription: 'Notas sobre el estado',
  conditionDescriptionPlaceholder: 'Describe el estado del artículo en detalle...',
  listingFormat: 'Formato de anuncio',
  fixedPrice: 'Precio fijo',
  auction: 'Subasta',
  price: 'Precio',
  bestOffer: 'Mejor oferta',
  bestOfferEnabled: 'Permitir ofertas',
  autoAcceptPrice: 'Aceptar automáticamente sobre',
  minAcceptPrice: 'Rechazar automáticamente bajo',
  startingPrice: 'Precio inicial',
  reservePrice: 'Precio de reserva (opcional)',
  auctionDuration: 'Duración',
  auctionDays_one: '{{count}} día',
  auctionDays_other: '{{count}} días',

  // Item specifics
  itemSpecifics: 'Características',
  addSpecific: 'Añadir',
  required: 'Obligatorio',
  aspectName: 'Nombre',
  aspectValue: 'Valor',

  // Business policies
  fulfillmentPolicy: 'Política de envío',
  returnPolicy: 'Política de devolución',
  paymentPolicy: 'Política de pago',
  noPoliciesFound: 'No se encontraron políticas. Créalas en eBay Seller Hub.',
  businessPolicies: 'Políticas comerciales',

  // Publish workflow
  publishStatus: 'Estado',
  notListed: 'No publicado',
  ebayDraft: 'Borrador en eBay',
  published: 'Publicado',
  publishFailed: 'Error al publicar',
  ended: 'Finalizado',
  createDraftOnEbay: 'Crear borrador en eBay',
  publishToEbay: 'Publicar en eBay',
  updateDraft: 'Actualizar borrador',
  viewOnEbay: 'Ver en eBay',
  publishing: 'Publicando...',
  retryPublish: 'Reintentar',
  toastDraftCreated: 'Borrador creado en eBay',
  toastDraftUpdated: 'Borrador actualizado en eBay',
  toastPublished: '¡Anuncio publicado en eBay!',
  toastPublishFailed: 'Error al publicar: {{error}}',

  // AI eBay analysis
  aiEbayAnalysis: 'Análisis IA eBay',
  suggestedCategory: 'Categoría sugerida',
  suggestedCondition: 'Estado sugerido',
  estimatedPrice: 'Precio estimado',
  formatRecommendation: 'Formato recomendado',
  applyEbayFields: 'Aplicar campos eBay',
  toastEbayFieldsApplied: 'Campos eBay aplicados desde el análisis IA',
}

export default es
