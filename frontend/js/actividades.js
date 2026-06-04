async function cargarActividades() {
    const seccion = document.getElementById('actividades');

    const [resAct, resDisciplinas, resEspacios] = await Promise.all([
        fetch(`${API}/actividades`),
        fetch(`${API}/disciplinas`),
        fetch(`${API}/espacios`)
    ]);
    const actividades = await resAct.json();
    const disciplinas = await resDisciplinas.json();
    const espacios    = await resEspacios.json();

    const optsDisciplinas = disciplinas.map(d =>
        `<option value="${d.id_disciplina}">${d.nombre}</option>`
    ).join('');

    const optsEspacios = espacios.map(e =>
        `<option value="${e.id_espacio}">${e.nombre}</option>`
    ).join('');

    const totalAbierta = actividades.filter(a => a.estado === 'abierta').length;
    const totalCerrada = actividades.filter(a => a.estado === 'cerrada' || a.estado === 'finalizada' || a.estado === 'cancelada').length;
    const totalCupos   = actividades.reduce((s, a) => s + a.cupo_maximo, 0);

    seccion.innerHTML = `
        <div class="page-header">
            <h2>Actividades</h2>
            <p>Gestión de actividades deportivas disponibles</p>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-ball-football"></i></div>
                <div class="stat-num">${actividades.length}</div>
                <div class="stat-lbl">Total actividades</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-circle-check" style="color:#166534"></i></div>
                <div class="stat-num" style="color:#166534">${totalAbierta}</div>
                <div class="stat-lbl">Abiertas</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-circle-x" style="color:#991b1b"></i></div>
                <div class="stat-num" style="color:#991b1b">${totalCerrada}</div>
                <div class="stat-lbl">Cerradas / finalizadas</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-armchair"></i></div>
                <div class="stat-num">${totalCupos}</div>
                <div class="stat-lbl">Cupos totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-lock" style="color:#991b1b"></i></div>
                <div class="stat-num" style="color:#991b1b" id="stat-completas">—</div>
                <div class="stat-lbl">Actividades llenas</div>
            </div>
        </div>

        <div class="form-card">
            <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="toggleFormActividad()">
                <h3 style="margin:0">Agregar actividad</h3>
                <i class="ti ti-plus" id="act-form-icon" style="font-size:18px;color:#1a56c4"></i>
            </div>
            <div id="act-form-body" style="display:none;margin-top:18px">
                <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr;">
                    <input id="act-nombre" placeholder="Nombre de la actividad" />
                    <select id="act-disciplina"><option value="">-- Disciplina --</option>${optsDisciplinas}</select>
                    <select id="act-espacio"><option value="">-- Espacio --</option>${optsEspacios}</select>
                    <input id="act-cupo" placeholder="Cupo máximo" type="number" min="1" />
                    <select id="act-dia">
                        <option value="">-- Día --</option>
                        <option>Lunes</option><option>Martes</option><option>Miércoles</option>
                        <option>Jueves</option><option>Viernes</option><option>Sábado</option>
                    </select>
                    <input id="act-horario" type="time" />
                </div>
                <button class="btn btn-primary" onclick="crearActividad()">
                    <i class="ti ti-plus"></i> Agregar actividad
                </button>
                <div id="act-mensaje"></div>
            </div>
        </div>

        <!-- MODAL EDITAR -->
        <div id="act-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
            <div style="background:white;border-radius:16px;padding:32px;width:640px;max-width:90%">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3 style="margin:0;font-size:16px;color:#0a2e6e">Editar actividad</h3>
                    <button onclick="cerrarModalActividad()" style="background:none;border:none;cursor:pointer;font-size:20px;color:#6b7280">✕</button>
                </div>
                <input type="hidden" id="act-edit-id" />
                <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr;">
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Nombre</label>
                        <input id="act-edit-nombre" placeholder="Nombre" />
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Disciplina</label>
                        <select id="act-edit-disciplina"><option value="">-- Disciplina --</option>${optsDisciplinas}</select>
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Espacio</label>
                        <select id="act-edit-espacio"><option value="">-- Espacio --</option>${optsEspacios}</select>
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Cupo máximo</label>
                        <input id="act-edit-cupo" type="number" min="1" />
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Día</label>
                        <select id="act-edit-dia">
                            <option value="">-- Día --</option>
                            <option>Lunes</option><option>Martes</option><option>Miércoles</option>
                            <option>Jueves</option><option>Viernes</option><option>Sábado</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Horario</label>
                        <input id="act-edit-horario" type="time" />
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Estado</label>
                        <select id="act-edit-estado">
                            <option value="abierta">abierta</option>
                            <option value="cerrada">cerrada</option>
                            <option value="finalizada">finalizada</option>
                            <option value="cancelada">cancelada</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex;gap:10px;margin-top:16px">
                    <button class="btn btn-primary" onclick="guardarEdicionActividad()">
                        <i class="ti ti-device-floppy"></i> Guardar cambios
                    </button>
                    <button class="btn btn-secondary" onclick="cerrarModalActividad()">Cancelar</button>
                </div>
                <div id="act-edit-mensaje"></div>
            </div>
        </div>

        <div class="form-card" style="padding:14px 20px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:10px">
                <i class="ti ti-search" style="color:#6b7280;font-size:16px"></i>
                <input id="act-busqueda" placeholder="Buscar por nombre, disciplina o espacio..."
                    style="border:none;background:transparent;padding:0;font-size:14px;flex:1"
                    oninput="filtrarActividades()" />
            </div>
        </div>

        <div class="tabla-container">
            <div style="padding:12px 16px;border-bottom:1px solid #e8ecf0;">
                <span id="act-contador" style="font-size:12px;color:#6b7280">Cargando...</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Disciplina</th>
                        <th>Espacio</th>
                        <th>Ocupación</th>
                        <th>Día</th>
                        <th>Horario</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="act-tabla"></tbody>
            </table>
        </div>
    `;

    window._actividadesData = actividades;
    window._actDisciplinas  = disciplinas;
    window._actEspacios     = espacios;
    renderTablaActividades(actividades);
    cargarBarrasOcupacion();
}

function toggleFormActividad() {
    const body = document.getElementById('act-form-body');
    const icon = document.getElementById('act-form-icon');
    const abierto = body.style.display === 'block';
    body.style.display = abierto ? 'none' : 'block';
    icon.className = abierto ? 'ti ti-plus' : 'ti ti-minus';
    icon.style.color = '#1a56c4';
    icon.style.fontSize = '18px';
}

function filtrarActividades() {
    const q = document.getElementById('act-busqueda').value.toLowerCase();
    const filtrados = window._actividadesData.filter(a =>
        a.nombre.toLowerCase().includes(q) ||
        a.disciplina.toLowerCase().includes(q) ||
        a.espacio.toLowerCase().includes(q)
    );
    renderTablaActividades(filtrados);
}

function renderTablaActividades(data) {
    const tbody    = document.getElementById('act-tabla');
    const contador = document.getElementById('act-contador');
    if (!tbody) return;

    if (contador) contador.textContent = `Mostrando ${data.length} actividad${data.length !== 1 ? 'es' : ''}`;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9ca3af">
                    <i class="ti ti-ball-football-off" style="font-size:32px;display:block;margin-bottom:8px"></i>
                    No se encontraron actividades
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map(a => `
        <tr>
            <td style="font-weight:500">${a.nombre}</td>
            <td>${a.disciplina}</td>
            <td style="color:#6b7280">${a.espacio}</td>
            <td>
                <div style="display:flex;justify-content:space-between;width:80px;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px">
                    <span>${a.cupo_maximo} cupos</span>
                    <span id="pct-${a.id_actividad}" style="color:#6b7280"></span>
                </div>
                <div style="background:#e8ecf0;border-radius:20px;height:5px;width:80px">
                    <div style="background:#1a56c4;height:5px;border-radius:20px;width:0%;transition:width 0.4s"
                         id="barra-${a.id_actividad}"></div>
                </div>
            </td>
            <td>${a.dia}</td>
            <td>${a.horario}</td>
            <td><span class="badge badge-${a.estado}">${a.estado}</span></td>
            <td>
                <div style="display:flex;gap:6px;align-items:center">
                    <button class="btn btn-secondary" style="padding:6px 10px;font-size:12px" onclick="abrirModalActividad(${a.id_actividad})">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="eliminarActividad(${a.id_actividad}, '${a.nombre}')">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function abrirModalActividad(id) {
    const res = await fetch(`${API}/actividades/${id}`);
    const a   = await res.json();

    document.getElementById('act-edit-id').value         = a.id_actividad;
    document.getElementById('act-edit-nombre').value     = a.nombre;
    document.getElementById('act-edit-cupo').value       = a.cupo_maximo;
    document.getElementById('act-edit-horario').value    = a.horario;
    document.getElementById('act-edit-dia').value        = a.dia;
    document.getElementById('act-edit-estado').value     = a.estado;
    document.getElementById('act-edit-disciplina').value = a.id_disciplina;
    document.getElementById('act-edit-espacio').value    = a.id_espacio;
    document.getElementById('act-edit-mensaje').textContent = '';

    document.getElementById('act-modal').style.display = 'flex';
}

function cerrarModalActividad() {
    document.getElementById('act-modal').style.display = 'none';
}

async function guardarEdicionActividad() {
    const id  = document.getElementById('act-edit-id').value;
    const msg = document.getElementById('act-edit-mensaje');

    const body = {
        nombre:        document.getElementById('act-edit-nombre').value.trim(),
        id_disciplina: document.getElementById('act-edit-disciplina').value,
        id_espacio:    document.getElementById('act-edit-espacio').value,
        cupo_maximo:   document.getElementById('act-edit-cupo').value,
        dia:           document.getElementById('act-edit-dia').value,
        horario:       document.getElementById('act-edit-horario').value,
        estado:        document.getElementById('act-edit-estado').value
    };

    const res  = await fetch(`${API}/actividades/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok) {
        cerrarModalActividad();
        cargarActividades();
    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

async function cargarBarrasOcupacion() {
    try {
        const res  = await fetch(`${API}/reportes/ocupacion`);
        const data = await res.json();
        data.forEach(o => {
            const barra = document.getElementById(`barra-${o.id_actividad}`);
            const pctEl = document.getElementById(`pct-${o.id_actividad}`);
            if (!barra) return;
            const pct = Math.min(parseFloat(o.porcentaje_ocupacion) || 0, 100);
            barra.style.width      = pct + '%';
            barra.style.background = pct >= 100 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#1a56c4';
            if (pctEl) pctEl.textContent = pct + '%';
        });
        const completas = data.filter(o => (parseFloat(o.porcentaje_ocupacion) || 0) >= 100).length;
        const el = document.getElementById('stat-completas');
        if (el) el.textContent = completas;
    } catch {}
}

async function crearActividad() {
    const body = {
        nombre:        document.getElementById('act-nombre').value,
        id_disciplina: document.getElementById('act-disciplina').value,
        id_espacio:    document.getElementById('act-espacio').value,
        cupo_maximo:   document.getElementById('act-cupo').value,
        dia:           document.getElementById('act-dia').value,
        horario:       document.getElementById('act-horario').value
    };

    const res  = await fetch(`${API}/actividades`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    });
    const data = await res.json();
    const msg  = document.getElementById('act-mensaje');

    if (res.ok) {
        msg.className   = 'mensaje-ok';
        msg.textContent = '✅ Actividad creada correctamente';
        ['act-nombre','act-cupo','act-horario'].forEach(id => document.getElementById(id).value = '');
        cargarActividades();
    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

async function eliminarActividad(id, nombre) {
    if (!confirm(`¿Seguro que querés eliminar "${nombre}"?`)) return;
    const res = await fetch(`${API}/actividades/${id}`, { method: 'DELETE' });
    if (res.ok) cargarActividades();
}
