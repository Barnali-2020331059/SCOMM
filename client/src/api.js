import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export async function getCategories() {
    const { data } = await api.get('/products/categories');
    return data.payload.categories;
}

export async function getProducts(params) {
    const { data } = await api.get('/products', { params });
    return data.payload;
}

export async function getProduct(id) {
    const { data } = await api.get(`/products/${id}`);
    return data.payload.product;
}

export async function registerUser(body) {
    const { data } = await api.post('/users/register', body);
    return data.payload;
}

export async function verifyEmailToken(token) {
    const { data } = await api.post('/users/verify', { token });
    return data;
}

export async function loginUser(body) {
    const { data } = await api.post('/users/login', body);
    return data.payload;
}

export async function getMe() {
    const { data } = await api.get('/users/me');
    return data.payload.user;
}

export async function createOrder(body) {
    const { data } = await api.post('/orders', body);
    return data.payload.order;
}

export async function payOrder(id) {
    const { data } = await api.patch(`/orders/${id}/pay`);
    return data.payload.order;
}

export async function createStripeCheckoutSession(orderId) {
    const { data } = await api.post('/stripe/create-checkout-session', { orderId });
    return data.payload;
}

export async function getMyOrders() {
    const { data } = await api.get('/orders/mine');
    return data.payload.orders;
}

export async function getOrder(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data.payload.order;
}

export async function getAdminOrders() {
    const { data } = await api.get('/orders/admin/all');
    return data.payload.orders;
}

export async function updateOrderStatus(id, status) {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data.payload.order;
}


export async function updateMe(body) {
    const { data } = await api.put('/users/me', body);
    return data.payload.user;
}
 
export async function resendVerification(email) {
    const { data } = await api.post('/users/resend-verification', email ? { email } : {});
    return data;
}


export async function createProduct(body) {
    const { data } = await api.post('/products', body);
    return data.payload.product;
}

export async function chatProducts(message) {
    const { data } = await api.post('/chat/products', { message });
    return data.payload;
}

