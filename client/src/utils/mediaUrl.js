const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

export function toMediaUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;

    const apiBase = trimTrailingSlash(import.meta.env.VITE_DEV_API_ORIGIN || '');
    if (path.startsWith('/images') && apiBase) {
        return `${apiBase}${path}`;
    }
    return path;
}
