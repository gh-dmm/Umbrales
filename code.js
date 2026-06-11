/**
 * Estructura de Memoria Dinámica Global para el Inventario del Clicker Cultural
 */
window.inventarioMemoria = [];
window.instanciasTarjetas = {};

class TarjetaAcervo {
    constructor(id, origen, datosFila, tipoVisor = 'loteria') {
        this.id = id;
        this.origen = origen; 
        this.tipoVisor = tipoVisor;
        this.datosOriginales = datosFila;
        this.guardado = false; // Estado independiente de control de inventario

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

    /**
     * Muestra la información dentro del POPUP de Bootstrap en lugar de inyectarlo en el DOM estático
     */
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

        // Definición de la botonera inferior del Popup
        const txtBotonInventario = this.guardado ? "🎒 Guardado en Inventario" : "📥 Guardar en Inventario";
        const claseBotonInventario = this.guardado ? "btn-secondary disabled" : "btn-success";

        const barraAcciones = `
            <div class="w-100 d-flex flex-column gap-2 mt-3" style="max-width: 240px;">
                <button class="btn ${claseBotonInventario} btn-sm fw-bold shadow" id="btn-inv-${this.origen}-${this.id}" onclick="window.instanciasTarjetas['${this.origen}_${this.id}'].inyectarAInventario()">
                    ${txtBotonInventario}
                </button>
                <button class="btn btn-outline-warning btn-sm fw-bold shadow" onclick="window.instanciasTarjetas['${this.origen}_${this.id}'].abrirChatGemini()">
                    🗣️ Gemini AI Chat
                </button>
            </div>
        `;

        visorContainer.innerHTML = diseñoHTML + barraAcciones;

        // Lanzar el modal Popup
        const modalPopup = new bootstrap.Modal(document.getElementById('acervoPopupModal'));
        modalPopup.show();
    }

    /**
     * Gestión Dinámica de Memoria: Guarda el objeto en el inventario global de forma independiente
     */
    inyectarAInventario() {
        if (this.guardado) return;

        this.guardado = true;
        
        // Almacenamos la referencia completa del objeto en la memoria dinámica global
        window.inventarioMemoria.push({
            key: `${this.origen}_${this.id}`,
            titulo: this.UI.titulo,
            origen: this.origen
        });

        // Modificar el estado del botón dentro del Popup vivo
        const btnInV = document.getElementById(`btn-inv-${this.origen}-${this.id}`);
        if(btnInV) {
            btnInV.innerText = "🎒 Guardado en Inventario";
            btnInV.className = "btn btn-secondary btn-sm fw-bold shadow disabled";
        }

        // Actualizar visualmente el bloque del inventario de la app
        this.actualizarUIInventario();
    }

    actualizarUIInventario() {
        const cajaInventario = document.getElementById('inventario-items-container');
        const mensajeVacio = document.getElementById('inv-vacio-msg');
        const contador = document.getElementById('inv-count');

        if(mensajeVacio) mensajeVacio.remove();
        contador.innerText = window.inventarioMemoria.length;

        // Re-renderizar todos los chips usando la memoria viva del sistema
        cajaInventario.innerHTML = '';
        window.inventarioMemoria.forEach(item => {
            const chip = document.createElement('div');
            chip.className = "col-auto inventory-chip animate-fade-in";
            chip.innerHTML = `
                <div onclick="abrirDesdeInventario('${item.key}')">
                    <span class="badge bg-warning text-dark me-1" style="font-size:0.6rem;">${item.origen.toUpperCase()}</span>
                    <strong class="text-white small d-block text-truncate" style="max-width:140px;">${item.titulo}</strong>
                </div>
            `;
            cajaInventario.appendChild(chip);
        });
    }

    abrirChatGemini() {
        // Cerrar temporalmente el popup del visor para no encimar modales
        const modalPopup = bootstrap.Modal.getInstance(document.getElementById('acervoPopupModal'));
        if(modalPopup) modalPopup.hide();

        document.getElementById('modal-titulo-acervo').innerText = `Gemini AI Engine: ${this.UI.titulo}`;
        document.getElementById('modal-instancia-key').value = `${this.origen}_${this.id}`;

        const chatBox = document.getElementById('modal-chat-box');
        let opinionGemini = `Procesando fila de Excel activa. Origen de metadatos: [${this.origen.toUpperCase()}]. Atributos consolidados: ${this.UI.linea1} | ${this.UI.linea2}. `;
        
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

                console.log("¡Estructura de la fila Excel modificada al 100% en memoria viva!", this.datosOriginales);
                return `Análisis Sintáctico Exitoso. Detecté la bandera vacía en la columna [${this.UI.nombreColumnaOriginal}]. Tu aporte fue integrado en la fila correspondiente al ID ${this.id} dentro del libro de cálculo en ejecución.`;
            }
            return "Aporte descartado: La información suministrada es insuficiente o demasiado corta.";
        }
        return `Acción bloqueada. La columna de Excel [${this.UI.nombreColumnaOriginal}] ya cuenta con un registro sólido de base.`;
    }
}

/**
 * MAPA DE RUTAS ASÍNCRONAS LOCALES
 */
const RUTAS_EXCEL = {
    'inah_museos': 'data/inah_museos.xlsx',
    'monumentos': 'data/monumentos.xlsx',
    'objetos_externos': 'data/objetos_externos.xlsx',
    'solicitudes': 'data/solicitudes.xlsx'
};

function cargarRutaAutomatica(id, origen, tipoVisor) {
    const key = `${origen}_${id}`;
    
    // Si ya existe en memoria el objeto instanciado, simplemente lo volvemos a desplegar en Popup
    if (window.instanciasTarjetas[key]) {
        window.instanciasTarjetas[key].desplegarEnPopup();
        return;
    }

    const rutaArchivo = RUTAS_EXCEL[origen];
    const statusDiv = document.getElementById('status-carga');
    statusDiv.innerText = `Pidiendo de forma automática a: ${rutaArchivo}...`;

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
                window.instanciasTarjetas[key] = new TarjetaAcervo(id, origen, filaEncontrada, tipoVisor);
                statusDiv.innerText = `¡Cargado con éxito! Desplegando visor...`;
                window.instanciasTarjetas[key].desplegarEnPopup();
            } else {
                statusDiv.innerText = `Error: No se localizó el ID ${id} en ${rutaArchivo}.`;
            }
        })
        .catch(error => {
            statusDiv.innerText = `Error de conexión local: ${error.message}`;
        });
}

function abrirDesdeInventario(key) {
    if (window.instanciasTarjetas[key]) {
        window.instanciasTarjetas[key].desplegarEnPopup();
    }
}

function limpiarTablero() {
    document.getElementById('inventario-items-container').innerHTML = '<p class="text-muted fst-italic" id="inv-vacio-msg">El inventario está vacío. Abre un acervo y agrégalo para guardarlo en la memoria dinámica.</p>';
    document.getElementById('status-carga').innerText = '';
    document.getElementById('inv-count').innerText = "0";
    window.instanciasTarjetas = {};
    window.inventarioMemoria = [];
}

function ejecutarEnvioAporte() {
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

    const respuestaValidacion = window.instanciasTarjetas[llaveCompuesta].analizarYActualizarCeldaExcel(entradaTexto);

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

// Vinculaciones globales
window.cargarRutaAutomatica = cargarRutaAutomatica;
window.abrirDesdeInventario = abrirDesdeInventario;
window.limpiarTablero = limpiarTablero;