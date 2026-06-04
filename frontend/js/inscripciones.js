async function cargarInscripciones() {
    const seccion = document.getElementById('inscripciones');

    const [resEstudiantes, resActividades] = await Promise.all([
        fetch(`${API}/estudiantes`),
        fetch(`${API}/actividades`)
    ]);
    const estudiantes = await resEstudiantes.json();
    const actividades = await resActividades.json();

    const optsEstudiantes = estudiantes.map(e =>
        `<option value="${e.id_estudiante}">${e.apellido}, ${e.nombre} — ${e.documento}</option>`
    ).join('');

    const optsActividades = actividades.map(a =>
        `<option value="${a.id_actividad}">${a.nombre} (${a.dia} ${a.horario})</option>`
    ).join('');

    const resReportes = await fetch(`${API}/reportes/inscriptos-por-actividad`);
    const reportes    = await resReportes.json();
    const totalInscriptos = reportes.reduce((s, r) => s + r.total_confirmados, 0);

    const resEspera = await fetch(`${API}/reportes/lista-espera`);
    const espera    = await resEspera.json();

    seccion.innerHTML = `
        <div class="page-header">
            <h2>Inscripciones</h2>
            <p>Gestión de inscripciones a actividades deportivas</p>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-clipboard-list"></i></div>
                <div class="stat-num">${totalInscriptos}</div>
                <div class="stat-lbl">Inscripciones confirmadas</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-clock" style="color:#92400e"></i></div>
                <div class="stat-num" style="color:#92400e">${espera.length}</div>
                <div class="stat-lbl">En lista de espera</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-users"></i></div>
                <div class="stat-num">${estudiantes.length}</div>
                <div class="stat-lbl">Estudiantes registrados</div>
            </div>
        </div>

        <div class="form-card">
            <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="toggleFormInscripcion()">
                <h3 style="margin:0">Nueva inscripción</h3>
                <i class="ti ti-plus" id="insc-form-icon" style="font-size:18px;color:#1a56c4"></i>
            </div>
            <div id="insc-form-body" style="display:none;margin-top:18px">
                <div class="form-grid" style="grid-template-columns:1fr 1fr;">
                    <select id="insc-estudiante"><option value="">-- Seleccione un estudiante --</option>${optsEstudiantes}</select>
                    <select id="insc-actividad"><option value="">-- Seleccione una actividad --</option>${optsActividades}</select>
                </div>
                <button class="btn btn-primary" onclick="crearInscripcion()">
                    <i class="ti ti-plus"></i> Inscribir estudiante
                </button>
                <div id="insc-mensaje"></div>
            </div>
        </div>

        <div class="form-card">
            <h3>Ver inscripciones por actividad</h3>
            <div class="form-grid" style="grid-template-columns:1fr auto;">
                <select id="insc-filtro-actividad">
                    <option value="">-- Seleccione una actividad --</option>
                    ${optsActividades}
                </select>
                <button class="btn btn-secondary" onclick="verInscripcionesActividad()">
                    <i class="ti ti-search"></i> Ver
                </button>
            </div>
        </div>

        <div id="insc-tabla-container"></div>
    `;
}

function toggleFormInscripcion() {
    const body = document.getElementById('insc-form-body');
    const icon = document.getElementById('insc-form-icon');
    const abierto = body.style.display === 'block';
    body.style.display = abierto ? 'none' : 'block';
    icon.className = abierto ? 'ti ti-plus' : 'ti ti-minus';
    icon.style.color = '#1a56c4';
    icon.style.fontSize = '18px';
}

async function crearInscripcion() {
    const id_estudiante = document.getElementById('insc-estudiante').value;
    const id_actividad  = document.getElementById('insc-actividad').value;
    const msg = document.getElementById('insc-mensaje');

    if (!id_estudiante || !id_actividad) {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ Seleccione un estudiante y una actividad';
        return;
    }

    const res  = await fetch(`${API}/inscripciones`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id_estudiante, id_actividad })
    });
    const data = await res.json();

    if (res.ok) {
        const esEspera  = data.estado === 'en_espera';
        msg.className   = esEspera ? 'mensaje-error' : 'mensaje-ok';
        msg.textContent = esEspera
            ? '⏳ Sin cupo disponible — inscripción en lista de espera'
            : '✅ Inscripción confirmada correctamente';

        // Actualizar stats sin recargar todo el formulario
        const resReportes = await fetch(`${API}/reportes/inscriptos-por-actividad`);
        const reportes    = await resReportes.json();
        const total = reportes.reduce((s, r) => s + r.total_confirmados, 0);
        const elTotal = document.querySelector('.stat-num');
        if (elTotal) elTotal.textContent = total;

    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

async function verInscripcionesActividad() {
    const id = document.getElementById('insc-filtro-actividad').value;
    if (!id) return;

    const res  = await fetch(`${API}/actividades/${id}/inscripciones`);
    const data = await res.json();
    const contenedor = document.getElementById('insc-tabla-container');

    const confirmados = data.filter(i => i.estado === 'confirmada').length;
    const enEspera    = data.filter(i => i.estado === 'en_espera').length;

    if (data.length === 0) {
        contenedor.innerHTML = `
            <div class="form-card" style="text-align:center;color:#9ca3af;padding:40px">
                <i class="ti ti-clipboard-off" style="font-size:32px;display:block;margin-bottom:8px"></i>
                No hay inscripciones para esta actividad
            </div>`;
        return;
    }

    contenedor.innerHTML = `
        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-users"></i></div>
                <div class="stat-num">${data.length}</div>
                <div class="stat-lbl">Total inscriptos</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-circle-check" style="color:#166534"></i></div>
                <div class="stat-num" style="color:#166534">${confirmados}</div>
                <div class="stat-lbl">Confirmados</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-clock" style="color:#92400e"></i></div>
                <div class="stat-num" style="color:#92400e">${enEspera}</div>
                <div class="stat-lbl">En lista de espera</div>
            </div>
        </div>

        <div class="tabla-container">
            <div style="padding:12px 16px;border-bottom:1px solid #e8ecf0">
                <span style="font-size:12px;color:#6b7280">Mostrando ${data.length} inscripción${data.length !== 1 ? 'es' : ''}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Estudiante</th>
                        <th>Documento</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Fecha inscripción</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(i => {
                        const iniciales = (i.nombre.charAt(0) + i.apellido.charAt(0)).toUpperCase();
                        const colores   = ['#1a56c4','#0a2e6e','#166534','#92400e','#5b21b6','#9d174d'];
                        let hash = 0;
                        for (let c of i.nombre + i.apellido) hash = c.charCodeAt(0) + ((hash << 5) - hash);
                        const color = colores[Math.abs(hash) % colores.length];
                        return `
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:10px">
                                    <div style="width:32px;height:32px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0">${iniciales}</div>
                                    <span style="font-weight:500">${i.nombre} ${i.apellido}</span>
                                </div>
                            </td>
                            <td style="color:#6b7280">${i.documento}</td>
                            <td style="color:#6b7280">${i.email}</td>
                            <td><span class="badge badge-${i.estado}">${i.estado}</span></td>
                            <td style="color:#6b7280">${new Date(i.fecha_inscripcion).toLocaleDateString('es-UY')}</td>
                            <td>
                                <button class="btn btn-danger" onclick="cancelarInscripcion(${i.id_inscripcion}, '${i.nombre} ${i.apellido}')">
                                    <i class="ti ti-trash"></i> Cancelar
                                </button>
                            </td>
                        </tr>`
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function cancelarInscripcion(id, nombre) {
    if (!confirm(`¿Cancelar la inscripción de ${nombre}?`)) return;
    const res = await fetch(`${API}/inscripciones/${id}`, { method: 'DELETE' });
    if (res.ok) verInscripcionesActividad();
}
