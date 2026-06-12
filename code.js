/**
 * =========================================================================
 * CLASE: InventarioCultural (Manejo de Datos y Conexión con la Vitrina)
 * =========================================================================
 */
class InventarioCultural {
    constructor() {
        this.items = this.cargarInventarioDeLocalStorage(); 
    }

    cargarInventarioDeLocalStorage() {
        try {
            const datosGuardados = localStorage.getItem('inventario_museo');
            if (!datosGuardados) return [];
            const arregloParseado = JSON.parse(datosGuardados);
            return Array.isArray(arregloParseado) ? arregloParseado : [];
        } catch (error) {
            console.error("Error al leer LocalStorage:", error);
            return [];
        }
    }

    guardarEnLocalStorage() {
        localStorage.setItem('inventario_museo', JSON.stringify(this.items));
    }

    agregar(key, id, titulo, origen, imagen) {
        if (this.existe(key)) return false;
        this.items.push({ key, id, titulo, origen, imagen, fecha: new Date().toLocaleString() });
        this.guardarEnLocalStorage();
        console.log(`🎒 [Inventario] Item recolectado: ${titulo}`);
        return true;
    }

    remover(origen, id) {
        const keyBusqueda = `${origen}_${id}`;
        this.items = this.items.filter(item => item.key !== keyBusqueda);
        this.guardarEnLocalStorage();
        console.log(`🗑️ Item removido de la vitrina: ${keyBusqueda}`);
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
        
        // 2. Detección automática del entorno (Rutas relativas explícitas con './')
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
        this.actualizarVistaVitrina(); 
    }

    /**
     * MÁQUINA DE ESTADOS REACTIVA:
     * Oculta y muestra los contenedores que tú ya declaraste manualmente en tu HTML
     */
    cambiarEscenario(destinoId) {
        const cuartos = document.querySelectorAll('.escenario-cuarto');
        
        cuartos.forEach(cuarto => {
            cuarto.classList.add('d-none');
        });

        const cuartoDestino = document.getElementById(`escenario-${destinoId}`);
        if (cuartoDestino) {
            cuartoDestino.classList.remove('d-none');
            console.log(`🚶 Desplazamiento multidireccional hacia: escenario-${destinoId}`);
        } else {
            console.warn(`[Error de Escenario] No existe un contenedor con ID: escenario-${destinoId}`);
        }

        if (destinoId === 'casa') {
            this.actualizarVistaVitrina();
        }
    }

    activarEscuchadorGlobal() {
        document.addEventListener('click', (evento) => {
            // Buscamos si el elemento clickeado o su contenedor padre tiene la clase correcta
            const clicker = evento.target.closest('.objeto-clicker-3d');
            if (!clicker) return; 

            const rawId = clicker.getAttribute('data-id');
            const origen = clicker.getAttribute('data-origen');
            const tipoVisor = clicker.getAttribute('data-visor');

            if (!rawId || !origen) {
                console.warn("⚠️ Clic detectado pero faltan atributos de datos (data-id o data-origen) en el elemento.");
                return;
            }

            this.solicitarCargaExcel(parseInt(rawId), origen, tipoVisor || 'ficha');
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
        
        const textoOrigen = origen ? origen.toUpperCase() : 'DESCONOCIDO';
        if(statusDiv) statusDiv.innerText = `Abriendo caja de cartón: ${textoOrigen}...`;

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
    actualizarVistaVitrina() {
        const contenedor = document.getElementById('contenedor-vitrina-items');
        if (!contenedor) return;

        const listaItems = this.inventario.obtenerTodos();

        if (!listaItems || listaItems.length === 0) {
            contenedor.innerHTML = `<div class="text-center text-muted py-5 w-100" style="grid-column: span 4;">La vitrina está vacía.</div>`;
            return;
        }

        let htmlFinal = '';

        listaItems.forEach(item => {
            htmlFinal += `
                <div class="matriz-item-ranura">
                    <button class="btn-quitar-matriz" onclick="AppMuseo.removerDeVitrina('${item.origen}', '${item.id}')">&times;</button>
                    
                    <img src="${item.imagen}" 
                         alt="${item.titulo}" 
                         class="img-vitrina-ranura" 
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=200&q=80';"
                         onclick="window.AppMuseo.cargarDesdeVitrina('${item.origen}', ${item.id})">
                    
                    <div class="text-warning small fw-bold text-truncate mt-1 px-1" style="max-width: 120px; text-shadow: 1px 1px 2px black;">
                        ${item.titulo}
                    </div>
                </div>`;
        });

        contenedor.innerHTML = htmlFinal;
    }

    // Método puente para levantar instancias de tarjetas cuando la sesión se reinicia
    cargarDesdeVitrina(origen, id) {
        const key = `${origen}_${id}`;
        if (this.instanciasTarjetas[key]) {
            this.instanciasTarjetas[key].desplegarEnPopup();
            return;
        }
        console.log(`📡 Descargando celdas asíncronas para revivir objeto: ${key}`);
        this.solicitarCargaExcel(id, origen, 'ficha');
    }

    removerDeVitrina(origen, id) {
        this.inventario.remover(origen, id);
        this.actualiazarBotonPopupEnCaliente(origen, id);
        this.actualizarVistaVitrina(); 
    }

    actualiazarBotonPopupEnCaliente(origen, id) {
        const btnInV = document.getElementById(`btn-inv-${origen}-${id}`);
        if (btnInV) {
            btnInV.innerText = "📥 Guardar en Vitrina";
            btnInV.className = "btn btn-warning text-dark border-dark btn-sm fw-bold";
        }
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
        const prefijoRuta = "./img/";

        switch (this.origen) {
            case 'inah_museos':
                this.UI.titulo = fila['nombre'] || "Museo INAH";
                this.UI.imagen = `${prefijoRuta}img3.jpeg`;
                this.UI.linea1 = `Estado: ${fila['estado'] || 'N/A'}`;
                this.UI.linea2 = `Municipio: ${fila['municipio_localidad'] || 'N/A'}`;
                this.UI.nombreColumnaOriginal = 'condicion'; 
                break;
            case 'monumentos':
                this.UI.titulo = fila['nombre_actual'] || "Monumento";
                this.UI.imagen = `${prefijoRuta}img2.jpeg`;
                this.UI.linea1 = `Tipo: ${fila['tipo_monumento'] || 'Inmueble'}`;
                this.UI.linea2 = `Entidad: ${fila['entidad_federativa'] || 'N/D'}`;
                this.UI.nombreColumnaOriginal = 'nombre_original'; 
                break;
            case 'objetos_externos':
                this.UI.titulo = fila['nombre'] || "Pieza de Exposición";
                
                // Mapeamos de forma segura el ID desde la fila del Excel si no se sincronizó antes
                if (fila['id_item'] || fila['id']) {
                    this.id = parseInt(fila['id_item'] || fila['id']);
                }

                const archivoImg = fila['imagen'] ? String(fila['imagen']).trim() : '';
                
                // REPARACIÓN COMPLETA: Lógica condicional limpia y cerrada correctamente sin fugas de contexto
                if (archivoImg !== '') {
                    this.UI.imagen = `${prefijoRuta}${archivoImg}`;
                } else {
                    if (this.id === 1) {
                        this.UI.imagen = `${prefijoRuta}penacho.jpg`;
                    } else if (this.id === 4) {
                        this.UI.imagen = `${prefijoRuta}img4.png`; 
                    } else {
                        this.UI.imagen = `${prefijoRuta}img5.png`;
                    }
                }
                
                this.UI.linea1 = `📍 Ubicación: ${fila['localizacion'] || 'No especificada'}`; 
                this.UI.linea2 = `Colección: Objetos Externos del Museo`;
                this.UI.nombreColumnaOriginal = 'descripcion';
                break;
            case 'solicitudes':
                this.UI.titulo = fila['asunto'] || "Solicitud";
                this.UI.imagen = `${prefijoRuta}img6.jpeg`;
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
        const exito = this.app.inventario.agregar(keyCompuesta, this.id, this.UI.titulo, this.origen, this.UI.imagen);

        if (exito) {
            const btnInV = document.getElementById(`btn-inv-${this.origen}-${this.id}`);
            if(btnInV) {
                btnInV.innerText = "🎒 Guardado en Vitrina";
                btnInV.className = "btn btn-secondary btn-sm fw-bold shadow disabled";
            }
        }
    }

    async abrirChatGemini() {
        if (document.activeElement) document.activeElement.blur();
        const modalElement = document.getElementById('acervoPopupModal');
        const modalPopup = bootstrap.Modal.getInstance(modalElement);
        if (modalPopup) modalPopup.hide();

        document.getElementById('modal-titulo-acervo').innerText = `Auditoría de Ficha: ${this.UI.titulo}`;
        document.getElementById('modal-instancia-key').value = `${this.origen}_${this.id}`;
        
        const chatBox = document.getElementById('modal-chat-box');
        chatBox.innerHTML = `<div class="text-muted">Gemini analizando la descripción de la pieza...</div>`;

        const promptParaGemini = `Actúas como un curador y auditor experto de bases de datos de museos arqueológicos e históricos.
        Estás auditando un registro de la colección [${this.origen}].
        DATOS DE LA INTERFAZ:
        - Nombre/Título de la pieza: "${this.UI.titulo}"
        - ${this.UI.linea1}
        DESCRIPCIÓN EN EL CAMPO ESCANEABLE DE EXCEL:
        "${this.UI.campoEscaneable}"
        INSTRUCCIONES ESTRICTAS DE RESPUESTA:
        1. NO te limites a decir de forma genérica que "falta información" o que el registro está incompleto.
        2. Analiza el texto de la descripción proporcionada.
        3. Genera una lista viñetada corta identificando ESPECÍFICAMENTE qué datos técnicos o museográficos hacen falta en esa descripción para que sea una ficha profesional completa (por ejemplo: si faltan dimensiones, materiales, cultura/filiación cultural, datación exacta, técnicas de manufactura o estado físico actual).
        4. Sé breve, directo y mantén un tono profesional de auditoría. Responde en un solo párrafo introductorio seguido de los puntos clave.`;

        const CREDENCIAL_AUTH = "AQ.Ab8RN6JwvHT9jL1igTiCvLvg_nRg3W-l-v1MkCmYIZlt2WFwAw"; 

        try {
            const { GoogleGenAI } = await import('https://esm.run/@google/genai');
            const ai = new GoogleGenAI({ apiKey: CREDENCIAL_AUTH, apiVersion: "v1" });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', 
                contents: promptParaGemini
            });

            chatBox.innerHTML = `
                <div class="p-2 mb-2 bg-dark text-warning border-start border-4 border-warning rounded">
                    <span>${response.text}</span>
                </div>`;
                
        } catch (error) {
            chatBox.innerHTML = `
                <div class="p-2 mb-2 bg-dark text-danger border-start border-4 border-danger rounded small">
                    <strong>Error de Comunicación:</strong><br>
                    <span class="text-muted text-xs">${error.message}</span>
                </div>`;
            console.error(error);
        }
        
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
