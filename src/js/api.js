const API_URL = import.meta.env.VITE_API_URL || "/api";

async function solicitarApi(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: {
      "Content-Type": "application/json",
      ...opciones.headers,
    },
    ...opciones,
  });

  const datos = await respuesta.json();

  if (!respuesta.ok || datos.exito === false) {
    throw new Error(datos.mensaje || "Ocurrió un error en la solicitud.");
  }

  return datos.datos;
}

export function iniciarSesion(nombreUsuario, contrasena) {
  return solicitarApi("/usuarios/login", {
    method: "POST",
    body: JSON.stringify({ nombreUsuario, contrasena }),
  });
}

export function obtenerUsuarios() {
  return solicitarApi("/usuarios");
}

export function obtenerUsuario(id) {
  return solicitarApi(`/usuarios/${id}`);
}

export function crearUsuario(datos) {
  return solicitarApi("/usuarios", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function actualizarUsuario(id, datos) {
  return solicitarApi(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export function eliminarUsuario(id) {
  return solicitarApi(`/usuarios/${id}`, { method: "DELETE" });
}

export function obtenerProductos() {
  return solicitarApi("/productos");
}

export function obtenerProducto(id) {
  return solicitarApi(`/productos/${id}`);
}

export function crearProducto(datos) {
  return solicitarApi("/productos", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function actualizarProducto(id, datos) {
  return solicitarApi(`/productos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export function eliminarProducto(id) {
  return solicitarApi(`/productos/${id}`, { method: "DELETE" });
}

export function obtenerCategorias() {
  return solicitarApi("/categorias");
}

export function crearCategoria(datos) {
  return solicitarApi("/categorias", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function actualizarCategoria(id, datos) {
  return solicitarApi(`/categorias/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export function eliminarCategoria(id) {
  return solicitarApi(`/categorias/${id}`, { method: "DELETE" });
}
