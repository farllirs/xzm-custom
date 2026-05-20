const API_BASE = "https://xzm-api-store.loca.lt/api";

const headers = {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true"
};

export async function getUserProfile(userId) {
    try {
        const response = await fetch(`${API_BASE}/user/${userId}`, { headers });
        const contentType = response.headers.get("content-type");
        
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La API no devolvió JSON. Verifica que el túnel esté activo.");
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
