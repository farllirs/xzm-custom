// URL del túnel generado por el bot (ej: https://xzm-api-store.loca.lt)
// Puedes cambiarla manualmente aquí si el túnel cambia.
const API_BASE = "https://xzm-api-store.loca.lt/api";

export async function getUserProfile(userId) {
    try {
        const response = await fetch(`${API_BASE}/user/${userId}`);
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

export async function purchaseItem(userId, itemId, price, type) {
    try {
        const response = await fetch(`${API_BASE}/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, itemId, price, type })
        });
        return await response.json();
    } catch (error) {
        console.error("Purchase Error:", error);
        throw error;
    }
}
