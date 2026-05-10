// ═══════════════════════════════════════════
// DineSmart — Staff API Client
// ═══════════════════════════════════════════

const API_URL = (import.meta as any).env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api/v1`;

// Module-level guards to prevent parallel refresh/redirect storms
let refreshPromise: Promise<Response> | null = null;
let isRedirecting = false;

// Extend the standard fetch RequestInit with our internal retry flag
interface FetchOptions extends RequestInit {
  _retry?: boolean;
}

async function fetchApi<T>(url: string, options?: FetchOptions): Promise<T> {
  // Reset redirect lock for every fresh (non-retry) request so login page works after a redirect
  if (!options?._retry) isRedirecting = false;

  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`API returned ${res.status} with empty body`);
    return {} as T;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse response: ${text.substring(0, 100)}...`);
  }

  // Skip refresh/redirect logic for auth endpoints — a 401 from /auth/login
  // means wrong credentials, NOT an expired session.
  const isAuthEndpoint = url.startsWith('/auth/');

  if (res.status === 401 && !options?._retry && !isAuthEndpoint) {
    // Singleton refresh: if a refresh is already in flight, all 401s share it
    if (!refreshPromise) {
      refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      }).finally(() => {
        refreshPromise = null; // reset after resolved/rejected
      });
    }

    try {
      const refreshRes = await refreshPromise;
      if (refreshRes.ok) {
        return fetchApi(url, { ...options, _retry: true });
      }
    } catch {}

    // Only redirect once — guard against multiple concurrent redirects
    if (!isRedirecting && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      isRedirecting = true;
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
  }

  if (!data.success) {
    const error = new Error(data.error || 'API request failed') as any;
    error.details = data.details;
    throw error;
  }
  return data.data as T;
}

// Auth
export const login = (email: string, password: string) =>
  fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const logout = () => fetchApi('/auth/logout', { method: 'POST' });
export const getMe = () => fetchApi('/auth/me');
export const refreshToken = () => fetchApi('/auth/refresh', { method: 'POST' });

// Restaurant
export interface ProfileUpdateData {
  name?: string;
  logoUrl?: string | null;
  bannerText?: string | null;
  bannerImageUrl?: string | null;
  notificationSoundUrl?: string | null;
}
export const getProfile = () => fetchApi('/restaurant/profile');
export const updateProfile = (data: ProfileUpdateData) => 
  fetchApi('/restaurant/profile', { method: 'PUT', body: JSON.stringify(data) });
export const getBranches = () => fetchApi('/restaurant/branches');
export const getTables = (branchId?: string) => fetchApi(`/restaurant/tables${branchId ? `?branchId=${branchId}` : ''}`);
export const getUsers = () => fetchApi('/restaurant/users');
export const updateUser = (id: string, data: { name?: string; email?: string; role?: string; isActive?: boolean; photoUrl?: string }) =>
  fetchApi(`/restaurant/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const getSubscriptionPayments = () => fetchApi('/restaurant/subscription/payments');

// Menu
export const getCategories = () => fetchApi('/menu/categories');
export const createCategory = (data: { name: string; description?: string }) => fetchApi('/menu/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id: string, data: { name?: string; description?: string }) => fetchApi(`/menu/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id: string) => fetchApi(`/menu/categories/${id}`, { method: 'DELETE' });

export const getMenuItems = () => fetchApi('/menu/items');
export const createMenuItem = (data: any) => fetchApi('/menu/items', { method: 'POST', body: JSON.stringify(data) });
export const updateMenuItem = (id: string, data: any) => fetchApi(`/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMenuItem = (id: string) => fetchApi(`/menu/items/${id}`, { method: 'DELETE' });
export const toggleAvailability = (id: string) => fetchApi(`/menu/items/${id}/toggle-availability`, { method: 'POST' });

export const uploadMenuImage = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE}/menu/upload-image`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  }).then(async res => {
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.data;
  });
};

export const getAddons = () => fetchApi('/menu/addons');
export const createAddon = (data: any) => fetchApi('/menu/addons', { method: 'POST', body: JSON.stringify(data) });
export const updateAddon = (id: string, data: any) => fetchApi(`/menu/addons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAddon = (id: string) => fetchApi(`/menu/addons/${id}`, { method: 'DELETE' });

// Billing
export const createOrder = (data: any) => fetchApi('/billing/orders', { method: 'POST', body: JSON.stringify(data) });
export const getBillingTables = () => fetchApi('/billing/tables');
export const getBillingOrders = (params?: string) => fetchApi(`/billing/orders${params ? `?${params}` : ''}`);
export const getOrderDetail = (id: string) => fetchApi(`/billing/orders/${id}`);
export const updateOrderStatus = (id: string, status: string) =>
  fetchApi(`/billing/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const updatePaymentStatus = (id: string, paymentStatus: string, paymentMethod?: string) =>
  fetchApi(`/billing/orders/${id}/payment`, { method: 'PUT', body: JSON.stringify({ paymentStatus, paymentMethod }) });
export const addItemToOrder = (orderId: string, data: { menuItemId: string; variantId?: string; addonIds?: string[]; quantity: number; specialInstructions?: string }) =>
  fetchApi(`/billing/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify(data) });
export const updateOrderItem = (orderId: string, itemId: string, data: { quantity?: number; specialInstructions?: string }) =>
  fetchApi(`/billing/orders/${orderId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) });
export const printBill = (id: string) => fetch(`${API_BASE}/billing/orders/${id}/print-bill`, { method: 'POST', credentials: 'include' });
export const printCustomerSummary = (customerId: string) => 
  fetch(`${API_BASE}/billing/customer-summary-bill`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
    credentials: 'include' 
  });
export const printTableSummary = (tableId: string) => fetch(`${API_BASE}/billing/table/${tableId}/summary-bill`, { method: 'POST', credentials: 'include' });
export const printKitchenTicket = (orderId: string) => fetch(`${API_BASE}/billing/orders/${orderId}/print-kitchen`, { method: 'POST', credentials: 'include' });

// Kitchen
export const getKitchenOrders = (branchId?: string) => fetchApi(`/kitchen/orders${branchId ? `?branchId=${branchId}` : ''}`);
export const updateItemStatus = (itemId: string, status: string) =>
  fetchApi(`/kitchen/order-items/${itemId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

// Analytics
export const getOverview = () => fetchApi('/analytics/overview');
export const getRevenue = (params?: string) => fetchApi(`/analytics/revenue${params ? `?${params}` : ''}`);
export const getMenuPerformance = () => fetchApi('/analytics/menu-performance');
export const getPeakHours = () => fetchApi('/analytics/peak-hours');
export const getTablePerformance = () => fetchApi('/analytics/table-performance');
export const getCustomerAnalytics = () => fetchApi('/analytics/customers');
export const getDemandForecast = (hours?: number) => fetchApi(`/ai/demand-forecast${hours ? `?hours=${hours}` : ''}`);
export const getPricingSuggestions = () => fetchApi('/ai/pricing-suggestions');

// Inventory
export const getInventoryItems = () => fetchApi('/inventory/items');
export const createInventoryItem = (data: any) => fetchApi('/inventory/items', { method: 'POST', body: JSON.stringify(data) });
export const getInventoryAlerts = () => fetchApi('/inventory/alerts');
export const updateStock = (id: string, quantity: number, reason: string) =>
  fetchApi(`/inventory/items/${id}/stock`, { method: 'PUT', body: JSON.stringify({ quantity, reason }) });
export const deleteInventoryItem = (id: string) => fetchApi(`/inventory/items/${id}`, { method: 'DELETE' });
export const getInventoryCategories = () => fetchApi('/inventory/categories');
export const createInventoryCategory = (data: { name: string }) => fetchApi('/inventory/categories', { method: 'POST', body: JSON.stringify(data) });
export const deleteInventoryCategory = (id: string) => fetchApi(`/inventory/categories/${id}`, { method: 'DELETE' });

// Coupons
export const getCoupons = () => fetchApi('/coupons');
export const createCoupon = (data: any) => fetchApi('/coupons', { method: 'POST', body: JSON.stringify(data) });
export const deleteCoupon = (id: string) => fetchApi(`/coupons/${id}`, { method: 'DELETE' });
export const toggleCoupon = (id: string) => fetchApi(`/coupons/${id}/toggle`, { method: 'POST' });

// Notifications
export const getNotifications = (page?: number) => fetchApi(`/notifications?page=${page || 1}`);
export const markNotificationRead = (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'PUT' });

// Loyalty
export const getLoyaltyAccounts = () => fetchApi('/loyalty');

export const getReviews = () => fetchApi('/restaurant/reviews');

// Team management (delete/update are already defined above)
export const deleteUser = (id: string) => fetchApi(`/restaurant/users/${id}`, { method: 'DELETE' });

// Order history
export const clearOrderHistory = () => fetchApi('/restaurant/orders/history', { method: 'DELETE' });
