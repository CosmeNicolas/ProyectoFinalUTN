(function () {
  "use strict";

  var SESSION_KEY = "coquette_session";
  var LOGIN_PATH = "/";

  if (sessionStorage.getItem(SESSION_KEY) !== "true") {
    window.location.href = LOGIN_PATH;
    return;
  }

  var userName = sessionStorage.getItem("coquette_user") || "invitada";
  document.getElementById("user-name").textContent = userName;

  document.getElementById("logout-btn").addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("coquette_user");
    window.location.href = LOGIN_PATH;
  });
})();
