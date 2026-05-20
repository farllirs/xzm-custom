/**
 * XZM Canvas Engine - Renderizado local en el navegador
 * Este archivo replica la lógica del bot pero optimizada para el frontend.
 */

const WIDTH = 1000;
const HEIGHT = 500;

export async function renderLocalPreview(canvas, data) {
    const ctx = canvas.getContext('2d');
    const { customization, activeTheme, activeContour, avatar, username, globalName, level, xp } = data;
    
    // 1. Cargar fondo
    const bgUrl = customization.backgroundUrl && customization.backgroundUrl.startsWith('http') 
        ? customization.backgroundUrl 
        : `./assets/imagen/bienvenida.png`; // Fallback local
    
    const bg = await loadImage(bgUrl).catch(() => loadImage(`./assets/imagen/bienvenida.png`));
    
    // Dibujar fondo
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const scale = Math.max(WIDTH / bg.width, HEIGHT / bg.height);
    const sw = bg.width * scale;
    const sh = bg.height * scale;
    ctx.drawImage(bg, (WIDTH - sw) / 2, (HEIGHT - sh) / 2, sw, sh);
    
    // 2. Determinar Colores y Acento
    const accent = customization.accentColor === 'auto' ? '#007aff' : customization.accentColor;
    const secondary = 'rgba(0, 0, 0, 0.4)';

    // 3. Dibujar Panel según tema
    if (activeTheme === 'windows') {
        drawWindowsPanel(ctx, accent);
    } else {
        drawMacGlassPanel(ctx, accent);
    }

    // 4. Dibujar Avatar con Contorno
    await drawAvatar(ctx, avatar, activeContour);

    // 5. Dibujar Identidad
    drawIdentity(ctx, { username, globalName, id: data.id }, customization.description, accent);

    // 6. Dibujar Barra de Nivel
    drawLevelBar(ctx, level, xp, accent);
}

function drawMacGlassPanel(ctx, accent) {
    const x = 50, y = 40, w = 900, h = 420;
    
    ctx.save();
    // Borde exterior
    roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 32);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fondo panel
    roundRect(ctx, x, y, w, h, 30);
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.6)");
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Semáforo Mac
    const colors = ["#ff5f56", "#ffbd2e", "#27c93f"];
    colors.forEach((color, i) => {
        ctx.beginPath();
        ctx.arc(x + 30 + (i * 22), y + 25, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    });
    ctx.restore();
}

function drawWindowsPanel(ctx, accent) {
    const x = 50, y = 40, w = 900, h = 420;
    ctx.save();
    ctx.fillStyle = "rgba(10, 10, 10, 0.9)";
    ctx.fillRect(x, y, w, h);
    
    ctx.fillStyle = accent;
    ctx.fillRect(x, y, w, 35);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText("_", x + w - 60, y + 20);
    ctx.fillText("□", x + w - 40, y + 22);
    ctx.fillText("×", x + w - 20, y + 22);
    ctx.restore();
}

async function drawAvatar(ctx, avatarUrl, contourType) {
    const avatar = await loadImage(avatarUrl).catch(() => loadImage('./assets/icons/profile.png'));
    const x = 80, y = 110, size = 200;

    ctx.save();
    
    // Contornos
    if (contourType === "neon") {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00f2ff";
        roundRect(ctx, x - 5, y - 5, size + 10, size + 10, 45);
        ctx.strokeStyle = "#00f2ff";
        ctx.lineWidth = 6;
        ctx.stroke();
    } else if (contourType === "gold") {
        const grad = ctx.createLinearGradient(x, y, x + size, y + size);
        grad.addColorStop(0, "#ffd700");
        grad.addColorStop(1, "#b8860b");
        roundRect(ctx, x - 5, y - 5, size + 10, size + 10, 45);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    // Avatar
    roundRect(ctx, x, y, size, size, 40);
    ctx.clip();
    ctx.drawImage(avatar, x, y, size, size);
    ctx.restore();
}

function drawIdentity(ctx, user, description, accent) {
    const startX = 310;
    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = "40px Bungee";
    ctx.fillText(truncate(user.globalName || user.username, 18), startX, 140);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "22px ConcertOne";
    ctx.fillText(`@${user.username} • ID: ${user.id}`, startX, 175);

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    wrapText(ctx, description || "Sin descripción.", startX, 250, 550, 28);
    ctx.restore();
}

function drawLevelBar(ctx, level, xp, accent) {
    const x = 310, y = 380, w = 550, h = 20;
    
    // Fondo barra
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill();

    // Progreso (Simplificado para el web engine)
    const nextLevelXP = (level + 1) * 1000;
    const progress = Math.min(xp / nextLevelXP, 1);
    
    roundRect(ctx, x, y, w * progress, h, 10);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "18px ConcertOne";
    ctx.fillText(`Nivel ${level} • ${xp.toLocaleString()} XP`, x, y - 10);
}

// Helpers
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = 0;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
            lines++;
            if (lines > 3) return;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

function truncate(str, len) {
    return str.length > len ? str.substring(0, len - 3) + '...' : str;
}
