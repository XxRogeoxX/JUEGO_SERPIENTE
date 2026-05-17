// ============================================================================
// 🎮 CONFIGURACIÓN Y CONSTANTES
// ============================================================================
// Tamaño en píxeles de cada cuadro (celda) dentro del tablero del juego.
const TAMANIO_CELDA = 25; 

// ============================================================================
// 🖼️ ELEMENTOS DEL DOM Y CONTEXTO
// ============================================================================
// Captura el elemento canvas del HTML para poder dibujar sobre él.
const canvas = document.getElementById("canvasJuego");
// Obtiene el contexto de dibujo en 2D, que provee las funciones para pintar formas.
const ctx = canvas.getContext("2d");

// ============================================================================
// 🐍 ESTADO DEL JUEGO (Variables dinámicas)
// ============================================================================
// Array de objetos que representa el cuerpo de la serpiente; el índice [0] siempre es la cabeza.
let serpiente = [
  { x: 14, y: 13 },
  { x: 14, y: 14 },
  { x: 14, y: 15 },
  { x: 14, y: 16 },
  { x: 14, y: 17 }
];

let intervaloSerpiente; // Guarda el temporizador (setInterval) que controla el movimiento automático.
let direccionActual = "derecha"; // Almacena la dirección hacia donde se dirige la serpiente.
let comida = { x: 5, y: 5 }; // Coordenadas lógicas (x, y) de la posición actual de la comida.
let puntaje = 0; // Contador de puntos del jugador.
let juegoTerminado = false; // Bandera booleana para detener procesos si el jugador pierde.
let velocidadSerpiente = 300; // Factor numérico que determina qué tan rápido corre el ciclo de actualización.

// ============================================================================
// 🚀 INICIALIZACIÓN
// ============================================================================
// Dibuja el estado inicial en la pantalla apenas se carga el script.
dibujarTodo();

// ============================================================================
// 🎨 FUNCIONES DE DIBUJO
// ============================================================================

/**
 * Coordina todo el renderizado visual del lienzo llamando secuencialmente a los componentes.
 */
function dibujarTodo() {
  limpiarCanvas();
  dibujarTablero();
  dibujarComida();
  dibujarSerpiente();
}

/**
 * Borra por completo el canvas para evitar que los dibujos anteriores dejen rastro al moverse.
 */
function limpiarCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Agrupa las funciones necesarias para pintar la rejilla guía del tablero de juego.
 */
function dibujarTablero() {
  dibujarLineasVerticales();
  dibujarLineasHorizontales();
  dibujarNumerosEnY();
  dibujarNumerosEnX();
}

/**
 * Recorre el ancho del lienzo y traza las líneas verticales divisorias de la cuadrícula.
 */
function dibujarLineasVerticales() {
  for (let x = 0; x <= canvas.width; x += TAMANIO_CELDA) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"; // Opacidad sutil para mejor estética
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
}

/**
 * Recorre el alto del lienzo y traza las líneas horizontales divisorias de la cuadrícula.
 */
function dibujarLineasHorizontales() {
  for (let y = 0; y <= canvas.height; y += TAMANIO_CELDA) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

/**
 * Imprime números guías en el eje vertical izquierdo para facilitar la depuración de coordenadas.
 */
function dibujarNumerosEnY() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "10px Arial";
  let contador = 0;
  for (let y = 0; y < canvas.height; y += TAMANIO_CELDA) {
    ctx.fillText(contador, 5, y + 15);
    contador++;
  }
}

/**
 * Imprime números guías en el eje horizontal superior para el rastreo visual del programador.
 */
function dibujarNumerosEnX() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "10px Arial";
  let contador = 0;
  for (let x = 0; x < canvas.width; x += TAMANIO_CELDA) {
    ctx.fillText(contador, x + 2, 12);
    contador++;
  }
}

/**
 * Traduce coordenadas lógicas de matriz (ej: 5, 5) a píxeles en pantalla y rellena ese cuadro.
 */
function pintarCoordenada(x, y, color) {
  const posicionX = x * TAMANIO_CELDA;
  const posicionY = y * TAMANIO_CELDA;

  if (posicionX < canvas.width && posicionY < canvas.height) {
    ctx.fillStyle = color;
    ctx.fillRect(posicionX, posicionY, TAMANIO_CELDA, TAMANIO_CELDA);
    ctx.strokeStyle = "#111827"; // Borde oscuro integrado para definir las celdas de la serpiente
    ctx.strokeRect(posicionX, posicionY, TAMANIO_CELDA, TAMANIO_CELDA);
  }
}

/**
 * Recorre el arreglo de la serpiente, dándole color rojo a la cabeza [0] y amarillo a los segmentos del cuerpo.
 */
function dibujarSerpiente() {
  const colorCabeza = "red";
  for (let i = 0; i < serpiente.length; i++) {
    const serp = serpiente[i];
    const color = (i === 0) ? colorCabeza : "yellow";
    pintarCoordenada(serp.x, serp.y, color);
  }
}

/**
 * Pinta un bloque de color verde sobre las coordenadas designadas para la comida.
 */
function dibujarComida() {
  pintarCoordenada(comida.x, comida.y, "green");
}

// ============================================================================
// 🕹️ FUNCIONES DE MOVIMIENTO Y LÓGICA CORE
// ============================================================================

/**
 * Procesa el desplazamiento hacia adelante insertando una nueva cabeza y eliminando la cola.
 * Maneja el parámetro 'crecer' para evitar remover el último elemento cuando come.
 */
function avanzarSerpiente(nuevoX, nuevoY, crecer) {
  const nuevaCabeza = { x: nuevoX, y: nuevoY };
  serpiente.unshift(nuevaCabeza); // Inserta la nueva posición al inicio del arreglo.
  if (!crecer) {
    serpiente.pop(); // Si no ha comido, elimina el último segmento para simular desplazamiento.
  }
}

/**
 * Evalúa los límites del canvas y traslada la cabeza a la derecha. Si choca el borde, ejecuta GameOver.
 */
function moverDerecha(crecer) {
  const limiteColumnas = canvas.width / TAMANIO_CELDA;
  if (serpiente[0].x + 1 >= limiteColumnas) {
    gameOver();
    return;
  }
  avanzarSerpiente(serpiente[0].x + 1, serpiente[0].y, crecer);
}

/**
 * Evalúa los límites del canvas y traslada la cabeza a la izquierda. Si cruza el cero, ejecuta GameOver.
 */
function moverIzquierda(crecer) {
  if (serpiente[0].x - 1 < 0) {
    gameOver();
    return;
  }
  avanzarSerpiente(serpiente[0].x - 1, serpiente[0].y, crecer);
}

/**
 * Evalúa los límites del canvas e impulsa la cabeza hacia abajo. Si choca el fondo, ejecuta GameOver.
 */
function moverAbajo(crecer) {
  const limiteFilas = canvas.height / TAMANIO_CELDA;
  if (serpiente[0].y + 1 >= limiteFilas) {
    gameOver();
    return;
  }
  avanzarSerpiente(serpiente[0].x, serpiente[0].y + 1, crecer);
}

/**
 * Evalúa los límites del canvas e impulsa la cabeza hacia arriba. Si rompe el límite superior, ejecuta GameOver.
 */
function moverArriba(crecer) {
  if (serpiente[0].y - 1 < 0) {
    gameOver();
    return;
  }
  avanzarSerpiente(serpiente[0].x, serpiente[0].y - 1, crecer);
}

/**
 * Modifica la variable global de dirección en base a la acción del usuario.
 */
function cambiarDireccion(direccion) {
  // Evita que la serpiente gire 180 grados sobre sí misma directamente
  if (direccion === "derecha" && direccionActual === "izquierda") return;
  if (direccion === "izquierda" && direccionActual === "derecha") return;
  if (direccion === "arriba" && direccionActual === "abajo") return;
  if (direccion === "abajo" && direccionActual === "arriba") return;

  direccionActual = direccion;
}

/**
 * Capturador de eventos de teclado; traduce las flechas direccionales en comandos de movimiento.
 */
window.addEventListener("keydown", (evento) => {
  switch (evento.key) {
    case "ArrowRight": cambiarDireccion("derecha"); break;
    case "ArrowLeft":  cambiarDireccion("izquierda"); break;
    case "ArrowUp":    cambiarDireccion("arriba"); break;
    case "ArrowDown":  cambiarDireccion("abajo"); break;
  }
});

// ============================================================================
// 🎮 CONTROL DE FLUJO DEL JUEGO
// ============================================================================

/**
 * Activa el bucle del juego usando setInterval con la velocidad configurada. Modifica el estado del DOM.
 */
function iniciarJuego() {
  if (juegoTerminado) return;
  clearInterval(intervaloSerpiente); // Limpieza preventiva de timers duplicados
  intervaloSerpiente = setInterval(moverSerpiente, 1000 - velocidadSerpiente);
  cambiarEstado("Jugando");
}

/**
 * Detiene el temporizador del juego pausando la ejecución de 'moverSerpiente'.
 */
function pausarJuego() {
  clearInterval(intervaloSerpiente);
  cambiarEstado("Descansando");
}

/**
 * Motor central de actualizaciones mecánicas. Se ejecuta cíclicamente. 
 * Revisa colisiones de comida, ejecuta traslados y redibuja la interfaz.
 */
function moverSerpiente() { 
  if (juegoTerminado) return;

  let atrapada = comidaAtrapada();
  
  // Llama a la dirección correspondiente enviando el estado de alimentación
  switch (direccionActual) {
    case "derecha":   moverDerecha(atrapada); break;
    case "izquierda": moverIzquierda(atrapada); break;
    case "abajo":     moverAbajo(atrapada); break;
    case "arriba":    moverArriba(atrapada); break;
  }

  // Si chocó consigo misma (auto-colisión)
  if (verificarAutoColision()) {
    gameOver();
    return;
  }

  // Si comió, actualiza puntajes y reposiciona el alimento
  if (atrapada) {
    aumentarPuntaje();
    generarNuevaPosicionComida();
  }

  dibujarTodo();
}

/**
 * Compara las coordenadas de la cabeza de la serpiente frente al resto del cuerpo para detectar choques internos.
 */
function verificarAutoColision() {
  const cabeza = serpiente[0];
  for (let i = 1; i < serpiente.length; i++) {
    if (serpiente[i].x === cabeza.x && serpiente[i].y === cabeza.y) {
      return true;
    }
  }
  return false;
}

/**
 * Genera números aleatorios enteros inclusivos usando Math.floor para reposicionar el alimento en la rejilla.
 */
function generarNuevaPosicionComida() {
  const maxColumnas = canvas.width / TAMANIO_CELDA;
  const maxFilas = canvas.height / TAMANIO_CELDA;
  
  comida.x = Math.floor(Math.random() * maxColumnas);
  comida.y = Math.floor(Math.random() * maxFilas);
}

/**
 * Compara lógicamente si la coordenada X e Y de la cabeza coinciden con el objeto comida.
 */
function comidaAtrapada() {
  return comida.x === serpiente[0].x && comida.y === serpiente[0].y;
}

/**
 * Incrementa el puntaje global, actualiza el HTML e incrementa la velocidad dinámicamente cada 2 puntos.
 */
function aumentarPuntaje() {
  puntaje++;
  if (puntaje % 2 === 0 && velocidadSerpiente <= 800) {
    velocidadSerpiente += 50;
    clearInterval(intervaloSerpiente);
    intervaloSerpiente = setInterval(moverSerpiente, 1000 - velocidadSerpiente);
  }
  document.getElementById("puntaje").innerText = puntaje;
}

/**
 * Actualiza el texto informativo de la tarjeta de estado en el árbol DOM.
 */
function cambiarEstado(estado) {
  document.getElementById("estado").innerText = estado;
}

/**
 * Cambia banderas de detención, actualiza los textos visuales e interrumpe los timers activos.
 */
function gameOver() {
  juegoTerminado = true;
  clearInterval(intervaloSerpiente);
  cambiarEstado("Game Over");
}

/**
 * Restablece todas las variables primitivas y estructuradas a sus valores iniciales limpiando la pantalla por completo.
 */
function reiniciarJuego() {
  clearInterval(intervaloSerpiente);
  serpiente = [
    { x: 14, y: 13 },
    { x: 14, y: 14 },
    { x: 14, y: 15 },
    { x: 14, y: 16 },
    { x: 14, y: 17 }
  ];
  puntaje = 0;
  direccionActual = "derecha";
  juegoTerminado = false;
  velocidadSerpiente = 300; 
  
  document.getElementById("puntaje").innerText = "0";
  cambiarEstado("Listo");
  generarNuevaPosicionComida();
  dibujarTodo();
}