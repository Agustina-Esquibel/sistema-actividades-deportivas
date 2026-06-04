async function cargarAsistencias() {
    const seccion = document.getElementById('asistencias');

    const resActividades = await fetch(`${API}/actividades`);
    const actividades    = await resActividades.json();

    const optsActividades = actividades
        .map(a => `<option value="${a.id_actividad}">${a.nombre} (${a.dia} ${a.horario}) — ${a.estado}</option>`)
        .join('');

    const hoy = new Date().toISOString().split('T')[0];

    seccion.innerHTML = `
        <div class="page-header">
            <h2>Asistencias</h2>
            <p>Registro de asistencia de estudiantes por actividad y fecha</p>
        </div>

        <div class="form-card">
            <h3>Seleccione actividad y fecha</h3>
            <div class="form-grid" style="grid-template-columns:1fr 1fr auto;">
                <select id="asist-actividad">
                    <option value="">-- Seleccione una actividad --</option>
                    ${optsActividades}
                </select>
                <input id="asist-fecha" type="date" value="${hoy}" />
                <button class="btn btn-primary" onclick="verAsistencias()">
                    <i class="ti ti-search"></i> Ver
                </button>
            </div>
        </div>

        <div id="asist-contenido"></div>
    `;
}

async function verAsistencias() {
    const id_actividad = document.getElementById('asist-actividad').value;
    const fecha        = document.getElementById('asist-fecha').value;
    const contenedor   = document.getElementById('asist-contenido');

    if (!id_actividad || !fecha) {
        contenedor.innerHTML = `
            <div class="mensaje-error">❌ Seleccione una actividad y una fecha</div>`;
        return;
    }

    const res  = await fetch(`${API}/actividades/${id_actividad}/asistencias?fecha=${fecha}`);
    const data = await res.json();

    if (data.length === 0) {
        contenedor.innerHTML = `
            <div class="form-card" style="text-align:center;color:#9ca3af;padding:40px">
                <i class="ti ti-users-off" style="font-size:32px;display:block;margin-bottom:8px"></i>
                No hay estudiantes confirmados en esta actividad
            </div>`;
        return;
    }

    const presentes  = data.filter(e => e.presente).length;
    const ausentes   = data.filter(e => !e.presente).length;

    contenedor.innerHTML = `
        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-users"></i></div>
                <div class="stat-num">${data.length}</div>
                <div class="stat-lbl">Total confirmados</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-circle-check" style="color:#166534"></i></div>
                <div class="stat-num" style="color:#166534" id="stat-presentes">${presentes}</div>
                <div class="stat-lbl">Presentes</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-circle-x" style="color:#991b1b"></i></div>
                <div class="stat-num" style="color:#991b1b" id="stat-ausentes">${ausentes}</div>
                <div class="stat-lbl">Ausentes</div>
            </div>
        </div>

        <div class="tabla-container">
            <div style="padding:12px 16px;border-bottom:1px solid #e8ecf0;display:flex;align-items:center;justify-content:space-between">
                <span style="font-size:12px;color:#6b7280">Fecha: <strong>${new Date(fecha + 'T00:00:00').toLocaleDateString('es-UY')}</strong></span>
                <button class="btn btn-primary" style="padding:6px 14px;font-size:12px" onclick="guardarTodasAsistencias()">
                    <i class="ti ti-device-floppy"></i> Guardar todo
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Estudiante</th>
                        <th>Documento</th>
                        <th>Presente</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(e => {
                        const iniciales = (e.nombre.charAt(0) + e.apellido.charAt(0)).toUpperCase();
                        const colores   = ['#1a56c4','#0a2e6e','#166534','#92400e','#5b21b6','#9d174d'];
                        let hash = 0;
                        for (let c of e.nombre + e.apellido) hash = c.charCodeAt(0) + ((hash << 5) - hash);
                        const color = colores[Math.abs(hash) % colores.length];
                        const checked = e.presente ? 'checked' : '';
                        return `
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:10px">
                                    <div style="width:32px;height:32px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0">${iniciales}</div>
                                    <span style="font-weight:500">${e.nombre} ${e.apellido}</span>
                                </div>
                            </td>
                            <td style="color:#6b7280">${e.documento}</td>
                            <td>
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                                    <input type="checkbox"
                                        id="asist-${e.id_inscripcion}"
                                        data-inscripcion="${e.id_inscripcion}"
                                        ${checked}
                                        style="width:18px;height:18px;cursor:pointer;accent-color:#1a56c4"
                                        onchange="guardarAsistencia(${e.id_inscripcion}, '${fecha}', this.checked)" />
                                    <span style="font-size:13px;color:#6b7280">${e.presente ? 'Presente' : 'Ausente'}</span>
                                </label>
                            </td>
                        </tr>`
                    }).join('')}
                </tbody>
            </table>
            <div id="asist-mensaje" style="padding:12px 16px"></div>
        </div>
    `;

    window._asistFecha     = fecha;
    window._asistActividad = id_actividad;
}

async function guardarAsistencia(id_inscripcion, fecha, presente) {
    const res = await fetch(`${API}/asistencias`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id_inscripcion, fecha, presente })
    });

    const label = document.querySelector(`#asist-${id_inscripcion} + span`);
    if (label) label.textContent = presente ? 'Presente' : 'Ausente';

    const checkboxes    = document.querySelectorAll('[data-inscripcion]');
    const totalPresentes = [...checkboxes].filter(cb => cb.checked).length;
    const totalAusentes  = checkboxes.length - totalPresentes;

    const statPresentes = document.getElementById('stat-presentes');
    const statAusentes  = document.getElementById('stat-ausentes');
    if (statPresentes) statPresentes.textContent = totalPresentes;
    if (statAusentes)  statAusentes.textContent  = totalAusentes;

    const msg = document.getElementById('asist-mensaje');
    if (res.ok && msg) {
        msg.className   = 'mensaje-ok';
        msg.textContent = '✅ Asistencia guardada';
        setTimeout(() => { if (msg) msg.textContent = ''; }, 2000);
    }
}

async function guardarTodasAsistencias() {
    const checkboxes = document.querySelectorAll('[data-inscripcion]');
    const fecha      = window._asistFecha;
    const msg        = document.getElementById('asist-mensaje');

    for (const cb of checkboxes) {
        await fetch(`${API}/asistencias`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                id_inscripcion: cb.dataset.inscripcion,
                fecha,
                presente: cb.checked
            })
        });
    }

    const totalPresentes = [...checkboxes].filter(cb => cb.checked).length;
    const totalAusentes  = checkboxes.length - totalPresentes;
    const statPresentes  = document.getElementById('stat-presentes');
    const statAusentes   = document.getElementById('stat-ausentes');
    if (statPresentes) statPresentes.textContent = totalPresentes;
    if (statAusentes)  statAusentes.textContent  = totalAusentes;

    if (msg) {
        msg.className   = 'mensaje-ok';
        msg.textContent = `✅ Asistencia guardada para ${checkboxes.length} estudiantes`;
        setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
    }
}
