const canvas = document.getElementById('circuit-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;

    const config = {
        gridSize: 30,
        // Colors: Cyan Blue #00CFF9
        traceColor: 'rgba(0, 207, 249, 0.35)',
        chipColor: 'rgba(5, 20, 30, 0.6)',
        chipBorder: 'rgba(0, 207, 249, 0.4)',
        pinColor: 'rgba(0, 207, 249, 0.4)',
        pulseColors: ['#00CFF9', '#0099CC', '#006699'], // Shades of Cyan
        pulseSpeed: 2, // Slower for background feel
        pulseChance: 0.04, // Less busy
        glowRadius: 0 // Removed interactivity
    };

    let traces = [];
    let chips = [];
    let pulses = [];
    // Mouse removed

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        generatePCB();
    }

    window.addEventListener('resize', resize);

    // --- Hide/Show Logic ---
    // Removed to allow background on Home Section
    // canvas.style.opacity = '1';

    // --- Generation Logic ---

    function generatePCB() {
        traces = [];
        chips = [];
        pulses = [];

        const cols = Math.ceil(width / config.gridSize);
        const rows = Math.ceil(height / config.gridSize);
        const grid = new Array(cols * rows).fill(false);

        function markOccupied(c, r, w, h) {
            for (let i = c; i < c + w; i++) {
                for (let j = r; j < r + h; j++) {
                    if (i >= 0 && i < cols && j >= 0 && j < rows) {
                        grid[j * cols + i] = true;
                    }
                }
            }
        }

        function isOccupied(c, r) {
            if (c < 0 || c >= cols || r < 0 || r >= rows) return true;
            return grid[r * cols + c];
        }

        // 1. Place Chips
        const chipCount = Math.floor((width * height) / 60000);
        for (let i = 0; i < chipCount; i++) {
            const w = Math.floor(Math.random() * 2) + 2;
            const h = Math.floor(Math.random() * 2) + 2;
            const c = Math.floor(Math.random() * (cols - w - 2)) + 1;
            const r = Math.floor(Math.random() * (rows - h - 2)) + 1;

            let free = true;
            for (let xx = c - 1; xx < c + w + 1; xx++) {
                for (let yy = r - 1; yy < r + h + 1; yy++) {
                    if (isOccupied(xx, yy)) free = false;
                }
            }

            if (free) {
                chips.push({
                    x: c * config.gridSize,
                    y: r * config.gridSize,
                    w: w * config.gridSize,
                    h: h * config.gridSize
                });
                markOccupied(c - 1, r - 1, w + 2, h + 2);
            }
        }

        // 2. Generate Traces
        const traceAttempts = Math.floor(width * height / 1500); // More traces for density

        for (let i = 0; i < traceAttempts; i++) {
            let cx = Math.floor(Math.random() * cols);
            let cy = Math.floor(Math.random() * rows);

            if (isOccupied(cx, cy)) continue;

            let path = [{ x: cx, y: cy }];
            markOccupied(cx, cy, 1, 1);

            let dirX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.5 ? 1 : 0);
            let dirY = (Math.random() > 0.5 ? 1 : -1) * (Math.abs(dirX) === 1 ? 0 : 1);
            if (dirX === 0 && dirY === 0) dirX = 1;

            const length = Math.floor(Math.random() * 40) + 10;

            for (let step = 0; step < length; step++) {
                const head = path[path.length - 1];
                let nextX = head.x + dirX;
                let nextY = head.y + dirY;

                if (Math.random() < 0.2) {
                    const r = Math.random();
                    if (r < 0.4) { dirX = 1; dirY = 0; }
                    else if (r < 0.8) { dirX = 0; dirY = 1; }
                    else { dirX = (Math.random() > 0.5 ? 1 : -1); dirY = (Math.random() > 0.5 ? 1 : -1); }

                    nextX = head.x + dirX;
                    nextY = head.y + dirY;
                }

                if (!isOccupied(nextX, nextY)) {
                    path.push({ x: nextX, y: nextY });
                    markOccupied(nextX, nextY, 1, 1);
                } else {
                    break;
                }
            }

            if (path.length > 2) {
                const finalPath = path.map(p => ({
                    x: p.x * config.gridSize + config.gridSize / 2,
                    y: p.y * config.gridSize + config.gridSize / 2
                }));
                traces.push(finalPath);
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Chips & Pins
        ctx.lineWidth = 2;

        chips.forEach(chip => {
            ctx.fillStyle = config.chipColor;
            ctx.strokeStyle = config.chipBorder;

            ctx.fillRect(chip.x, chip.y, chip.w, chip.h);
            ctx.strokeRect(chip.x, chip.y, chip.w, chip.h);

            // Pins
            ctx.strokeStyle = config.pinColor;
            ctx.lineWidth = 1;
            const pinLen = 4; // Smaller pins
            const step = config.gridSize;

            ctx.beginPath();
            for (let px = chip.x + step / 2; px < chip.x + chip.w; px += step) {
                ctx.moveTo(px, chip.y);
                ctx.lineTo(px, chip.y - pinLen);
                ctx.moveTo(px, chip.y + chip.h);
                ctx.lineTo(px, chip.y + chip.h + pinLen);
            }
            for (let py = chip.y + step / 2; py < chip.y + chip.h; py += step) {
                ctx.moveTo(chip.x, py);
                ctx.lineTo(chip.x - pinLen, py);
                ctx.moveTo(chip.x + chip.w, py);
                ctx.lineTo(chip.x + chip.w + pinLen, py);
            }
            ctx.stroke();

            // Detail: Small capacitor/resistor rects on chip
            ctx.fillStyle = 'rgba(0, 50, 150, 0.2)';
            ctx.fillRect(chip.x + 10, chip.y + 10, 10, 10);
            ctx.fillRect(chip.x + chip.w - 20, chip.y + chip.h - 20, 10, 10);

            // Text
            ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
            ctx.font = '8px monospace';
            ctx.fillText('IC-' + Math.floor(chip.x / 10), chip.x + 4, chip.y + 10);
        });

        // 2. Draw Traces
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1; // Thinner traces

        ctx.strokeStyle = config.traceColor;
        ctx.beginPath();
        traces.forEach(trace => {
            if (trace.length < 2) return;
            ctx.moveTo(trace[0].x, trace[0].y);
            for (let i = 1; i < trace.length; i++) {
                ctx.lineTo(trace[i].x, trace[i].y);
            }
        });
        ctx.stroke();

        // Batch Vias
        ctx.fillStyle = config.traceColor;
        ctx.beginPath();
        traces.forEach(trace => {
            if (trace.length < 2) return;
            ctx.moveTo(trace[0].x + 1.5, trace[0].y);
            ctx.arc(trace[0].x, trace[0].y, 1.5, 0, Math.PI * 2);
            const end = trace[trace.length - 1];
            ctx.moveTo(end.x + 1.5, end.y);
            ctx.arc(end.x, end.y, 1.5, 0, Math.PI * 2);
        });
        ctx.fill();

        // 3. Draw Pulses
        if (Math.random() < config.pulseChance) {
            const traceIdx = Math.floor(Math.random() * traces.length);
            const trace = traces[traceIdx];
            if (trace && trace.length > 2) {
                let totalLen = 0;
                let segments = [];
                for (let i = 0; i < trace.length - 1; i++) {
                    const dx = trace[i + 1].x - trace[i].x;
                    const dy = trace[i + 1].y - trace[i].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    totalLen += d;
                    segments.push({ len: d, start: trace[i], end: trace[i + 1], dx, dy });
                }

                pulses.push({
                    segments: segments,
                    currentDist: 0,
                    totalDist: totalLen,
                    speed: config.pulseSpeed + Math.random(),
                    color: config.pulseColors[Math.floor(Math.random() * config.pulseColors.length)]
                });
            }
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.currentDist += p.speed;

            if (p.currentDist >= p.totalDist) {
                pulses.splice(i, 1);
                continue;
            }

            const drawPos = (distance) => {
                let d = 0;
                for (let seg of p.segments) {
                    if (distance >= d && distance <= d + seg.len) {
                        const t = (distance - d) / seg.len;
                        return { x: seg.start.x + seg.dx * t, y: seg.start.y + seg.dy * t };
                    }
                    d += seg.len;
                }
                return null;
            };

            const pos = drawPos(p.currentDist);
            if (pos) {
                // Head
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2); // Smaller pulse
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 5; // Reduced glow
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Tail (Trailing dots)
                const tailLength = 8;
                for (let t = 1; t <= tailLength; t++) {
                    const tailDist = p.currentDist - (t * 3);
                    if (tailDist > 0) {
                        const tailPos = drawPos(tailDist);
                        if (tailPos) {
                            ctx.beginPath();
                            ctx.arc(tailPos.x, tailPos.y, 1, 0, Math.PI * 2);
                            ctx.fillStyle = p.color;
                            ctx.globalAlpha = (1 - (t / tailLength)) * 0.5; // More transparent tail
                            ctx.fill();
                            ctx.globalAlpha = 1;
                        }
                    }
                }
            }
        }

        requestAnimationFrame(draw);
    }

    resize();
    requestAnimationFrame(draw);
}
