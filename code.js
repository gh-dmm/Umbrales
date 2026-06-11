/**
 * =========================================================================
 * CLASE MAESTRA: AplicacionMuseo (Orquestador Guiado por Eventos)
 * =========================================================================
 */
class AplicacionMuseo {
    constructor(contenedorId) {
         const esGitHubPages = window.location.hostname.includes('github.io');
        const repoName = esGitHubPages ? window.location.pathname.split('/')[1] : '';
        const baseRuta = esGitHubPages ? `/${repoName}/` : '';
        
        this.RUTAS_EXCEL = {
            'inah_museos': `${baseRuta}data/insh_museos.xlsx`,
            'monumentos': `${baseRuta}data/monumentos.xlsx`,
            'objetos_externos': `${baseRuta}data/objetos _externos.xlsx`,
            'solicitudes': `${baseRuta}data/solicitudes.xlsx`
        };

        console.log("Rutas de Excel configuradas para el entorno actual:", this.RUTAS_EXCEL);  
    
    }

    inicializarEstructuraBase() {
        this.root.innerHTML = `
            <div class="container py-5">
                <h1 class="text-center mb-4 text-warning fw-bold">Entorno Cultural 3D Clicker</h1>
                <p class="text-center text-muted mb-5">Haz clic directamente sobre los elementos visuales del escenario para auditar el Excel mediante metadatos automáticos.</p>

                <div class="row justify-content-center gap-4 mb-5" id="escenario-3d-simulado">
                    
                    <div class="col-auto text-center">
                        <img src="https://images.unsplash.com/photo-1566121318318-7fba26543b35?w=200&q=80" 
                             class="objeto-clicker-3d" 
                             data-id="1" data-origen="inah_museos" data-visor="loteria"
                             alt="Museo INAH">
                        <small class="d-block text-muted mt-1">Museo INAH (Clicker)</small>
                    </div>

                    <div class="col-auto text-center">
                        <img src="https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=200&q=80" 
                             class="objeto-clicker-3d" 
                             data-id="2" data-origen="monumentos" data-visor="ficha"
                             alt="Monumento">
                        <small class="d-block text-muted mt-1">Monumento Histórico</small>
                    </div>

                    <div class="col-auto text-center">
                        <img src="https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=200&q=80" 
                             class="objeto-clicker-3d" 
                             data-id="3" data-origen="objetos_externos" data-visor="loteria"
                             alt="Objeto de Arte">
                        <small class="d-block text-muted mt-1">Pieza Externa</small>
                    </div>

                    <div class="col-auto text-center">
                        <img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&q=80" 
                             class="objeto-clicker-3d" 
                             data-id="4" data-origen="solicitudes" data-visor="ficha"
                             alt="Manuscrito">
                        <small class="d-block text-muted mt-1">Documento Antiguo</small>
                    </div>

                </div>

                <div id="status-carga" class="text-center mb-4 text-info small fw-bold font-monospace"></div>
                
                <div class="inventory-section p-4 rounded mb-5">
                    <h3 class="text-warning mb-3 border-bottom border-secondary pb-2">🎒 Mi Inventario Cultural (<span id="inv-count">0</span>)</h3>
                    <div class="row gap-3 justify-content-start" id="inventario-items-container">
                        <p class="text-muted fst-italic" id="inv-vacio-msg">El inventario está vacío. Toca un objeto del escenario para coleccionarlo.</p>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="acervoPopupModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-transparent border-0 position-relative">
                        <button type="button" class="btn-close-custom" data-bs-dismiss="modal" aria-label="Close">&times;</button>
                        <div id="popup-visor-body" class="d-flex flex-column align-items-center"></div>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="geminiChatModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered text-dark">
                    <div class="modal-content bg-light shadow-lg">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title text-warning" id="modal-titulo-acervo">Chat con Gemini</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <input type="hidden" id="modal-instancia-key">
                            <div id="modal-chat-box" class="p-3 border rounded bg-white mb-3 shadow-inner" style="max-height: 280px; overflow-y: auto;"></div>
                            <div class="form-group">
                                <label class="form-label fw-bold text-secondary">Aporta la información faltante para el Excel:</label>
                                <textarea id="modal-user-text" class="form-control border-secondary" rows="3" placeholder="Escribe los datos históricos aquí..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-warning fw-bold" onclick="AppMuseo.ejecutarEnvioAporte()">Escanear con IA</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * RESOLUCIÓN AL PROBLEMA: Escuchador Global Automático (Delegación de Eventos)
     * Captura el click en cualquier imagen con la clase 'objeto-clicker-3d' y extrae sus argumentos solos
     */
    activarEscuchadorGlobal() {
        this.root.addEventListener('click', (evento) => {
            const elementoTocado = evento.target;

            // Verificamos si el usuario clickeó una de nuestras imágenes interactivas
            if (elementoTocado.classList.contains('objeto-clicker-3d')) {
                
                // ¡Magía! Extracción automática de argumentos desde el elemento HTML sin escribirlos a mano
                const id = parseInt(elementoTocado.getAttribute('data-id'));
                const origen = elementoTocado.getAttribute('data-origen');
                const tipoVisor = elementoTocado.getAttribute('data-visor');

                // Disparamos la carga asíncrona pasándole las variables extraídas automáticamente
                this.solicitarCargaExcel(id, origen, tipoVisor);
            }
        });
    }

    solicitarCargaExcel(id, origen, tipoVisor) {
        const key = `${origen}_${id}`;
        
        if (this.instanciasTarjetas[key]) {
            this.instanciasTarjetas[key].desplegarEnPopup();
            return;
        }

        const rutaArchivo = this.RUTAS_EXCEL[origen];
        const statusDiv = document.getElementById('status-carga');
        statusDiv.innerText = `Cargando automáticamente desde: ${rutaArchivo}...`;

        fetch(rutaArchivo)
            .then(response => {
                if (!response.ok) throw new Error(`No se pudo leer el archivo en ${rutaArchivo}`);
                return response.arrayBuffer();
            })
            .then(buffer => {
                const dataBinaria = new Uint8Array(buffer);
                const libroExcel = XLSX.read(dataBinaria, { type: 'array' });
                
                const primeraHojaNombre = libroExcel.SheetNames[0];
                const hojaCalculoActiva = libroExcel.Sheets[primeraHojaNombre];
                const filasDeExcelJSON = XLSX.utils.sheet_to_json(hojaCalculoActiva);

                const filaEncontrada = filasDeExcelJSON.find(f => {
                    const idCelda = f['id_museo'] || f['id_monumento'] || f['id_item'] || f['id_solicitud'] || f['id'];
                    return parseInt(idCelda) === id;
                });

                if (filaEncontrada) {
                    this.instanciasTarjetas[key] = new TarjetaAcervo(id, origen, filaEncontrada, tipoVisor, this);
                    statusDiv.innerText = `¡Objeto sincronizado con Excel de forma transparente!`;
                    this.instanciasTarjetas[key].desplegarEnPopup();
                } else {
                    statusDiv.innerText = `Error: No se localizó el ID ${id} en ${rutaArchivo}.`;
                }
            })
            .catch(error => {
                statusDiv.innerText = `Error local: ${error.message}`;
                console.error(error);
            });
    }

    ejecutarEnvioAporte() {
        const llaveCompuesta = document.getElementById('modal-instancia-key').value;
        const entradaTexto = document.getElementById('modal-user-text').value;
        const chatBox = document.getElementById('modal-chat-box');

        if (!entradaTexto.trim()) return;

        chatBox.innerHTML += `
            <div class="p-2 mb-2 bg-white rounded text-dark text-end shadow-sm">
                <span class="badge bg-secondary mb-1">Tu Registro</span><br>
                <span>${entradaTexto}</span>
            </div>
        `;

        const respuestaValidacion = this.instanciasTarjetas[llaveCompuesta].analizarYActualizarCeldaExcel(entradaTexto);

        setTimeout(() => {
            chatBox.innerHTML += `
                <div class="p-2 mb-2 border border-warning rounded bg-dark text-warning small">
                    <strong>Gemini Analysis Report:</strong><br>${respuestaValidacion}
                </div>
            `;
            document.getElementById('modal-user-text').value = "";
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 400);
    }
}


/**
 * =========================================================================
 * CLASE HIJA / COMPONENTE: TarjetaAcervo (Conserva el comportamiento intacto)
 * =========================================================================
 */
class TarjetaAcervo {
    constructor(id, origen, datosFila, tipoVisor, appMaestra) {
        this.id = id;
        this.origen = origen; 
        this.tipoVisor = tipoVisor;
        this.datosOriginales = datosFila;
        this.app = appMaestra; 
        this.guardado = false; 

        this.UI = {
            titulo: '',
            imagen: '',
            linea1: '',
            linea2: '',
            campoEscaneable: '',
            nombreColumnaOriginal: ''
        };

        this.procesarCabecerasExcelEspecificas();
    }

    procesarCabecerasExcelEspecificas() {
        const fila = this.datosOriginales;

        switch (this.origen) {
            case 'inah_museos':
                this.UI.titulo = fila['Nom_Museo'] || "Museo sin Nombre";
                this.UI.imagen = "https://images.unsplash.com/photo-1566121318318-7fba26543b35?w=400&q=80";
                this.UI.linea1 = `Entidad: ${fila['entidad'] || 'No especificada'}`;
                this.UI.linea2 = `Condición: ${fila['condicion'] || 'Abierto'}`;
                this.UI.nombreColumnaOriginal = 'descripcion_actividades';
                break;

            case 'monumentos':
                this.UI.titulo = fila['denominacion'] || "Monumento Histórico";
                this.UI.imagen = "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=400&q=80";
                this.UI.linea1 = `Municipio: ${fila['municipio'] || 'N/D'}`;
                this.UI.linea2 = `Estado: ${fila['estado'] || 'N/D'}`;
                this.UI.nombreColumnaOriginal = 'sintesis_historica';
                break;

            case 'objetos_externos':
                this.UI.titulo = fila['nombre_objeto'] || "Pieza de Exposición";
                this.UI.imagen = "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=400&q=80";
                this.UI.linea1 = `Colección: ${fila['coleccion_origen'] || 'Externa'}`;
                this.UI.linea2 = `Periodo: ${fila['periodo'] || 'Desconocido'}`;
                this.UI.nombreColumnaOriginal = 'estado_conservacion';
                break;

            case 'solicitudes':
                this.UI.titulo = `Código Doc: ${fila['codigo_documento'] || 'Doc-S/N'}`;
                this.UI.imagen = "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80";
                this.UI.linea1 = `Usuario: ${fila['nombre_usuario'] || 'Anónimo'}`;
                this.UI.linea2 = `Fecha: ${fila['fecha_registro'] || 'Reciente'}`;
                this.UI.nombreColumnaOriginal = 'texto_transcrito';
                break;
        }

        const valorCelda = fila[this.UI.nombreColumnaOriginal];
        this.UI.campoEscaneable = (valorCelda !== undefined && valorCelda !== null) ? String(valorCelda).trim() : "sin informacion";

        if (this.UI.campoEscaneable === '') {
            this.UI.campoEscaneable = "sin informacion";
        }
    }

    desplegarEnPopup() {
        const visorContainer = document.getElementById('popup-visor-body');
        
        let diseñoHTML = '';
        if (this.tipoVisor === 'loteria') {
            diseñoHTML = `
                <div class="loteria-card-container" onclick="this.classList.toggle('flipped')">
                    <div class="loteria-card">
                        <div class="front text-white p-3">
                            <div>
                                <h3 class="text-warning fw-bold m-0">LOTERÍA</h3>
                                <p class="text-uppercase small text-muted tracking-wider">${this.origen.replace('_', ' ')}</p>
                                <span class="badge bg-warning text-dark">PK ID: ${this.id}</span>
                            </div>
                        </div>
                        <div class="back rounded overflow-hidden">
                            <img src="${this.UI.imagen}" class="w-100 h-100" style="object-fit: cover;">
                            <div class="loteria-title">${this.UI.titulo}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (this.tipoVisor === 'ficha') {
            diseñoHTML = `
                <div class="card bg-dark text-white border-secondary" style="width: 240px; border-radius: 12px;">
                    <img src="${this.UI.imagen}" class="card-img-top" style="height: 140px; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                    <div class="card-body d-flex flex-column justify-content-between" style="padding: 12px;">
                        <div>
                            <span class="badge bg-warning text-dark mb-2 font-monospace" style="font-size:0.65rem;">${this.origen.toUpperCase()}</span>
                            <h6 class="card-title text-warning fw-bold mb-1">${this.UI.titulo}</h6>
                            <p class="card-text text-muted mb-2" style="font-size: 0.75rem; line-height:1.3;">
                                ${this.UI.linea1}<br>${this.UI.linea2}
                            </p>
                        </div>
                        <div class="border-top border-secondary pt-2">
                            <label class="text-warning fw-bold m-0" style="font-size:0.65rem; display:block;">CELDA ACTUAL EXCEL:</label>
                            <span id="dom-excel-${this.origen}-${this.id}" class="text-light font-monospace break-word" style="font-size: 0.75rem;">
                                ${this.UI.campoEscaneable}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }

        const txtBotonInventario = this.guardado ? "🎒 Guardado en Inventario" : "📥 Guardar en Inventario";
        const claseBotonInventario = this.guardado ? "btn-secondary disabled" : "btn-success";

        const barraAcciones = `
            <div class="w-100 d-flex flex-column gap-2 mt-3" style="max-width: 240px;">
                <button class="btn ${claseBotonInventario} btn-sm fw-bold shadow" id="btn-inv-${this.origen}-${this.id}" onclick="AppMuseo.instanciasTarjetas['${this.origen}_${this.id}'].inyectarAInventario()">
                    ${txtBotonInventario}
                </button>
                <button class="btn btn-outline-warning btn-sm fw-bold shadow" onclick="AppMuseo.instanciasTarjetas['${this.origen}_${this.id}'].abrirChatGemini()">
                    🗣️ Gemini AI Chat
                </button>
            </div>
        `;

        visorContainer.innerHTML = diseñoHTML + barraAcciones;

        const modalPopup = new bootstrap.Modal(document.getElementById('acervoPopupModal'));
        modalPopup.show();
    }

    inyectarAInventario() {
        if (this.guardado) return;

        this.guardado = true;
        
        this.app.inventarioMemoria.push({
            key: `${this.origen}_${this.id}`,
            titulo: this.UI.titulo,
            origen: this.origen
        });

        const btnInV = document.getElementById(`btn-inv-${this.origen}-${this.id}`);
        if(btnInV) {
            btnInV.innerText = "🎒 Guardado en Inventario";
            btnInV.className = "btn btn-secondary btn-sm fw-bold shadow disabled";
        }

        this.actualizarUIInventario();
    }

    actualizarUIInventario() {
        const cajaInventario = document.getElementById('inventario-items-container');
        const mensajeVacio = document.getElementById('inv-vacio-msg');
        const contador = document.getElementById('inv-count');

        if(mensajeVacio) mensajeVacio.remove();
        contador.innerText = this.app.inventarioMemoria.length;

        cajaInventario.innerHTML = '';
        this.app.inventarioMemoria.forEach(item => {
            const chip = document.createElement('div');
            chip.className = "col-auto inventory-chip animate-fade-in";
            chip.innerHTML = `
                <div onclick="AppMuseo.instanciasTarjetas['${item.key}'].desplegarEnPopup()">
                    <span class="badge bg-warning text-dark me-1" style="font-size:0.6rem;">${item.origen.toUpperCase()}</span>
                    <strong class="text-white small d-block text-truncate" style="max-width:140px;">${item.titulo}</strong>
                </div>
            `;
            cajaInventario.appendChild(chip);
        });
    }

    abrirChatGemini() {
        const modalPopup = bootstrap.Modal.getInstance(document.getElementById('acervoPopupModal'));
        if(modalPopup) modalPopup.hide();

        document.getElementById('modal-titulo-acervo').innerText = `Gemini AI Engine: ${this.UI.titulo}`;
        document.getElementById('modal-instancia-key').value = `${this.origen}_${this.id}`;

        const chatBox = document.getElementById('modal-chat-box');
        let opinionGemini = `Procesando fila de Excel activa con POO. Origen de metadatos: [${this.origen.toUpperCase()}]. Atributos consolidados: ${this.UI.linea1} | ${this.UI.linea2}. `;
        
        if (this.UI.campoEscaneable.toLowerCase() === 'sin informacion') {
            opinionGemini += `Aviso del Auditor: La columna original de Excel [${this.UI.nombreColumnaOriginal}] no posee datos válidos ("sin informacion"). Por favor, introduce información fidedigna para actualizar el libro de cálculo inmediatamente.`;
        } else {
            opinionGemini += `El estado actual del registro dice: "${this.UI.campoEscaneable}".`;
        }

        chatBox.innerHTML = `
            <div class="p-2 mb-2 bg-light rounded text-dark border-start border-4 border-warning">
                <span class="badge bg-dark mb-1">Gemini Strict Mode</span><br>
                <span>${opinionGemini}</span>
            </div>
        `;

        const modalChat = new bootstrap.Modal(document.getElementById('geminiChatModal'));
        modalChat.show();
    }

    analizarYActualizarCeldaExcel(textoUsuario) {
        if (this.UI.campoEscaneable.toLowerCase() === 'sin informacion') {
            if (textoUsuario.trim().length > 3) {
                this.UI.campoEscaneable = textoUsuario;
                this.datosOriginales[this.UI.nombreColumnaOriginal] = textoUsuario;
                return `Análisis Sintáctico Exitoso. Detecté la bandera vacía en la columna [${this.UI.nombreColumnaOriginal}]. Tu aporte fue integrado en la fila correspondiente al ID ${this.id} dentro del libro de cálculo en ejecución.`;
            }
            return "Aporte descartado: La información suministrada es insuficiente o demasiado corta.";
        }
        return `Acción bloqueada. La columna de Excel [${this.UI.nombreColumnaOriginal}] ya cuenta con un registro sólido de base.`;
    }
}
