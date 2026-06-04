async function cargarReportes() {
    const seccion = document.getElementById('reportes');
    seccion.innerHTML = `
        <div class="page-header">
            <h2>Reportes</h2>
            <p>Resumen general del sistema de actividades deportivas</p>
        </div>
        <div id="reportes-contenido">
            <div style="text-align:center;padding:40px;color:#9ca3af">
                <i class="ti ti-loader" style="font-size:32px;display:block;margin-bottom:8px"></i>
                Cargando reportes...
            </div>
        </div>
    `;

    const [
        resInscriptos, resCupos, resDisciplina, resCarrera,
        resOcupacion, resAsistencia, resInasistencias,
        resEspera, resActivos, resVacias
    ] = await Promise.all([
        fetch(`${API}/reportes/inscriptos-por-actividad`),
        fetch(`${API}/reportes/cupos-disponibles`),
        fetch(`${API}/reportes/inscriptos-por-disciplina`),
        fetch(`${API}/reportes/inscriptos-por-carrera`),
        fetch(`${API}/reportes/ocupacion`),
        fetch(`${API}/reportes/asistencia`),
        fetch(`${API}/reportes/inasistencias`),
        fetch(`${API}/reportes/lista-espera`),
        fetch(`${API}/reportes/estudiantes-activos`),
        fetch(`${API}/reportes/actividades-vacias`)
    ]);

    const inscriptos    = await resInscriptos.json();
    const cupos         = await resCupos.json();
    const disciplina    = await resDisciplina.json();
    const carrera       = await resCarrera.json();
    const ocupacion     = await resOcupacion.json();
    const asistencia    = await resAsistencia.json();
    const inasistencias = await resInasistencias.json();
    const espera        = await resEspera.json();
    const activos       = await resActivos.json();
    const vacias        = await resVacias.json();

    const totalConfirmados = inscriptos.reduce((s, r) => s + r.total_confirmados, 0);
    const avgAsistencia    = asistencia.length
        ? Math.round(asistencia.reduce((s, r) => s + (parseFloat(r.porcentaje_asistencia) || 0), 0) / asistencia.length)
        : 0;

    document.getElementById('reportes-contenido').innerHTML = `

        <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:28px">
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-clipboard-check"></i></div>
                <div class="stat-num">${totalConfirmados}</div>
                <div class="stat-lbl">Inscripciones confirmadas</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-clock" style="color:#92400e"></i></div>
                <div class="stat-num" style="color:#92400e">${espera.length}</div>
                <div class="stat-lbl">En lista de espera</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-chart-bar" style="color:#166534"></i></div>
                <div class="stat-num" style="color:#166534">${avgAsistencia}%</div>
                <div class="stat-lbl">Asistencia promedio</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ti ti-alert-triangle" style="color:#991b1b"></i></div>
                <div class="stat-num" style="color:#991b1b">${inasistencias.length}</div>
                <div class="stat-lbl">Estudiantes con 3+ faltas</div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
            ${tablaReporte('Inscriptos por actividad', ['Actividad', 'Confirmados'],
                inscriptos.map(r => `
                    <tr>
                        <td>${r.actividad}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:8px">
                                <div style="background:#e8ecf0;border-radius:20px;height:5px;width:60px;flex-shrink:0">
                                    <div style="background:#1a56c4;height:5px;border-radius:20px;width:${Math.min(r.total_confirmados * 20, 100)}%"></div>
                                </div>
                                <span style="font-weight:600;color:#0a2e6e">${r.total_confirmados}</span>
                            </div>
                        </td>
                    </tr>`)
            )}
            ${tablaReporte('Inscriptos por disciplina', ['Disciplina', 'Inscriptos'],
                disciplina.map(r => `
                    <tr>
                        <td>${r.disciplina}</td>
                        <td style="font-weight:600;color:#0a2e6e">${r.total_inscriptos}</td>
                    </tr>`)
            )}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
            ${tablaReporte('Ocupación por actividad', ['Actividad', 'Cupo', 'Confirmados', 'Ocupación'],
                ocupacion.map(r => {
                    const pct = parseFloat(r.porcentaje_ocupacion) || 0;
                    const color = pct >= 100 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#1a56c4';
                    return `
                    <tr>
                        <td>${r.actividad}</td>
                        <td style="color:#6b7280">${r.cupo_maximo}</td>
                        <td style="color:#6b7280">${r.confirmados}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:6px">
                                <div style="background:#e8ecf0;border-radius:20px;height:5px;width:50px;flex-shrink:0">
                                    <div style="background:${color};height:5px;border-radius:20px;width:${Math.min(pct,100)}%"></div>
                                </div>
                                <span style="font-size:11px;font-weight:600;color:${color}">${pct}%</span>
                            </div>
                        </td>
                    </tr>`
                })
            )}
            ${tablaReporte('Asistencia por actividad', ['Actividad', 'Clases', 'Presentes', 'Asistencia'],
                asistencia.map(r => {
                    const pct = parseFloat(r.porcentaje_asistencia) || 0;
                    const color = pct >= 80 ? '#166534' : pct >= 50 ? '#92400e' : '#991b1b';
                    return `
                    <tr>
                        <td>${r.actividad}</td>
                        <td style="color:#6b7280">${r.clases_registradas}</td>
                        <td style="color:#6b7280">${r.presentes}</td>
                        <td style="font-weight:600;color:${color}">${pct}%</td>
                    </tr>`
                })
            )}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
            ${tablaReporte('Lista de espera', ['Actividad', 'Estudiante', 'Fecha'],
                espera.length === 0
                    ? [`<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:20px">Sin estudiantes en espera</td></tr>`]
                    : espera.map(r => `
                        <tr>
                            <td>${r.actividad}</td>
                            <td style="font-weight:500">${r.nombre} ${r.apellido}</td>
                            <td style="color:#6b7280">${new Date(r.fecha_en_espera).toLocaleDateString('es-UY')}</td>
                        </tr>`)
            )}
            ${tablaReporte('Estudiantes con 3+ inasistencias', ['Estudiante', 'Actividad', 'Faltas'],
                inasistencias.length === 0
                    ? [`<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:20px">Sin estudiantes con 3+ inasistencias</td></tr>`]
                    : inasistencias.map(r => `
                        <tr>
                            <td style="font-weight:500">${r.nombre} ${r.apellido}</td>
                            <td style="color:#6b7280">${r.actividad}</td>
                            <td><span class="badge badge-cancelada">${r.total_inasistencias}</span></td>
                        </tr>`)
            )}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
            ${tablaReporte('Estudiantes más activos', ['Estudiante', 'Carrera', 'Actividades'],
                activos.map(r => `
                    <tr>
                        <td style="font-weight:500">${r.nombre} ${r.apellido}</td>
                        <td style="color:#6b7280">${r.carrera}</td>
                        <td><span class="badge badge-confirmada">${r.actividades_confirmadas}</span></td>
                    </tr>`)
            )}
            ${tablaReporte('Actividades sin inscriptos', ['Actividad', 'Disciplina', 'Estado'],
                vacias.length === 0
                    ? [`<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:20px">Todas las actividades tienen inscriptos</td></tr>`]
                    : vacias.map(r => `
                        <tr>
                            <td style="font-weight:500">${r.actividad}</td>
                            <td style="color:#6b7280">${r.disciplina}</td>
                            <td><span class="badge badge-${r.estado}">${r.estado}</span></td>
                        </tr>`)
            )}
        </div>

        ${tablaReporte('Inscriptos por carrera y facultad', ['Facultad', 'Carrera', 'Inscriptos'],
            carrera.map(r => `
                <tr>
                    <td style="color:#6b7280">${r.facultad}</td>
                    <td style="font-weight:500">${r.carrera}</td>
                    <td style="font-weight:600;color:#0a2e6e">${r.total_inscriptos}</td>
                </tr>`),
            true
        )}
    `;
}

function tablaReporte(titulo, columnas, filas, fullWidth = false) {
    return `
        <div class="reporte-card" ${fullWidth ? 'style="grid-column:1/-1"' : ''}>
            <h3>${titulo}</h3>
            <div style="overflow-x:auto">
                <table>
                    <thead>
                        <tr>${columnas.map(c => `<th>${c}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${filas.join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
