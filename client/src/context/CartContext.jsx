import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'scomm_cart';

function cartReducer(state, action) {
    switch (action.type) {
        case 'HYDRATE':
            return action.payload;
        case 'ADD': {
            const existing = state.find((i) => i._id === action.item._id);
            if (existing) {
                const max = action.item.countInStock ?? 99;
                return state.map((i) =>
                    i._id === action.item._id
                        ? { ...i, qty: Math.min(i.qty + (action.qty || 1), max) }
                        : i,
                );
            }
            return [...state, { ...action.item, qty: action.qty || 1 }];
        }
        case 'SET_QTY': {
            const max = action.max ?? 99;
            const qty = Math.max(1, Math.min(action.qty, max));
            return state.map((i) => (i._id === action.id ? { ...i, qty } : i));
        }
        case 'REMOVE':
            return state.filter((i) => i._id !== action.id);
        case 'CLEAR':
            return [];
        default:
            return state;
    }
}

export function CartProvider({ children }) {
    const [items, dispatch] = useReducer(cartReducer, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addToCart = (product, qty = 1) => {
        dispatch({
            type: 'ADD',
            item: {
                _id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                countInStock: product.countInStock,
            },
            qty,
        });
    };

    const setQty = (id, qty, max) => dispatch({ type: 'SET_QTY', id, qty, max });
    const removeItem = (id) => dispatch({ type: 'REMOVE', id });
    const clearCart = () => dispatch({ type: 'CLEAR' });

    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

    const value = useMemo(
        () => ({
            items,
            count,
            subtotal,
            addToCart,
            setQty,
            removeItem,
            clearCart,
        }),
        [items, count, subtotal],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
