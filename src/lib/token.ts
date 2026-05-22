export const saveToken = (token: string) => {
    localStorage.setItem('authToken', token);
};

export const getToken = () => {
    return localStorage.getItem('authToken');
};

export const removeToken = () => {
    localStorage.removeItem('authToken');
};

/**
 * Decodes the `orgId` claim from the JWT payload (the backend stores it as a
 * string claim). Returns null if there's no token or it can't be parsed.
 * Used to subscribe to the per-org generation topic.
 */
export const getOrgIdFromToken = (): string | null => {
    const token = getToken();
    if (!token) return null;
    try {
        const part = token.split('.')[1];
        if (!part) return null;
        const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(json) as { orgId?: string | number };
        return payload.orgId != null ? String(payload.orgId) : null;
    } catch {
        return null;
    }
};
