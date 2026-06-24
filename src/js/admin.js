import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "./api.js";

const SESSION_KEY = "coquette_session";
const USER_KEY = "coquette_user";
const LOGIN_PATH = "/";
const ESTADOS_PRENDA = ["NUEVO", "COMO_NUEVO", "BUENO", "REGULAR"];

const alertBox = document.getElementById("admin-alert");
const modal = document.getElementById("modal-admin");
const modalTitulo = document.getElementById("modal-titulo");
const modalForm = document.getElementById("modal-form");

let usuariosCache = [];
let productosCache = [];
let categoriasCache = [];
let tabActiva = "usuarios";
let modalConfig = null;

function exigirSesion() {
  if (sessionStorage.getItem(SESSION_KEY) !== "true") {
    window.location.href = LOGIN_PATH;
    return false;
  }
  return true;
}

function mostrarAlerta(mensaje, tipo = "success") {
  alertBox.textContent = mensaje;
  alertBox.className = `admin-alert is-${tipo}`;
  alertBox.hidden = false;

  window.setTimeout(() => {
    alertBox.hidden = true;
  }, 4000);
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

function cambiarTab(nombreTab) {
  tabActiva = nombreTab;

  document.querySelectorAll(".admin-tab").forEach((tab) => {
    const activa = tab.dataset.tab === nombreTab;
    tab.classList.toggle("is-active", activa);
    tab.setAttribute("aria-selected", String(activa));
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    const activa = panel.id === `panel-${nombreTab}`;
    panel.classList.toggle("is-active", activa);
    panel.hidden = !activa;
  });
}

function abrirModal(titulo, campos, onSubmit) {
  modalTitulo.textContent = titulo;
  modalForm.innerHTML = campos
    .map((campo) => {
      const valor = escaparHtml(campo.valor ?? "");
      const requerido = campo.requerido ? "required" : "";

      if (campo.tipo === "select") {
        const opciones = campo.opciones
          .map(
            (opcion) =>
              `<option value="${escaparHtml(opcion.valor)}" ${
                String(opcion.valor) === String(campo.valor) ? "selected" : ""
              }>${escaparHtml(opcion.etiqueta)}</option>`,
          )
          .join("");

        return `
          <label>
            ${escaparHtml(campo.etiqueta)}
            <select name="${campo.nombre}" ${requerido}>${opciones}</select>
          </label>
        `;
      }

      if (campo.tipo === "textarea") {
        return `
          <label>
            ${escaparHtml(campo.etiqueta)}
            <textarea name="${campo.nombre}" ${requerido}>${valor}</textarea>
          </label>
        `;
      }

      return `
        <label>
          ${escaparHtml(campo.etiqueta)}
          <input
            type="${campo.tipo || "text"}"
            name="${campo.nombre}"
            value="${valor}"
            ${requerido}
            ${campo.placeholder ? `placeholder="${escaparHtml(campo.placeholder)}"` : ""}
          />
        </label>
      `;
    })
    .join("");

  modalConfig = onSubmit;
  modal.showModal();
}

function cerrarModal() {
  modal.close();
  modalConfig = null;
  modalForm.reset();
}

function leerFormulario() {
  const datos = {};
  const elementos = modalForm.querySelectorAll("input, select, textarea");

  elementos.forEach((elemento) => {
    if (elemento.type === "checkbox") {
      datos[elemento.name] = elemento.checked;
      return;
    }

    datos[elemento.name] = elemento.value.trim();
  });

  return datos;
}

function renderTablaVacia(tbody, columnas, mensaje) {
  tbody.innerHTML = `<tr><td colspan="${columnas}" class="table-empty">${mensaje}</td></tr>`;
}

async function cargarUsuarios() {
  const tbody = document.getElementById("tabla-usuarios");

  try {
    usuariosCache = await obtenerUsuarios();

    if (!usuariosCache.length) {
      renderTablaVacia(tbody, 6, "No hay usuarios registrados.");
      return;
    }

    tbody.innerHTML = usuariosCache
      .map(
        (usuario) => `
          <tr>
            <td>${usuario.id}</td>
            <td>${escaparHtml(usuario.nombre)}</td>
            <td>${escaparHtml(usuario.nombreUsuario)}</td>
            <td>${escaparHtml(usuario.email)}</td>
            <td>${escaparHtml(usuario.telefono || "—")}</td>
            <td>
              <div class="table-actions">
                <button type="button" class="btn-icon" data-editar-usuario="${usuario.id}">Editar</button>
                <button type="button" class="btn-danger" data-borrar-usuario="${usuario.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    renderTablaVacia(tbody, 6, error.message);
  }
}

function abrirFormularioUsuario(usuario = null) {
  const esEdicion = Boolean(usuario);

  abrirModal(
    esEdicion ? "Editar usuario" : "Nuevo usuario",
    [
      { nombre: "nombre", etiqueta: "Nombre completo", valor: usuario?.nombre, requerido: true },
      {
        nombre: "nombreUsuario",
        etiqueta: "Nombre de usuario",
        valor: usuario?.nombreUsuario,
        requerido: !esEdicion,
      },
      {
        nombre: "email",
        etiqueta: "Email",
        tipo: "email",
        valor: usuario?.email,
        requerido: true,
      },
      {
        nombre: "telefono",
        etiqueta: "Teléfono",
        valor: usuario?.telefono,
      },
      {
        nombre: "contrasena",
        etiqueta: esEdicion ? "Contraseña (opcional)" : "Contraseña",
        tipo: "password",
        requerido: !esEdicion,
        placeholder: esEdicion ? "Dejar vacío para no cambiar" : "",
      },
    ],
    async () => {
      const datos = leerFormulario();

      if (!esEdicion) {
        await crearUsuario(datos);
        mostrarAlerta("Usuario creado correctamente.");
      } else {
        if (!datos.contrasena) delete datos.contrasena;
        await actualizarUsuario(usuario.id, datos);
        mostrarAlerta("Usuario actualizado correctamente.");
      }

      cerrarModal();
      await cargarUsuarios();
    },
  );
}

async function cargarProductos() {
  const tbody = document.getElementById("tabla-productos");

  try {
    [productosCache, categoriasCache] = await Promise.all([
      obtenerProductos(),
      obtenerCategorias(),
    ]);

    if (!productosCache.length) {
      renderTablaVacia(tbody, 7, "No hay productos publicados.");
      return;
    }

    tbody.innerHTML = productosCache
      .map(
        (producto) => `
          <tr>
            <td>${producto.id}</td>
            <td>${escaparHtml(producto.nombre)}</td>
            <td>${formatearPrecio(producto.precio)}</td>
            <td>${escaparHtml(producto.talle)}</td>
            <td>${escaparHtml(producto.estadoPrenda)}</td>
            <td>${escaparHtml(producto.categoria?.nombre || "—")}</td>
            <td>
              <div class="table-actions">
                <button type="button" class="btn-icon" data-editar-producto="${producto.id}">Editar</button>
                <button type="button" class="btn-danger" data-borrar-producto="${producto.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    renderTablaVacia(tbody, 7, error.message);
  }
}

function abrirFormularioProducto(producto = null) {
  const esEdicion = Boolean(producto);

  abrirModal(
    esEdicion ? "Editar producto" : "Nuevo producto",
    [
      { nombre: "nombre", etiqueta: "Nombre", valor: producto?.nombre, requerido: true },
      {
        nombre: "descripcion",
        etiqueta: "Descripción",
        tipo: "textarea",
        valor: producto?.descripcion,
        requerido: true,
      },
      {
        nombre: "precio",
        etiqueta: "Precio",
        tipo: "number",
        valor: producto?.precio,
        requerido: true,
      },
      { nombre: "talle", etiqueta: "Talle", valor: producto?.talle, requerido: true },
      { nombre: "marca", etiqueta: "Marca", valor: producto?.marca, requerido: true },
      {
        nombre: "estadoPrenda",
        etiqueta: "Estado de la prenda",
        tipo: "select",
        valor: producto?.estadoPrenda || "BUENO",
        requerido: true,
        opciones: ESTADOS_PRENDA.map((estado) => ({
          valor: estado,
          etiqueta: estado.replaceAll("_", " "),
        })),
      },
      {
        nombre: "imagenUrl",
        etiqueta: "URL de imagen",
        tipo: "url",
        valor: producto?.imagenUrl,
        requerido: true,
        placeholder: "https://ejemplo.com/imagen.jpg",
      },
      {
        nombre: "usuarioId",
        etiqueta: "Usuario",
        tipo: "select",
        valor: producto?.usuarioId,
        requerido: true,
        opciones: usuariosCache.map((usuario) => ({
          valor: usuario.id,
          etiqueta: `${usuario.nombre} (@${usuario.nombreUsuario})`,
        })),
      },
      {
        nombre: "categoriaId",
        etiqueta: "Categoría",
        tipo: "select",
        valor: producto?.categoriaId,
        requerido: true,
        opciones: categoriasCache.map((categoria) => ({
          valor: categoria.id,
          etiqueta: categoria.nombre,
        })),
      },
      {
        nombre: "disponible",
        etiqueta: "Disponible",
        tipo: "select",
        valor: producto?.disponible === false ? "false" : "true",
        opciones: [
          { valor: "true", etiqueta: "Sí" },
          { valor: "false", etiqueta: "No" },
        ],
      },
    ],
    async () => {
      const datos = leerFormulario();
      datos.precio = Number(datos.precio);
      datos.usuarioId = Number(datos.usuarioId);
      datos.categoriaId = Number(datos.categoriaId);
      datos.disponible = datos.disponible === "true";

      if (!esEdicion) {
        await crearProducto(datos);
        mostrarAlerta("Producto creado correctamente.");
      } else {
        await actualizarProducto(producto.id, datos);
        mostrarAlerta("Producto actualizado correctamente.");
      }

      cerrarModal();
      await cargarProductos();
    },
  );
}

async function cargarCategorias() {
  const tbody = document.getElementById("tabla-categorias");

  try {
    categoriasCache = await obtenerCategorias();

    if (!categoriasCache.length) {
      renderTablaVacia(tbody, 3, "No hay categorías registradas.");
      return;
    }

    tbody.innerHTML = categoriasCache
      .map(
        (categoria) => `
          <tr>
            <td>${categoria.id}</td>
            <td>${escaparHtml(categoria.nombre)}</td>
            <td>
              <div class="table-actions">
                <button type="button" class="btn-icon" data-editar-categoria="${categoria.id}">Editar</button>
                <button type="button" class="btn-danger" data-borrar-categoria="${categoria.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    renderTablaVacia(tbody, 3, error.message);
  }
}

function abrirFormularioCategoria(categoria = null) {
  const esEdicion = Boolean(categoria);

  abrirModal(
    esEdicion ? "Editar categoría" : "Nueva categoría",
    [
      {
        nombre: "nombre",
        etiqueta: "Nombre",
        valor: categoria?.nombre,
        requerido: true,
      },
    ],
    async () => {
      const datos = leerFormulario();

      if (!esEdicion) {
        await crearCategoria(datos);
        mostrarAlerta("Categoría creada correctamente.");
      } else {
        await actualizarCategoria(categoria.id, datos);
        mostrarAlerta("Categoría actualizada correctamente.");
      }

      cerrarModal();
      await cargarCategorias();
    },
  );
}

async function recargarTabActiva() {
  if (tabActiva === "usuarios") await cargarUsuarios();
  if (tabActiva === "productos") {
    if (!usuariosCache.length) await cargarUsuarios();
    await cargarProductos();
  }
  if (tabActiva === "categorias") await cargarCategorias();
}

function configurarEventos() {
  document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_KEY);
    window.location.href = LOGIN_PATH;
  });

  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", async () => {
      cambiarTab(tab.dataset.tab);
      await recargarTabActiva();
    });
  });

  document.getElementById("btn-nuevo-usuario").addEventListener("click", () => {
    abrirFormularioUsuario();
  });

  document.getElementById("btn-nuevo-producto").addEventListener("click", async () => {
    if (!usuariosCache.length) await cargarUsuarios();
    if (!categoriasCache.length) await cargarCategorias();

    if (!usuariosCache.length || !categoriasCache.length) {
      mostrarAlerta("Necesitás al menos un usuario y una categoría para crear productos.", "error");
      return;
    }

    abrirFormularioProducto();
  });

  document.getElementById("btn-nueva-categoria").addEventListener("click", () => {
    abrirFormularioCategoria();
  });

  document.getElementById("modal-cancelar").addEventListener("click", cerrarModal);

  modalForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await modalConfig();
    } catch (error) {
      mostrarAlerta(error.message, "error");
    }
  });

  document.getElementById("tabla-usuarios").addEventListener("click", async (event) => {
    const boton = event.target.closest("button");
    if (!boton) return;

    const idEditar = boton.dataset.editarUsuario;
    const idBorrar = boton.dataset.borrarUsuario;

    if (idEditar) {
      const usuario = usuariosCache.find((item) => item.id === Number(idEditar));
      abrirFormularioUsuario(usuario);
    }

    if (idBorrar) {
      if (!window.confirm("¿Eliminar este usuario?")) return;

      try {
        await eliminarUsuario(idBorrar);
        mostrarAlerta("Usuario eliminado correctamente.");
        await cargarUsuarios();
      } catch (error) {
        mostrarAlerta(error.message, "error");
      }
    }
  });

  document.getElementById("tabla-productos").addEventListener("click", async (event) => {
    const boton = event.target.closest("button");
    if (!boton) return;

    const idEditar = boton.dataset.editarProducto;
    const idBorrar = boton.dataset.borrarProducto;

    if (idEditar) {
      const producto = productosCache.find((item) => item.id === Number(idEditar));
      abrirFormularioProducto(producto);
    }

    if (idBorrar) {
      if (!window.confirm("¿Eliminar este producto?")) return;

      try {
        await eliminarProducto(idBorrar);
        mostrarAlerta("Producto eliminado correctamente.");
        await cargarProductos();
      } catch (error) {
        mostrarAlerta(error.message, "error");
      }
    }
  });

  document.getElementById("tabla-categorias").addEventListener("click", async (event) => {
    const boton = event.target.closest("button");
    if (!boton) return;

    const idEditar = boton.dataset.editarCategoria;
    const idBorrar = boton.dataset.borrarCategoria;

    if (idEditar) {
      const categoria = categoriasCache.find((item) => item.id === Number(idEditar));
      abrirFormularioCategoria(categoria);
    }

    if (idBorrar) {
      if (!window.confirm("¿Eliminar esta categoría?")) return;

      try {
        await eliminarCategoria(idBorrar);
        mostrarAlerta("Categoría eliminada correctamente.");
        await cargarCategorias();
      } catch (error) {
        mostrarAlerta(error.message, "error");
      }
    }
  });
}

async function iniciarAdmin() {
  if (!exigirSesion()) return;

  configurarEventos();
  await cargarUsuarios();
}

iniciarAdmin();
