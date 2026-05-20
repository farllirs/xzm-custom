const KNOWN_API_BASES = [
    "https://young-mouse-26.loca.lt/api",
    "https://xzm-api-store.loca.lt/api"
];

const headers = {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true"
};

export function normalizeApiBase(value) {
    if (!value) return KNOWN_API_BASES[0];
    let normalized = value.trim();
    normalized = normalized.replace(/\/+$/, '');
    if (!normalized.endsWith('/api')) {
        normalized += '/api';
    }
    return normalized;
}

export function getSavedApiBase() {
    return window.API_BASE || localStorage.getItem("xzm_api_base");
}

export async function resolveApiBase() {
    const saved = getSavedApiBase();
    if (saved) return saved;

    for (const candidate of KNOWN_API_BASES) {
        try {
            const response = await fetch(`${candidate}/shop`, { method: 'GET', headers });
            if (response.ok) {
                localStorage.setItem("xzm_api_base", candidate);
                return candidate;
            }
        } catch (error) {
            // Intentaremos con la siguiente URL
        }
    }

    return KNOWN_API_BASES[0];
}

export function getApiBase() {
    return getSavedApiBase() || KNOWN_API_BASES[0];
}

export function setApiBase(value) {
    localStorage.setItem("xzm_api_base", normalizeApiBase(value));
}

export async function getUserProfile(userId) {
    const API_BASE = await resolveApiBase();
    try {
        const response = await fetch(`${API_BASE}/user/${userId}`, { headers });
        const contentType = response.headers.get("content-type");
        
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La API no devolvió JSON. Verifica la URL o el túnel activo.");
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error al obtener el perfil");
        }
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

export async function purchaseItem(userId, itemId, category) {
    const API_BASE = await resolveApiBase();
    try {
        const response = await fetch(`${API_BASE}/purchase`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ userId, itemId, category })
        });
        return await response.json();
    } catch (error) {
        console.error("Purchase Error:", error);
        throw error;
    }
}

export async function updateUserProfile(userId, changes) {
    const API_BASE = await resolveApiBase();
    try {
        const response = await fetch(`${API_BASE}/user/${userId}/update`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(changes)
        });
        return await response.json();
    } catch (error) {
        console.error("Update Profile Error:", error);
        throw error;
    }
}

export async function getShopItems() {
    const API_BASE = await resolveApiBase();
    try {
        const response = await fetch(`${API_BASE}/shop`, { headers });
        return await response.json();
    } catch (error) {
        console.error("Shop Error:", error);
        throw error;
    }
}

export async function equipItem(userId, category, itemId) {
    const API_BASE = await resolveApiBase();
    try {
        const response = await fetch(`${API_BASE}/user/${userId}/equip`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ category, itemId })
        });
        return await response.json();
    } catch (error) {
        console.error("Equip Error:", error);
        throw error;
    }
}

export async function getPanelUrl(userId) {
    const API_BASE = await resolveApiBase();
    return `${API_BASE}/user/${userId}/panel`;
}

export async function generateTempPanel(userId) {
    const API_BASE = await resolveApiBase();
    try {
        const response = await fetch(`${API_BASE}/user/${userId}/panel-temp`, {
            method: 'POST',
            headers: headers
        });
        if (!response.ok) throw new Error("No se pudo generar la previa");
        const data = await response.json();
        return data; // { sessionId, expiresIn }
    } catch (error) {
        console.error("Temp Panel Error:", error);
        throw error;
    }
}

export function getTempImageUrl(sessionId) {
    return `${getApiBase()}/temp-image/${sessionId}`;
}
