import { obtenerProductos, obtenerProducto } from "./api.js";

const SESSION_KEY = "coquette_session";
const USER_KEY = "coquette_user";
const LOGIN_PATH = "/";
const IMAGEN_PLACEHOLDER = "/assets/coquette.png";

const modal = document.getElementById("detalle-modal");
const modalContenido = document.getElementById("detalle-contenido");
const productosGrid = document.getElementById("productos-grid");

function exigirSesion() {
  if (sessionStorage.getItem(SESSION_KEY) !== "true") {
    window.location.href = LOGIN_PATH;
    return false;
  }
  return true;
}

function escaparHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatearPrecio(precio) {
  return `$${Number(precio).toLocaleString("es-AR")}`;
}

function formatearEstado(estado) {
  return String(estado ?? "").replaceAll("_", " ");
}

function mostrarNombreUsuario() {
  const usuarioGuardado = sessionStorage.getItem(USER_KEY);
  let usuario = null;

  try {
    usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  } catch {
    usuario = null;
  }

  const nombreVisible = usuario?.nombre || usuario?.nombreUsuario || "invitada";
  document.getElementById("user-name").textContent = nombreVisible;
}

function cerrarModal() {
  modal.close();
  modalContenido.innerHTML = "";
}

function abrirModal(html) {
  modalContenido.innerHTML = html;
  modal.showModal();
}

function renderEstadoVacio(contenedor, mensaje) {
  contenedor.innerHTML = `<p class="catalog-empty">${escaparHtml(mensaje)}</p>`;
}

function renderEstadoError(contenedor, mensaje) {
  contenedor.innerHTML = `<p class="catalog-empty catalog-empty--error">${escaparHtml(mensaje)}</p>`;
}

function renderTarjetasProductos(productos) {
  const disponibles = productos.filter((producto) => producto.disponible !== false);

  if (!disponibles.length) {
    renderEstadoVacio(productosGrid, "Todavía no hay productos publicados.");
    return;
  }

  productosGrid.innerHTML = disponibles
    .map(
      (producto) => `
        <button
          type="button"
          class="product-card"
          data-producto-id="${producto.id}"
        >
          <img
            class="product-card-image"
            src="${escaparHtml(producto.imagenUrl || IMAGEN_PLACEHOLDER)}"
            alt="${escaparHtml(producto.nombre)}"
            loading="lazy"
            onerror="this.src='${IMAGEN_PLACEHOLDER}'"
          />
          <div class="product-card-body">
            <span class="product-card-category">${escaparHtml(producto.categoria?.nombre || "Sin categoría")}</span>
            <h3>${escaparHtml(producto.nombre)}</h3>
            <p class="product-card-price">${formatearPrecio(producto.precio)}</p>
          </div>
        </button>
      `,
    )
    .join("");
}

function renderDetalleProducto(producto) {
  abrirModal(`
    <article class="detail-product">
      <img
        class="detail-product-image"
        src="${escaparHtml(producto.imagenUrl || IMAGEN_PLACEHOLDER)}"
        alt="${escaparHtml(producto.nombre)}"
        onerror="this.src='${IMAGEN_PLACEHOLDER}'"
      />
      <div class="detail-product-info">
        <span class="detail-badge">${escaparHtml(producto.categoria?.nombre || "Sin categoría")}</span>
        <h2>${escaparHtml(producto.nombre)}</h2>
        <p class="detail-price">${formatearPrecio(producto.precio)}</p>
        <p class="detail-description">${escaparHtml(producto.descripcion)}</p>
        <ul class="detail-meta">
          <li><strong>Marca:</strong> ${escaparHtml(producto.marca)}</li>
          <li><strong>Talle:</strong> ${escaparHtml(producto.talle)}</li>
          <li><strong>Estado:</strong> ${escaparHtml(formatearEstado(producto.estadoPrenda))}</li>
          <li><strong>Disponible:</strong> ${producto.disponible ? "Sí" : "No"}</li>
          <li><strong>Publicado por:</strong> ${escaparHtml(producto.usuario?.nombre || "—")}</li>
        </ul>
      </div>
    </article>
  `);
}

async function cargarProductos() {
  try {
    const productos = await obtenerProductos();
    renderTarjetasProductos(productos);
  } catch (error) {
    renderEstadoError(productosGrid, error.message);
  }
}

async function mostrarDetalleProducto(id) {
  try {
    const producto = await obtenerProducto(id);
    renderDetalleProducto(producto);
  } catch (error) {
    abrirModal(`<p class="catalog-empty catalog-empty--error">${escaparHtml(error.message)}</p>`);
  }
}

function configurarEventos() {
  document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_KEY);
    window.location.href = LOGIN_PATH;
  });

  document.getElementById("detalle-cerrar").addEventListener("click", cerrarModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) cerrarModal();
  });

  productosGrid.addEventListener("click", (event) => {
    const tarjeta = event.target.closest("[data-producto-id]");
    if (!tarjeta) return;
    mostrarDetalleProducto(tarjeta.dataset.productoId);
  });
}

async function iniciarHome() {
  if (!exigirSesion()) return;

  mostrarNombreUsuario();
  configurarEventos();
  await cargarProductos();
}

iniciarHome();
