const API_BASE = "http://localhost:3000/api";

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

export async function purchaseItem(userId, itemId) {
    try {
        const response = await fetch(`${API_BASE}/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, itemId })
        });
        return await response.json();
    } catch (error) {
        console.error("Purchase Error:", error);
        throw error;
    }
}
