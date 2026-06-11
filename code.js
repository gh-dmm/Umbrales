/**
 * Clase Reutilizable TarjetaAcervo - Procesa y Modifica Archivos de Excel de la carpeta data/
 */
class TarjetaAcervo {
    constructor(id, origen, datosFila, tipoVisor = 'loteria', contenedorId = 'tarjetas-container') {
        this.id = id;
        this.origen = origen; 
        this.tipoVisor = tipoVisor;
        this.contenedor = document.getElementById(contenedorId);
        this.datosOriginales = datosFila; // Almacén en memoria viva de la fila real

        // Estructura limpia para renderizado de interfaz
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

    /**
     * SWITCH DE CONTROL: Manipulación de cabeceras de columnas específicas según tus 4 archivos
     */
    procesarCabecerasExcelEspecificas() {
        const fila = this.datosOriginales;

        switch (this.origen) {
            case 'inah_museos':
                this.UI.titulo = fila['Nom_Museo'] || "Museo sin Nombre";
                this.UI.imagen = "https://images.unsplash.com/photo-1566121318318-7fba26543b35?w=400&q=80";
                this.UI.linea1 = `Entidad: ${fila['entidad'] || fila['estado'] || 'No especificada'}`;
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

        // Recuperar y sanitizar el valor de la celda auditada
        const valorCelda = fila[this.UI.nombreColumnaOriginal];
        this.UI.campoEscaneable = (valorCelda !== undefined && valorCelda !== null) ? String(valorCelda).trim() : "sin informacion";

        if (this.UI.campoEscaneable === '') {
            this.UI.campoEscaneable = "sin informacion";
        }

        this.renderizar();
    }

    renderizar() {
        const nodo = document.createElement('div');
        nodo.className = "col-auto mb-4 d-flex flex-column align-items-center";
        nodo.id = `nodo-${this.origen}-${this.id}`;

        let diseño = '';

        if (this.tipoVisor === 'loteria') {
            diseño = `
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
            diseño = `
                <div class="card bg-dark text-white border-secondary h-100" style="width: 240px; border-radius: 12px;">
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

        const btn = `<button class="btn btn-outline-warning btn-sm mt-3 w-100 fw-bold" onclick="window.instanciasTarjetas['${this.origen}_${this.id}'].abrirChatGemini()">Interactuar con Gemini</button>`;
        nodo.innerHTML = diseño + btn;
        this.contenedor.appendChild(nodo);
    }

    abrirChatGemini() {
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

        const modal = new bootstrap.Modal(document.getElementById('geminiChatModal'));
        modal.show();
    }

    /**
     * ESCÁNER INTELIGENTE: Si el campo en Excel marcaba "sin informacion", parcha e inyecta la información
     */
    analizarYActualizarCeldaExcel(textoUsuario) {
        if (this.UI.campoEscaneable.toLowerCase() === 'sin informacion') {
            if (textoUsuario.trim().length > 3) {
                
                this.UI.campoEscaneable = textoUsuario;
                this.datosOriginales[this.UI.nombreColumnaOriginal] = textoUsuario;

                const nodoHTMLText = document.getElementById(`dom-excel-${this.origen}-${this.id}`);
                if (nodoHTMLText) nodoHTMLText.innerText = textoUsuario;

                console.log("¡Estructura de la fila Excel modificada al 100% en memoria viva!", this.datosOriginales);
                return `Análisis Sintáctico Exitoso. Detecté la bandera vacía en la columna [${this.UI.nombreColumnaOriginal}]. Tu aporte fue integrado en la fila correspondiente al ID ${this.id} dentro del libro de cálculo en ejecución.`;
            }
            return "Aporte descartado: La información suministrada es insuficiente o demasiado corta.";
        }
        return `Acción bloqueada. La columna de Excel [${this.UI.nombreColumnaOriginal}] ya cuenta con un registro sólido de base. Se omitió la edición para evitar pérdida de datos patrimoniales.`;
    }
}

// Repositorio global de instancias indexado
window.instanciasTarjetas = {};


/**
 * MAPA DE RUTAS AUTOMÁTICAS: Apunta a los archivos normalizados en tu subcarpeta 'data/'
 */
const RUTAS_EXCEL = {
    'inah_museos': 'data/inah_museos.xlsx',
    'monumentos': 'data/monumentos.xlsx',
    'objetos_externos': 'data/objetos_externos.xlsx',
    'solicitudes': 'data/solicitudes.xlsx'
};
/**
 * Carga asíncrona binaria automatizada desde la carpeta data/
 */
function cargarRutaAutomatica(id, origen, tipoVisor) {
    const key = `${origen}_${id}`;
    if (window.instanciasTarjetas[key]) {
        alert("Esta instancia ya fue renderizada en el tablero.");
        return;
    }

    const rutaArchivo = RUTAS_EXCEL[origen];
    const statusDiv = document.getElementById('status-carga');
    statusDiv.innerText = `Pidiendo archivo de forma asíncrona a: ${rutaArchivo}...`;

    // AJAX asíncrono nativo para descargar el binario desde la subcarpeta
    fetch(rutaArchivo)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No se pudo leer el archivo en ${rutaArchivo}. Verifica que exista en tu carpeta local 'data/'.`);
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            const dataBinaria = new Uint8Array(buffer);
            const libroExcel = XLSX.read(dataBinaria, { type: 'array' });
            
            // Procesamiento de SheetJS
            const primeraHojaNombre = libroExcel.SheetNames[0];
            const hojaCalculoActiva = libroExcel.Sheets[primeraHojaNombre];
            const filasDeExcelJSON = XLSX.utils.sheet_to_json(hojaCalculoActiva);

            // Búsqueda matemática de la fila por su Primary Key (ID) real de tus archivos
            const filaEncontrada = filasDeExcelJSON.find(f => {
                const idCelda = f['id_museo'] || f['id_monumento'] || f['id_item'] || f['id_solicitud'] || f['id'];
                return parseInt(idCelda) === id;
            });

            if (filaEncontrada) {
                // Instanciar el objeto pasándole la fila real encontrada de forma automática
                window.instanciasTarjetas[key] = new TarjetaAcervo(id, origen, filaEncontrada, tipoVisor);
                statusDiv.innerText = `¡Registro ID ${id} cargado e instanciado al 100% desde ${rutaArchivo}!`;
            } else {
                statusDiv.innerText = `Error: No se localizó el ID ${id} dentro del archivo ${rutaArchivo}.`;
            }
        })
        .catch(error => {
            console.error(error);
            statusDiv.innerText = `Error de conexión local: ${error.message}`;
        });
}

// Vinculación global explícita
window.cargarRutaAutomatica = cargarRutaAutomatica;

function limpiarTablero() {
    document.getElementById('tarjetas-container').innerHTML = '';
    document.getElementById('status-carga').innerText = '';
    window.instanciasTarjetas = {};
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