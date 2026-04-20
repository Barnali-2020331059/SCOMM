import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AdminOrders from './pages/AdminOrders';
import AdminAddProduct from './pages/AdminAddProduct';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import VerifyEmail from './pages/VerifyEmail';
import VerifyPending from './pages/VerifyPending';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                <Route path="verify-pending" element={<VerifyPending />} />
                <Route path="chat" element={<Chat />} />
                <Route
                    path="profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="checkout"
                    element={
                        <ProtectedRoute>
                            <Checkout />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="orders"
                    element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="orders/:id"
                    element={
                        <ProtectedRoute>
                            <OrderDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="admin/orders"
                    element={
                        <ProtectedRoute admin>
                            <AdminOrders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="admin/products/new"
                    element={
                        <ProtectedRoute admin>
                            <AdminAddProduct />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </Routes>
    );
}
