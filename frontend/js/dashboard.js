window._dashCharts = {};

function _abreviar(str, max) {
    max = max || 20;
    return str.length > max ? str.slice(0, max) + '…' : str;
}

async function cargarDashboard() {
    const seccion = document.getElementById('dashboard');

    Object.values(window._dashCharts).forEach(c => c && c.destroy());
    window._dashCharts = {};

    seccion.innerHTML = `
        <style>
            .dash-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
            .dash-card { background:white; border-radius:12px; padding:20px 22px; border:1px solid #e8ecf0; }
            .dash-card h3 { font-size:14px; font-weight:600; color:#374151; margin:0 0 16px 0; }
            .dash-card.span2 { grid-column:1/-1; }
        </style>
        <div class="page-header">
            <h2>Dashboard</h2>
            <p>Visualización gráfica del estado del sistema deportivo</p>
        </div>
        <div class="dash-grid">
            <div class="dash-card span2">
                <h3>Inscriptos vs cupo máximo por actividad</h3>
                <div style="position:relative;height:310px">
                    <canvas id="d-chart-1"></canvas>
                </div>
            </div>
            <div class="dash-card">
                <h3>Porcentaje de asistencia por actividad</h3>
                <div style="position:relative;height:290px">
                    <canvas id="d-chart-2"></canvas>
                </div>
            </div>
            <div class="dash-card" style="display:flex;flex-direction:column">
                <h3>Ocupación promedio — actividades abiertas</h3>
                <div style="flex:1;display:flex;align-items:center;justify-content:center">
                    <canvas id="d-gauge" width="280" height="170"></canvas>
                </div>
            </div>
            <div class="dash-card span2">
                <h3>Asistencia por actividad y día de la semana</h3>
                <div id="d-heatmap" style="overflow-x:auto"></div>
            </div>
        </div>
    `;

    let r1, r2, r3, r4;
    try {
        const toJson = r => {
            if (!r.ok) throw new Error(`HTTP ${r.status} en ${r.url}`);
            return r.json();
        };
        [r1, r2, r3, r4] = await Promise.all([
            fetch(`${API}/dashboard/inscriptos-vs-cupo`).then(toJson),
            fetch(`${API}/dashboard/asistencia-por-actividad`).then(toJson),
            fetch(`${API}/dashboard/ocupacion-promedio`).then(toJson),
            fetch(`${API}/dashboard/heatmap-asistencia`).then(toJson)
        ]);
    } catch (err) {
        document.querySelector('.dash-grid').innerHTML = `
            <div style="grid-column:1/-1;padding:40px;text-align:center;
                        color:#991b1b;background:#fee2e2;border-radius:8px">
                <strong>Error al cargar el dashboard</strong><br>
                <span style="font-size:13px;color:#6b7280">${err.message}</span>
            </div>`;
        return;
    }

    // Gráfico 1: barras horizontales — inscriptos confirmados vs cupo máximo
    window._dashCharts.c1 = new Chart(document.getElementById('d-chart-1'), {
        type: 'bar',
        data: {
            labels: r1.map(d => _abreviar(d.actividad, 26)),
            datasets: [
                {
                    label: 'Inscriptos confirmados',
                    data: r1.map(d => d.confirmados),
                    backgroundColor: '#1a56c4',
                    borderRadius: 4
                },
                {
                    label: 'Cupo máximo',
                    data: r1.map(d => d.cupo_maximo),
                    backgroundColor: '#e8ecf0',
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                y: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    });

    // Gráfico 2: barras verticales — % asistencia (verde ≥75 %, naranja ≥50 %, rojo <50 %)
    window._dashCharts.c2 = new Chart(document.getElementById('d-chart-2'), {
        type: 'bar',
        data: {
            labels: r2.map(d => _abreviar(d.actividad, 16)),
            datasets: [{
                label: '% Asistencia',
                data: r2.map(d => parseFloat(d.porcentaje_asistencia)),
                backgroundColor: r2.map(d => {
                    const p = parseFloat(d.porcentaje_asistencia);
                    return p >= 75 ? '#166534' : p >= 50 ? '#f59e0b' : '#ef4444';
                }),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: '#f3f4f6' },
                    ticks: { callback: v => v + '%', font: { size: 11 } }
                },
                x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }
            }
        }
    });

    // Gauge: ocupación promedio en arco semicircular (Canvas 2D)
    const pctGauge = (r3 && r3.porcentaje != null) ? parseFloat(r3.porcentaje) : 0;
    _dibujarGauge('d-gauge', pctGauge);

    // Heatmap: tabla HTML con interpolación de color blanco → #1a3a6b
    const dias    = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diasHdr = ['Lun',   'Mar',    'Mié',       'Jue',    'Vie',     'Sáb'];

    document.getElementById('d-heatmap').innerHTML = `
        <table style="width:100%;border-collapse:separate;border-spacing:2px">
            <thead>
                <tr>
                    <th style="text-align:left;padding:6px 8px;font-size:12px;
                               color:#6b7280;font-weight:500;min-width:180px">Actividad</th>
                    ${diasHdr.map(d =>
                        `<th style="text-align:center;padding:6px 8px;font-size:12px;
                                    color:#6b7280;font-weight:500;min-width:58px">${d}</th>`
                    ).join('')}
                </tr>
            </thead>
            <tbody>
                ${r4.map(row => `
                    <tr>
                        <td style="padding:5px 8px;font-size:12px;color:#374151;
                                   white-space:nowrap">${_abreviar(row.actividad, 32)}</td>
                        ${dias.map(dia => {
                            const val = row[dia];
                            if (val === null || val === undefined) {
                                return '<td style="background:#f9fafb;border-radius:4px"></td>';
                            }
                            // Interpolar blanco (255,255,255) → #1a3a6b (26,58,107)
                            const rv  = Math.round(255 - 229 * val / 100);
                            const gv  = Math.round(255 - 197 * val / 100);
                            const bv  = Math.round(255 - 148 * val / 100);
                            const txt = val > 55 ? '#ffffff' : '#1e293b';
                            return `<td style="background:rgb(${rv},${gv},${bv});color:${txt};
                                               text-align:center;font-size:11px;font-weight:600;
                                               padding:8px 4px;border-radius:4px">${val}%</td>`;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function _dibujarGauge(canvasId, pct) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.width;
    const H   = canvas.height;
    const cx  = W / 2;
    const cy  = H * 0.74;
    const r   = Math.min(W * 0.40, H * 0.62);
    const lw  = r * 0.26;

    ctx.clearRect(0, 0, W, H);

    // Arco de fondo (semicírculo completo, gris)
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI, false);
    ctx.strokeStyle = '#e8ecf0';
    ctx.lineWidth   = lw;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Arco de valor (color según nivel de ocupación)
    if (pct > 0) {
        const color = pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#1a56c4';
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * pct / 100, false);
        ctx.strokeStyle = color;
        ctx.lineWidth   = lw;
        ctx.lineCap     = 'round';
        ctx.stroke();
    }

    // Texto central: porcentaje
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle    = '#0a2e6e';
    ctx.font         = `bold ${Math.round(r * 0.46)}px system-ui, sans-serif`;
    ctx.fillText(pct.toFixed(1) + '%', cx, cy - r * 0.08);

    // Subtítulo
    ctx.fillStyle = '#6b7280';
    ctx.font      = `${Math.round(r * 0.19)}px system-ui, sans-serif`;
    ctx.fillText('promedio actividades abiertas', cx, cy + r * 0.3);
}
