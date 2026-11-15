
try {
  const topbar = document.createElement("div");

  const originalUrl = window.location.href;

  function ab() {

    const newtab = window.open("", "_blank");

    if (!newtab) {
     
    alert("Allow pop-ups!");
    return;
    }

    window.location.href = "about:blank";

    newtab.document.open();
    newtab.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${document.title || " AB"}</title>
        <style>
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe src="${originalUrl}"></iframe>
      </body>
      </html>
    `);
    newtab.document.close();
    window.close();
  }

  function PROX() {
    const newtab = window;
    window.location.href = "about:blank";

    if (!newtab) {
      alert("Allow pop-ups");
      return;
    }

    newtab.document.open();
    newtab.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TEST</title>
        <style>
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <p>haha u thought</p>
      </body>
      </html>
    `);
    newtab.document.close();
    window.open("", "_self");
    window.close();
  }

  function openSettings() {
    if (document.getElementById("settings")) return;

    const menu = document.createElement("div");
    menu.className = "settings";
    menu.id = "settings";
    menu.innerHTML =
      '<div class="topBar"><h1>Settings</h1><a class="site-control" href="#" role="button" id="settingsReset"><b>Reset Settings</b></a><a class="site-control" href="#" role="button" id="settingsCloseButton" style="margin-left: auto; font-size: 1.4em;"><b>X</b></a></div>';

    const container = document.createElement("div");
    container.className = "scroll-container";
    container.id = "settingsContainer";

    menu.appendChild(container);
    document.body.appendChild(menu);

    addColorSetting("Site Color", "--accent-color");

    document
      .getElementById("settingsCloseButton")
      .addEventListener("click", function (event) {
        event.preventDefault();
        menu.remove();
      });

    document
      .getElementById("settingsContainer")
      .addEventListener("change", (event) => {
        if (event.target.classList.contains("color-picker")) {
          const selectedColor = event.target.value;

          document.documentElement.style.setProperty(
            event.target.id,
            selectedColor,
          );

          localStorage.setItem(event.target.id, selectedColor);
        }
      });
  }

  let storedColors = {};

  function addColorSetting(name, cssId) {
    try {
      const computedStyles = getComputedStyle(document.documentElement);

      let color = computedStyles.getPropertyValue(cssId);

      if (!(cssId in storedColors)) {
        storedColors[cssId] = color;
      }

      document
        .getElementById("settingsReset")
        .addEventListener("click", function (event) {
          event.preventDefault();
          localStorage.setItem(cssId, storedColors[cssId]);

          document.documentElement.style.setProperty(
            cssId,
            storedColors[cssId],
          );

          try {
            document.getElementById("settings").remove();
          } catch (e) {
            // Ignore if already removed.
          }
        });

      const storedColor = localStorage.getItem(cssId);

      if (storedColor) {
        color = storedColor;
      }

      document.documentElement.style.setProperty(cssId, color);

      document.getElementById("settingsContainer").innerHTML +=
        `<div class="settingsOption">
          <h1>${name}</h1>
          <input type="color" class="color-picker" id="${cssId}" value="${color}">
        </div>`;
    } catch (e) {
      alert(e);
    }
  }

  openSettings();
  document.getElementById("settings").remove();


  const homeUrl = new URL("../index.html", document.currentScript.src).href;
  topbar.innerHTML = `
    <div class="topbar">
      <a class="site-control" href="${homeUrl}">Home</a>
      <a class="site-control" href="#" role="button" onclick="event.preventDefault(); ab()">about:blank cloak</a>
      <a class="site-control" href="#" role="button" style="margin-left: auto;" onclick="event.preventDefault(); openSettings()">Settings</a>
    </div>
  `;

  document.body.appendChild(topbar);
} catch (e) {
  alert(e);
}
