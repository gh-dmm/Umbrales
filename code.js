/**
 * =========================================================================
 * CLASE: InventarioCultural (Manejo de Datos y Conexión con la Vitrina)
 * =========================================================================
 */
class InventarioCultural {
    constructor() {
        this.items = []; 
    }

    agregar(key, titulo, origen, imagen) {
        if (this.existe(key)) return false;
        this.items.push({ key, titulo, origen, imagen, fecha: new Date().toLocaleString() });
        console.log(`🎒 [Inventario de Cartón] Item recolectado: ${titulo}`);
        return true;
    }

    existe(key) {
        return this.items.some(item => item.key === key);
    }

    obtenerTodos() {
        return this.items;
    }
}

/**
 * =========================================================================
 * CLASE MAESTRA: AplicacionMuseo (Controlador de Escenarios del HTML)
 * =========================================================================
 */
class AplicacionMuseo {
    constructor() {
        // 1. Inicialización de la memoria e instancias
        this.instanciasTarjetas = {};
        this.inventario = new InventarioCultural();
        
        // 2. Detección automática del entorno (Localhost vs GitHub Pages)
        const esGitHubPages = window.location.hostname.includes('github.io');
        const repoName = esGitHubPages ? window.location.pathname.split('/')[1] : '';
        const baseRuta = esGitHubPages ? `/${repoName}/` : '';
        
        // 3. Tus archivos de Excel reales mapeados letra por letra
        this.RUTAS_EXCEL = {
            'inah_museos': `${baseRuta}data/inah_museos.xlsx`,
            'monumentos': `${baseRuta}data/monumentos.xlsx`,
            'objetos_externos': `${baseRuta}data/objetos_externos.xlsx`,
            'solicitudes': `${baseRuta}data/solicitudes.xlsx`
        };

        console.log("📦 [Cartón Engine] Inicializado. Rutas listas:", this.RUTAS_EXCEL);  

        // 4. Activamos los escuchadores automáticos de clicks
        this.activarEscuchadorGlobal();
        this.actualizarVitrinaGrafica(); // Render inicial vacío
    }

    /**
     * MÁQUINA DE ESTADOS REACTIVA:
     * Oculta y muestra los contenedores que tú ya declaraste manualmente en tu HTML
     */
    cambiarEscenario(destinoId) {
        // Buscamos todas las capas de escenarios en tu HTML
        const cuartos = document.querySelectorAll('.escenario-cuarto');
        
        // Ocultamos todas
        cuartos.forEach(cuarto => {
            cuarto.classList.add('d-none');
        });

        // Mostramos el cuarto específico seleccionado por el botón del HTML
        const cuartoDestino = document.getElementById(`escenario-${destinoId}`);
        if (cuartoDestino) {
            cuartoDestino.classList.remove('d-none');
            console.log(`🚶 Desplazamiento multidireccional hacia: escenario-${destinoId}`);
        } else {
            console.warn(`[Error de Escenario] No existe un contenedor con ID: escenario-${destinoId}`);
        }

        // Si el usuario decidió entrar a la casa, forzamos actualización de la vitrina
        if (destinoId === 'casa') {
            this.actualizarVitrinaGrafica();
        }
    }

    /**
     * Captura de clicks inteligente en imágenes del diorama
     */
    activarEscuchadorGlobal() {
        document.addEventListener('click', (evento) => {
            const elementoTocado = evento.target;
            if (elementoTocado.classList.contains('objeto-clicker-3d')) {
                const id = parseInt(elementoTocado.getAttribute('data-id'));
                const origen = elementoTocado.getAttribute('data-origen');
                const tipoVisor = elementoTocado.getAttribute('data-visor');
                this.solicitarCargaExcel(id, origen, tipoVisor);
            }
        });
    }

    /**
     * Lector asíncrono SheetJS para tus archivos de Excel
     */
    solicitarCargaExcel(id, origen, tipoVisor) {
        const key = `${origen}_${id}`;
        if (this.instanciasTarjetas[key]) {
            this.instanciasTarjetas[key].desplegarEnPopup();
            return;
        }

        const rutaArchivo = this.RUTAS_EXCEL[origen];
        const statusDiv = document.getElementById('status-carga');
        if(statusDiv) statusDiv.innerText = `Abriendo caja de cartón: ${origen.toUpperCase()}...`;

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
                    if(statusDiv) statusDiv.innerText = '';
                    this.instanciasTarjetas[key].desplegarEnPopup();
                } else {
                    if(statusDiv) statusDiv.innerText = `Error: ID ${id} no encontrado en Excel.`;
                }
            })
            .catch(error => {
                if(statusDiv) statusDiv.innerText = `Fallo al jalar datos de las celdas.`;
                console.error(error);
            });
    }

    /**
     * Dibuja los objetos guardados dentro de los estantes de la vitrina en el cuarto de la casa
     */
    actualizarVitrinaGrafica() {
        const contenedor = document.getElementById('contenedor-vitrina-items');
        if (!contenedor) return;

        const listaItems = this.inventario.obtenerTodos();

        if (listaItems.length === 0) {
            contenedor.innerHTML = `<p class="text-dark fst-italic text-center w-100 p-4 m-0 fw-bold">📦 La vitrina está vacía. Recorta objetos en las salas de exploración.</p>`;
            return;
        }

        contenedor.innerHTML = '';
        listaItems.forEach(item => {
            const slot = document.createElement('div');
            slot.className = "col-6 col-sm-4 col-md-3 text-center mb-3";
            slot.innerHTML = `
                <div class="carton-item-slot" onclick="AppMuseo.instanciasTarjetas['${item.key}'].desplegarEnPopup()">
                    <div class="carton-preview-frame">
                        <img src="${item.imagen}" class="carton-img-render">
                    </div>
                    <span class="carton-tag-mini">${item.origen.replace('_', ' ')}</span>
                    <strong class="carton-text-titulo text-truncate d-block">${item.titulo}</strong>
                </div>
            `;
            contenedor.appendChild(slot);
        });
    }

    ejecutarEnvioAporte() {
        const llaveCompuesta = document.getElementById('modal-instancia-key').value;
        const entradaTexto = document.getElementById('modal-user-text').value;
        const chatBox = document.getElementById('modal-chat-box');

        if (!entradaTexto.trim()) return;

        chatBox.innerHTML += `<div class="p-2 mb-2 bg-dark text-white rounded text-end shadow-sm"><span>${entradaTexto}</span></div>`;
        const respuestaValidacion = this.instanciasTarjetas[llaveCompuesta].analizarYActualizarCeldaExcel(entradaTexto);

        setTimeout(() => {
            chatBox.innerHTML += `
                <div class="p-2 mb-2 bg-warning-subtle text-dark border-start border-4 border-warning rounded">
                    <strong>Gemini AI Report:</strong><br>${respuestaValidacion}
                </div>`;
            document.getElementById('modal-user-text').value = "";
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 400);
    }
}

/**
 * =========================================================================
 * CLASE COMPONENTE: TarjetaAcervo
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

        this.UI = { titulo: '', imagen: '', linea1: '', linea2: '', campoEscaneable: '', nombreColumnaOriginal: '' };
        this.procesarCabecerasExcelEspecificas();
    }

    procesarCabecerasExcelEspecificas() {
        const fila = this.datosOriginales;
        switch (this.origen) {
            case 'inah_museos':
                this.UI.titulo = fila['nombre'] || "Museo INAH";
                this.UI.imagen = "https://images.unsplash.com/photo-1566121318318-7fba26543b35?w=400&q=80";
                this.UI.linea1 = `Estado: ${fila['estado'] || 'N/A'}`;
                this.UI.linea2 = `Municipio: ${fila['municipio_localidad'] || 'N/A'}`;
                this.UI.nombreColumnaOriginal = 'condicion'; 
                break;
            case 'monumentos':
                this.UI.titulo = fila['nombre_actual'] || "Monumento";
                this.UI.imagen = "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=400&q=80";
                this.UI.linea1 = `Tipo: ${fila['tipo_monumento'] || 'Inmueble'}`;
                this.UI.linea2 = `Entidad: ${fila['entidad_federativa'] || 'N/D'}`;
                this.UI.nombreColumnaOriginal = 'nombre_original'; 
                break;
            case 'objetos_externos':
                this.UI.titulo = fila['objeto'] || "Pieza";
                this.UI.imagen = "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=400&q=80";
                this.UI.linea1 = `ID: ${this.id}`;
                this.UI.linea2 = `Colección Cultural`;
                this.UI.nombreColumnaOriginal = 'descripcion'; 
                break;
            case 'solicitudes':
                this.UI.titulo = fila['asunto'] || "Solicitud";
                this.UI.imagen = "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80";
                this.UI.linea1 = `Ingreso: ${fila['fecha_ingreso'] || 'N/A'}`;
                this.UI.linea2 = `Volumen: ${fila['total'] || 'N/A'}`;
                this.UI.nombreColumnaOriginal = 'observaciones'; 
                break;
        }

        const valorCelda = fila[this.UI.nombreColumnaOriginal];
        this.UI.campoEscaneable = (valorCelda !== undefined && valorCelda !== null) ? String(valorCelda).trim() : "sin informacion";

        if (this.UI.campoEscaneable === '' || this.UI.campoEscaneable.toLowerCase() === 'sin dato') {
            this.UI.campoEscaneable = "sin informacion";
        }
    }

    desplegarEnPopup() {
        const visorContainer = document.getElementById('popup-visor-body');
        const keyCompuesta = `${this.origen}_${this.id}`;
        
        let diseñoHTML = '';
        if (this.tipoVisor === 'loteria') {
            diseñoHTML = `
                <div class="carton-loteria-card" onclick="this.classList.toggle('flipped')">
                    <div class="loteria-card-inner">
                        <div class="card-front-carton">
                            <h3 class="fw-bold m-0 text-dark">LOTERÍA</h3>
                            <p class="small text-muted m-0">${this.origen.toUpperCase()}</p>
                            <span class="badge bg-dark mt-2">ID: ${this.id}</span>
                        </div>
                        <div class="card-back-carton">
                            <img src="${this.UI.imagen}" class="w-100 h-100 object-fit-cover rounded">
                            <div class="carton-card-label">${this.UI.titulo}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (this.tipoVisor === 'ficha') {
            diseñoHTML = `
                <div class="carton-ficha-technical">
                    <img src="${this.UI.imagen}" class="w-100 rounded mb-2" style="height:120px; object-fit:cover;">
                    <h5 class="fw-bold text-dark m-0">${this.UI.titulo}</h5>
                    <p class="text-muted small my-1">${this.UI.linea1}<br>${this.UI.linea2}</p>
                    <div class="border-top border-secondary pt-2 mt-2 font-monospace small text-start">
                        <strong>EXCEL CELL:</strong><br>
                        <span id="dom-excel-${this.origen}-${this.id}">${this.UI.campoEscaneable}</span>
                    </div>
                </div>
            `;
        }

        const estaGuardado = this.app.inventario.existe(keyCompuesta);
        const txtBtn = estaGuardado ? "🎒 Guardado en Vitrina" : "📥 Guardar en Vitrina";
        const claseBtn = estaGuardado ? "btn-secondary disabled" : "btn-warning text-dark border-dark";

        const barraAcciones = `
            <div class="w-100 d-flex flex-column gap-2 mt-3" style="max-width:240px;">
                <button class="btn ${claseBtn} btn-sm fw-bold" id="btn-inv-${this.origen}-${this.id}" onclick="AppMuseo.instanciasTarjetas['${this.origen}_${this.id}'].inyectarAVitrina()">
                    ${txtBtn}
                </button>
                <button class="btn btn-dark text-warning border-warning btn-sm fw-bold" onclick="AppMuseo.instanciasTarjetas['${this.origen}_${this.id}'].abrirChatGemini()">
                    🗣️ Gemini AI Chat
                </button>
            </div>
        `;

        visorContainer.innerHTML = diseñoHTML + barraAcciones;
        const modalPopup = new bootstrap.Modal(document.getElementById('acervoPopupModal'));
        modalPopup.show();
    }

    inyectarAVitrina() {
        const keyCompuesta = `${this.origen}_${this.id}`;
        const exito = this.app.inventario.agregar(keyCompuesta, this.UI.titulo, this.origen, this.UI.imagen);

        if (exito) {
            const btnInV = document.getElementById(`btn-inv-${this.origen}-${this.id}`);
            if(btnInV) {
                btnInV.innerText = "🎒 Guardado en Vitrina";
                btnInV.className = "btn btn-secondary btn-sm fw-bold shadow disabled";
            }
        }
    }

  async abrirChatGemini() {
        // 1. Liberamos el foco ARIA del botón para evitar congelamientos de Bootstrap [cite: 1284]
        if (document.activeElement) {
            document.activeElement.blur();
        }

        // 2. Cerramos el modal del visor de cartón de forma limpia [cite: 1284]
        const modalElement = document.getElementById('acervoPopupModal');
        const modalPopup = bootstrap.Modal.getInstance(modalElement);
        if (modalPopup) {
            modalPopup.hide();
        }

        // 3. Inicializamos las cajas de texto de la interfaz [cite: 1071]
        document.getElementById('modal-titulo-acervo').innerText = `Gemini AI Stream: ${this.UI.titulo}`;
        document.getElementById('modal-instancia-key').value = `${this.origen}_${this.id}`;
        
        const chatBox = document.getElementById('modal-chat-box');
        chatBox.innerHTML = `<div class="text-muted">Conectando al entorno estable de producción...</div>`;

        const promptParaGemini = `Actúa como un auditor de Excel. Analiza los siguientes datos de la fila de origen [${this.origen}]: 
        Atributos: ${this.UI.linea1} | ${this.UI.linea2}. El campo escaneable actual dice: "${this.UI.campoEscaneable}". 
        Por favor, dame una opinión profesional corta de este registro.`; [cite: 1096]

        // =========================================================================
        // TU CREDENCIAL LARGA COMPLETA (AQ.Ab...) [cite: 1261]
        // =========================================================================
        const CREDENCIAL_AUTH = "AQ.Ab8RN6JwvHT9jL1igTiCvLvg_nRg3W-l-v1MkCmYIZlt2WFwAw"; 

        try {
            // Importamos dinámicamente el SDK unificado oficial de Google AI [cite: 1367]
            const { GoogleGenAI } = await import('https://esm.run/@google/genai');
            
            // =========================================================================
            // AJUSTE CRÍTICO: Forzamos la apiVersion a 'v1' para que encuentre el modelo estable
            // =========================================================================
            const ai = new GoogleGenAI({ 
                apiKey: CREDENCIAL_AUTH,
                apiVersion: 'v1' 
            });

            // Limpiamos el contenedor para empezar a recibir las palabras en ráfaga
            chatBox.innerHTML = `
                <div class="p-2 mb-2 bg-dark text-warning border-start border-4 border-warning rounded">
                    <span id="stream-text-target"></span>
                </div>`;
            
            const targetSpan = document.getElementById('stream-text-target');

            // Flujo de contenido en tiempo real (Streaming) [cite: 1390]
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-1.5-flash', 
                contents: promptParaGemini,
            });

            // Iteramos sobre los fragmentos de texto conforme llegan 
            for await (const chunk of responseStream) {
                if (chunk.text) {
                    targetSpan.innerText += chunk.text;
                    chatBox.scrollTop = chatBox.scrollHeight; 
                }
            }
                
        } catch (error) {
            chatBox.innerHTML = `
                <div class="p-2 mb-2 bg-dark text-danger border-start border-4 border-danger rounded small">
                    <strong>Fallo de Comunicación SDK:</strong> ${error.message}
                </div>`;
            console.error("Detalle del fallo:", error);
        }
        
        // 4. Lanzamos el modal limpio de Gemini [cite: 1152]
        const modalChat = new bootstrap.Modal(document.getElementById('geminiChatModal'));
        modalChat.show();
    }
    analizarYActualizarCeldaExcel(textoUsuario) {
        if (this.UI.campoEscaneable.toLowerCase() === 'sin informacion') {
            if (textoUsuario.trim().length > 3) {
                this.UI.campoEscaneable = textoUsuario;
                this.datosOriginales[this.UI.nombreColumnaOriginal] = textoUsuario;
                const elemExcel = document.getElementById(`dom-excel-${this.origen}-${this.id}`);
                if (elemExcel) elemExcel.innerText = textoUsuario;
                return `Análisis Sintáctico Exitoso. Parchado en el Excel.`;
            }
        }
        return `Celda ya protegida con registros sólidos.`;
    }
}
