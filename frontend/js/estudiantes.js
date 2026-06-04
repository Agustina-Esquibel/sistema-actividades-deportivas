async function cargarEstudiantes() {
    const seccion = document.getElementById('estudiantes');

    const res  = await fetch(`${API}/estudiantes`);
    const data = await res.json();

    seccion.innerHTML = `
        <div class="page-header">
            <h2>Estudiantes</h2>
            <p>Gestión de estudiantes registrados en el sistema</p>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-users"></i></div>
                <div class="stat-num">${data.length}</div>
                <div class="stat-lbl">Estudiantes registrados</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-school"></i></div>
                <div class="stat-num">${[...new Set(data.map(e => e.facultad))].length}</div>
                <div class="stat-lbl">Facultades</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-book"></i></div>
                <div class="stat-num">${[...new Set(data.map(e => e.carrera))].length}</div>
                <div class="stat-lbl">Carreras distintas</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-user-check"></i></div>
                <div class="stat-num" id="stat-inscriptos">—</div>
                <div class="stat-lbl">Con inscripción activa</div>
            </div>
        </div>

        <div class="form-card">
            <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="toggleFormEstudiante()">
                <h3 style="margin:0">Agregar estudiante</h3>
                <i class="ti ti-plus" id="est-form-icon" style="font-size:18px;color:#1a56c4"></i>
            </div>
            <div id="est-form-body" style="display:none;margin-top:18px">
                <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr;">
                    <input id="est-documento"  placeholder="Documento" />
                    <input id="est-nombre"     placeholder="Nombre" />
                    <input id="est-apellido"   placeholder="Apellido" />
                    <input id="est-email"      placeholder="Email" type="email" />
                    <input id="est-carrera"    placeholder="Carrera" />
                    <input id="est-facultad"   placeholder="Facultad" />
                </div>
                <button class="btn btn-primary" onclick="crearEstudiante()">
                    <i class="ti ti-plus"></i> Agregar estudiante
                </button>
                <div id="est-mensaje"></div>
            </div>
        </div>

        <!-- MODAL EDITAR -->
        <div id="est-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
            <div style="background:white;border-radius:16px;padding:32px;width:600px;max-width:90%">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3 style="margin:0;font-size:16px;color:#0a2e6e">Editar estudiante</h3>
                    <button onclick="cerrarModalEstudiante()" style="background:none;border:none;cursor:pointer;font-size:20px;color:#6b7280">✕</button>
                </div>
                <input type="hidden" id="est-edit-id" />
                <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr;">
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Documento</label>
                        <input id="est-edit-documento" placeholder="Documento" />
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Nombre</label>
                        <input id="est-edit-nombre" placeholder="Nombre" />
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Apellido</label>
                        <input id="est-edit-apellido" placeholder="Apellido" />
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Email</label>
                        <input id="est-edit-email" placeholder="Email" type="email" />
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Carrera</label>
                        <input id="est-edit-carrera" placeholder="Carrera" />
                    </div>
                    <div>
                        <label style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px">Facultad</label>
                        <input id="est-edit-facultad" placeholder="Facultad" />
                    </div>
                </div>
                <div style="display:flex;gap:10px;margin-top:16px">
                    <button class="btn btn-primary" onclick="guardarEdicionEstudiante()">
                        <i class="ti ti-device-floppy"></i> Guardar cambios
                    </button>
                    <button class="btn btn-secondary" onclick="cerrarModalEstudiante()">Cancelar</button>
                </div>
                <div id="est-edit-mensaje"></div>
            </div>
        </div>

        <div class="form-card" style="padding:14px 20px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:10px">
                <i class="ti ti-search" style="color:#6b7280;font-size:16px"></i>
                <input id="est-busqueda" placeholder="Buscar por nombre, apellido, documento o carrera..."
                    style="border:none;background:transparent;padding:0;font-size:14px;flex:1"
                    oninput="filtrarEstudiantes()" />
            </div>
        </div>

        <div class="tabla-container">
            <div style="padding:12px 16px;border-bottom:1px solid #e8ecf0;">
                <span id="est-contador" style="font-size:12px;color:#6b7280">Cargando...</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Estudiante</th>
                        <th>Documento</th>
                        <th>Email</th>
                        <th>Carrera</th>
                        <th>Facultad</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="est-tabla"></tbody>
            </table>
        </div>
    `;

    window._estudiantesData = data;
    renderTablaEstudiantes(data);
    cargarStatInscriptos();
}

function toggleFormEstudiante() {
    const body = document.getElementById('est-form-body');
    const icon = document.getElementById('est-form-icon');
    const abierto = body.style.display === 'block';
    body.style.display = abierto ? 'none' : 'block';
    icon.className = abierto ? 'ti ti-plus' : 'ti ti-minus';
    icon.style.color = '#1a56c4';
    icon.style.fontSize = '18px';
}

function filtrarEstudiantes() {
    const q = document.getElementById('est-busqueda').value.toLowerCase();
    const filtrados = window._estudiantesData.filter(e =>
        e.nombre.toLowerCase().includes(q) ||
        e.apellido.toLowerCase().includes(q) ||
        e.documento.toLowerCase().includes(q) ||
        e.carrera.toLowerCase().includes(q)
    );
    renderTablaEstudiantes(filtrados);
}

function getIniciales(nombre, apellido) {
    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
}

const coloresAvatar = ['#1a56c4','#0a2e6e','#166534','#92400e','#5b21b6','#9d174d','#065f46'];

function colorAvatar(texto) {
    let hash = 0;
    for (let c of texto) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return coloresAvatar[Math.abs(hash) % coloresAvatar.length];
}

function renderTablaEstudiantes(data) {
    const tbody    = document.getElementById('est-tabla');
    const contador = document.getElementById('est-contador');
    if (!tbody) return;

    if (contador) contador.textContent = `Mostrando ${data.length} estudiante${data.length !== 1 ? 's' : ''}`;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9ca3af">
                    <i class="ti ti-users-off" style="font-size:32px;display:block;margin-bottom:8px"></i>
                    No se encontraron estudiantes
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map(e => {
        const iniciales = getIniciales(e.nombre, e.apellido);
        const color     = colorAvatar(e.nombre + e.apellido);
        return `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:32px;height:32px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0">${iniciales}</div>
                    <span style="font-weight:500">${e.nombre} ${e.apellido}</span>
                </div>
            </td>
            <td style="color:#6b7280">${e.documento}</td>
            <td style="color:#6b7280">${e.email}</td>
            <td>${e.carrera}</td>
            <td>${e.facultad}</td>
            <td>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-secondary" style="padding:6px 10px;font-size:12px" onclick="abrirModalEstudiante(${e.id_estudiante})">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="eliminarEstudiante(${e.id_estudiante}, '${e.nombre} ${e.apellido}')">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`
    }).join('');
}

async function abrirModalEstudiante(id) {
    const res  = await fetch(`${API}/estudiantes/${id}`);
    const data = await res.json();

    document.getElementById('est-edit-id').value        = data.id_estudiante;
    document.getElementById('est-edit-documento').value = data.documento;
    document.getElementById('est-edit-nombre').value    = data.nombre;
    document.getElementById('est-edit-apellido').value  = data.apellido;
    document.getElementById('est-edit-email').value     = data.email;
    document.getElementById('est-edit-carrera').value   = data.carrera;
    document.getElementById('est-edit-facultad').value  = data.facultad;
    document.getElementById('est-edit-mensaje').textContent = '';

    document.getElementById('est-modal').style.display = 'flex';
}

function cerrarModalEstudiante() {
    document.getElementById('est-modal').style.display = 'none';
}

async function guardarEdicionEstudiante() {
    const id    = document.getElementById('est-edit-id').value;
    const email = document.getElementById('est-edit-email').value.trim();
    const msg   = document.getElementById('est-edit-mensaje');

    if (!validarEmail(email)) {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ El email no es válido';
        return;
    }

    const body = {
        documento: document.getElementById('est-edit-documento').value.trim(),
        nombre:    document.getElementById('est-edit-nombre').value.trim(),
        apellido:  document.getElementById('est-edit-apellido').value.trim(),
        email,
        carrera:   document.getElementById('est-edit-carrera').value.trim(),
        facultad:  document.getElementById('est-edit-facultad').value.trim()
    };

    const res  = await fetch(`${API}/estudiantes/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok) {
        cerrarModalEstudiante();
        cargarEstudiantes();
    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

async function cargarStatInscriptos() {
    try {
        const res  = await fetch(`${API}/reportes/estudiantes-activos`);
        const data = await res.json();
        const el   = document.getElementById('stat-inscriptos');
        if (el) el.textContent = data.length;
    } catch {}
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function crearEstudiante() {
    const email = document.getElementById('est-email').value.trim();
    const msg   = document.getElementById('est-mensaje');

    if (!validarEmail(email)) {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ El email no es válido';
        return;
    }

    const body = {
        documento: document.getElementById('est-documento').value.trim(),
        nombre:    document.getElementById('est-nombre').value.trim(),
        apellido:  document.getElementById('est-apellido').value.trim(),
        email,
        carrera:   document.getElementById('est-carrera').value.trim(),
        facultad:  document.getElementById('est-facultad').value.trim()
    };

    const res  = await fetch(`${API}/estudiantes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok) {
        msg.className   = 'mensaje-ok';
        msg.textContent = '✅ Estudiante agregado correctamente';
        ['est-documento','est-nombre','est-apellido','est-email','est-carrera','est-facultad']
            .forEach(id => document.getElementById(id).value = '');
        cargarEstudiantes();
    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

async function eliminarEstudiante(id, nombre) {
    if (!confirm(`¿Seguro que querés eliminar a ${nombre}?`)) return;
    const res = await fetch(`${API}/estudiantes/${id}`, { method: 'DELETE' });
    if (res.ok) cargarEstudiantes();
}
