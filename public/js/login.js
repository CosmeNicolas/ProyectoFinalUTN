(function () {
  "use strict";

  var CREDENTIALS = {
    username: "coquette",
    password: "vintage2026",
  };

  var SESSION_KEY = "coquette_session";
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

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideError();

    var username = usernameInput.value.trim();
    var password = passwordInput.value;

    if (!username || !password) {
      showError("Completa usuario y contraseña.");
      return;
    }

    setLoading(true);

    window.setTimeout(function () {
      var isValid =
        username === CREDENTIALS.username &&
        password === CREDENTIALS.password;

      if (isValid) {
        sessionStorage.setItem(SESSION_KEY, "true");
        sessionStorage.setItem("coquette_user", username);
        window.location.href = HOME_PATH;
        return;
      }

      setLoading(false);
      showError("Usuario o contraseña incorrectos.");
      passwordInput.value = "";
      passwordInput.focus();
    }, 600);
  });
})();
