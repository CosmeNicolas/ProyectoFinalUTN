import { iniciarSesion } from "./api.js";

(function () {
  "use strict";

  var SESSION_KEY = "coquette_session";
  var USER_KEY = "coquette_user";
  var HOME_PATH = "/pages/home.html";

  var form = document.getElementById("login-form");
  var usernameInput = document.getElementById("username");
  var passwordInput = document.getElementById("password");
  var errorBox = document.getElementById("login-error");
  var submitButton = form.querySelector(".btn-login");

  if (sessionStorage.getItem(SESSION_KEY) === "true") {
    window.location.href = HOME_PATH;
    return;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function hideError() {
    errorBox.textContent = "";
    errorBox.hidden = true;
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Entrando..." : "Entrar";
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError();

    var nombreUsuario = usernameInput.value.trim();
    var contrasena = passwordInput.value;

    if (!nombreUsuario || !contrasena) {
      showError("Completa usuario y contraseña.");
      return;
    }

    setLoading(true);

    try {
      var usuario = await iniciarSesion(nombreUsuario, contrasena);

      sessionStorage.setItem(SESSION_KEY, "true");
      sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
      window.location.href = HOME_PATH;
    } catch (error) {
      setLoading(false);
      showError(error.message || "Usuario o contraseña incorrectos.");
      passwordInput.value = "";
      passwordInput.focus();
    }
  });
})();
