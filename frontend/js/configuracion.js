async function cargarConfiguracion() {
    const seccion = document.getElementById('configuracion');

    const [resDisciplinas, resEspacios] = await Promise.all([
        fetch(`${API}/disciplinas`),
        fetch(`${API}/espacios`)
    ]);
    const disciplinas = await resDisciplinas.json();
    const espacios    = await resEspacios.json();

    seccion.innerHTML = `
        <div class="page-header">
            <h2>Configuración</h2>
            <p>Gestión de disciplinas y espacios deportivos</p>
        </div>

        <!-- MODAL EDITAR DISCIPLINA -->
        <div id="disc-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
            <div style="background:white;border-radius:16px;padding:32px;width:400px;max-width:90%">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3 style="margin:0;font-size:16px;color:#0a2e6e">Editar disciplina</h3>
                    <button onclick="cerrarModal('disc-modal')" style="background:none;border:none;cursor:pointer;font-size:20px;color:#6b7280">✕</button>
                </div>
                <input type="hidden" id="disc-edit-id" />
                <div class="form-grid" style="grid-template-columns:1fr;">
                    <input id="disc-edit-nombre" placeholder="Nombre de la disciplina" />
                </div>
                <div style="display:flex;gap:10px;margin-top:16px">
                    <button class="btn btn-primary" onclick="guardarEdicionDisciplina()">
                        <i class="ti ti-device-floppy"></i> Guardar cambios
                    </button>
                    <button class="btn btn-secondary" onclick="cerrarModal('disc-modal')">Cancelar</button>
                </div>
                <div id="disc-edit-mensaje"></div>
            </div>
        </div>

        <!-- MODAL EDITAR ESPACIO -->
        <div id="esp-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
            <div style="background:white;border-radius:16px;padding:32px;width:400px;max-width:90%">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h3 style="margin:0;font-size:16px;color:#0a2e6e">Editar espacio</h3>
                    <button onclick="cerrarModal('esp-modal')" style="background:none;border:none;cursor:pointer;font-size:20px;color:#6b7280">✕</button>
                </div>
                <input type="hidden" id="esp-edit-id" />
                <div class="form-grid" style="grid-template-columns:1fr;">
                    <input id="esp-edit-nombre"    placeholder="Nombre del espacio" />
                    <input id="esp-edit-ubicacion" placeholder="Ubicación" />
                </div>
                <div style="display:flex;gap:10px;margin-top:16px">
                    <button class="btn btn-primary" onclick="guardarEdicionEspacio()">
                        <i class="ti ti-device-floppy"></i> Guardar cambios
                    </button>
                    <button class="btn btn-secondary" onclick="cerrarModal('esp-modal')">Cancelar</button>
                </div>
                <div id="esp-edit-mensaje"></div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

            <!-- DISCIPLINAS -->
            <div>
                <div class="form-card">
                    <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="toggleForm('disc-form-body', 'disc-form-icon')">
                        <h3 style="margin:0">Agregar disciplina</h3>
                        <i class="ti ti-plus" id="disc-form-icon" style="font-size:18px;color:#1a56c4"></i>
                    </div>
                    <div id="disc-form-body" style="display:none;margin-top:18px">
                        <div class="form-grid" style="grid-template-columns:1fr;">
                            <input id="disc-nombre" placeholder="Nombre de la disciplina" />
                        </div>
                        <button class="btn btn-primary" onclick="crearDisciplina()">
                            <i class="ti ti-plus"></i> Agregar
                        </button>
                        <div id="disc-mensaje"></div>
                    </div>
                </div>

                <div class="tabla-container">
                    <div style="padding:12px 16px;border-bottom:1px solid #e8ecf0">
                        <span style="font-size:12px;color:#6b7280">Mostrando ${disciplinas.length} disciplina${disciplinas.length !== 1 ? 's' : ''}</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${disciplinas.map(d => `
                                <tr>
                                    <td style="font-weight:500">${d.nombre}</td>
                                    <td>
                                        <div style="display:flex;gap:6px">
                                            <button class="btn btn-secondary" style="padding:6px 10px;font-size:12px" onclick="abrirModalDisciplina(${d.id_disciplina}, '${d.nombre}')">
                                                <i class="ti ti-edit"></i>
                                            </button>
                                            <button class="btn btn-danger" onclick="eliminarDisciplina(${d.id_disciplina}, '${d.nombre}')">
                                                <i class="ti ti-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- ESPACIOS -->
            <div>
                <div class="form-card">
                    <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="toggleForm('esp-form-body', 'esp-form-icon')">
                        <h3 style="margin:0">Agregar espacio</h3>
                        <i class="ti ti-plus" id="esp-form-icon" style="font-size:18px;color:#1a56c4"></i>
                    </div>
                    <div id="esp-form-body" style="display:none;margin-top:18px">
                        <div class="form-grid" style="grid-template-columns:1fr;">
                            <input id="esp-nombre"    placeholder="Nombre del espacio" />
                            <input id="esp-ubicacion" placeholder="Ubicación" />
                        </div>
                        <button class="btn btn-primary" onclick="crearEspacio()">
                            <i class="ti ti-plus"></i> Agregar
                        </button>
                        <div id="esp-mensaje"></div>
                    </div>
                </div>

                <div class="tabla-container">
                    <div style="padding:12px 16px;border-bottom:1px solid #e8ecf0">
                        <span style="font-size:12px;color:#6b7280">Mostrando ${espacios.length} espacio${espacios.length !== 1 ? 's' : ''}</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Ubicación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${espacios.map(e => `
                                <tr>
                                    <td style="font-weight:500">${e.nombre}</td>
                                    <td style="color:#6b7280">${e.ubicacion ?? '—'}</td>
                                    <td>
                                        <div style="display:flex;gap:6px">
                                            <button class="btn btn-secondary" style="padding:6px 10px;font-size:12px" onclick="abrirModalEspacio(${e.id_espacio}, '${e.nombre}', '${e.ubicacion ?? ''}')">
                                                <i class="ti ti-edit"></i>
                                            </button>
                                            <button class="btn btn-danger" onclick="eliminarEspacio(${e.id_espacio}, '${e.nombre}')">
                                                <i class="ti ti-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;
}

function toggleForm(bodyId, iconId) {
    const body = document.getElementById(bodyId);
    const icon = document.getElementById(iconId);
    const abierto = body.style.display === 'block';
    body.style.display = abierto ? 'none' : 'block';
    icon.className = abierto ? 'ti ti-plus' : 'ti ti-minus';
    icon.style.color = '#1a56c4';
    icon.style.fontSize = '18px';
}

function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
}

function abrirModalDisciplina(id, nombre) {
    document.getElementById('disc-edit-id').value     = id;
    document.getElementById('disc-edit-nombre').value = nombre;
    document.getElementById('disc-edit-mensaje').textContent = '';
    document.getElementById('disc-modal').style.display = 'flex';
}

async function guardarEdicionDisciplina() {
    const id     = document.getElementById('disc-edit-id').value;
    const nombre = document.getElementById('disc-edit-nombre').value.trim();
    const msg    = document.getElementById('disc-edit-mensaje');

    if (!nombre) {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ El nombre es obligatorio';
        return;
    }

    const res  = await fetch(`${API}/disciplinas/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre })
    });
    const data = await res.json();

    if (res.ok) {
        cerrarModal('disc-modal');
        cargarConfiguracion();
    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

function abrirModalEspacio(id, nombre, ubicacion) {
    document.getElementById('esp-edit-id').value        = id;
    document.getElementById('esp-edit-nombre').value    = nombre;
    document.getElementById('esp-edit-ubicacion').value = ubicacion;
    document.getElementById('esp-edit-mensaje').textContent = '';
    document.getElementById('esp-modal').style.display = 'flex';
}

async function guardarEdicionEspacio() {
    const id        = document.getElementById('esp-edit-id').value;
    const nombre    = document.getElementById('esp-edit-nombre').value.trim();
    const ubicacion = document.getElementById('esp-edit-ubicacion').value.trim();
    const msg       = document.getElementById('esp-edit-mensaje');

    if (!nombre) {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ El nombre es obligatorio';
        return;
    }

    const res  = await fetch(`${API}/espacios/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre, ubicacion })
    });
    const data = await res.json();

    if (res.ok) {
        cerrarModal('esp-modal');
        cargarConfiguracion();
    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

async function crearDisciplina() {
    const nombre = document.getElementById('disc-nombre').value.trim();
    const msg    = document.getElementById('disc-mensaje');

    if (!nombre) {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ El nombre es obligatorio';
        return;
    }

    const res  = await fetch(`${API}/disciplinas`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre })
    });
    const data = await res.json();

    if (res.ok) {
        msg.className   = 'mensaje-ok';
        msg.textContent = '✅ Disciplina agregada';
        document.getElementById('disc-nombre').value = '';
        cargarConfiguracion();
    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

async function eliminarDisciplina(id, nombre) {
    if (!confirm(`¿Eliminar la disciplina "${nombre}"?`)) return;
    const res = await fetch(`${API}/disciplinas/${id}`, { method: 'DELETE' });
    if (res.ok) cargarConfiguracion();
    else alert('No se puede eliminar, tiene actividades asociadas');
}

async function crearEspacio() {
    const nombre    = document.getElementById('esp-nombre').value.trim();
    const ubicacion = document.getElementById('esp-ubicacion').value.trim();
    const msg       = document.getElementById('esp-mensaje');

    if (!nombre) {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ El nombre es obligatorio';
        return;
    }

    const res  = await fetch(`${API}/espacios`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre, ubicacion })
    });
    const data = await res.json();

    if (res.ok) {
        msg.className   = 'mensaje-ok';
        msg.textContent = '✅ Espacio agregado';
        document.getElementById('esp-nombre').value    = '';
        document.getElementById('esp-ubicacion').value = '';
        cargarConfiguracion();
    } else {
        msg.className   = 'mensaje-error';
        msg.textContent = '❌ ' + data.error;
    }
}

async function eliminarEspacio(id, nombre) {
    if (!confirm(`¿Eliminar el espacio "${nombre}"?`)) return;
    const res = await fetch(`${API}/espacios/${id}`, { method: 'DELETE' });
    if (res.ok) cargarConfiguracion();
    else alert('No se puede eliminar, tiene actividades asociadas');
}
