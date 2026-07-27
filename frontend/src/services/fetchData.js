const API_BASE_URL = "/api";

export async function fetchData(endpoint, method = 'GET', body = null, isRetry = false) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        let response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (response.status === 429) return { success: false, message: "limit tercapai, coba lagi nanti" };
        if (response.status === 500) return { success: false, message: "server error, harap hubungi admin" };

        let responseData = await response.json();

        if (response.status === 401 && !isRetry) {
            if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
                return responseData; 
            }
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' });
            if (refreshRes.ok) {
                return await fetchData(endpoint, method, body, true);
            } else {
                return { success: false, message: responseData.message || "Session expired", forceLogout: true };
            }
        }

        if (response.status === 403) return responseData;

        return responseData;
    } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        return { success: false, message: "Network Error" };
    }
}