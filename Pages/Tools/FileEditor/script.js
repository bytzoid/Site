let editor;
let currentFileHandle = null;
let rootDirectoryHandle = null;

const fileContainer = document.getElementById("fileContainer");
const status = document.getElementById("editorStatus");

function setStatus(message) {
    status.textContent = message;
}

function bindAction(id, action) {
    document.getElementById(id).addEventListener("click", async event => {
        event.preventDefault();

        try {
            await action();
        } catch (error) {
            setStatus(error.message);
        }
    });
}

require.config({
    paths: {
        vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs"
    }
});

require(["vs/editor/editor.main"], () => {
    const container = document.getElementById("container");
    editor = monaco.editor.create(container, {
        value: "",
        language: "html",
        theme: "vs-dark",
        automaticLayout: true
    });

    bindAction("openButton", openLocalFolder);
    bindAction("saveButton", saveCurrentFile);
    bindAction("runButton", runAsHtml);
    bindAction("settingsButton", openSettings);
});

async function openLocalFolder() {
    if (!window.showDirectoryPicker) {
        throw new Error(
            "Folder access is unavailable in this browser. Open the site on localhost or in a supported browser."
        );
    }

    try {
        rootDirectoryHandle = await window.showDirectoryPicker({
            mode: "readwrite"
        });
    } catch (error) {
        if (error.name === "AbortError") {
            setStatus("Folder selection cancelled.");
            return;
        }
        throw error;
    }

    currentFileHandle = null;
    fileContainer.replaceChildren();
    await renderDirectory(fileContainer, rootDirectoryHandle);
    setStatus(`Opened folder: ${rootDirectoryHandle.name}`);
}

async function renderDirectory(container, directoryHandle) {
    const entries = [];
    for await (const entry of directoryHandle.values()) {
        entries.push(entry);
    }

    entries.sort((a, b) => {
        if (a.kind !== b.kind) {
            return a.kind === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    container.replaceChildren();

    if (entries.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "This folder is empty.";
        container.appendChild(emptyMessage);
        return;
    }

    for (const entry of entries) {
        const row = document.createElement("div");
        row.className = entry.kind === "directory"
            ? "directory-entry closed"
            : "file-entry";

        const label = document.createElement("p");
        label.textContent = entry.name;
        row.appendChild(label);

        label.addEventListener("click", async () => {
            if (entry.kind === "directory") {
                const childContainer = row.querySelector(".subdirectory");
                if (childContainer) {
                    childContainer.remove();
                    row.classList.replace("open", "closed");
                    return;
                }

                const child = document.createElement("div");
                child.className = "subdirectory";
                row.appendChild(child);
                row.classList.replace("closed", "open");
                await renderDirectory(child, entry);
                return;
            }

            const file = await entry.getFile();
            editor.setValue(await file.text());
            currentFileHandle = entry;
            setStatus(`Opened ${entry.name}`);
        });

        container.appendChild(row);
    }
}

async function saveCurrentFile() {
    if (!currentFileHandle) {
        throw new Error("Open a file before saving.");
    }

    const writable = await currentFileHandle.createWritable();
    await writable.write(editor.getValue());
    await writable.close();
    setStatus(`Saved ${currentFileHandle.name}`);
}

function runAsHtml() {
    const preview = window.open("", "_blank");
    if (!preview) {
        throw new Error("Allow pop-ups to run the HTML preview.");
    }

    preview.document.open();
    preview.document.write(editor.getValue());
    preview.document.close();
}

document.getElementById("langDropdown").addEventListener("change", event => {
    if (!editor) {
        return;
    }

    const model = editor.getModel();
    monaco.editor.setModelLanguage(model, event.target.value);
});

const defaultColors = {
    "--background": "#303030",
    "--area-background": "#202020",
    "--min-border": "#038303",
    "--main-border": "#007700",
    "--button-color": "#038303",
    "--text-color": "#ffffff"
};

function openSettings() {
    if (document.getElementById("settings")) {
        return;
    }

    const menu = document.createElement("div");
    menu.className = "settings";
    menu.id = "settings";
    menu.innerHTML =
        '<div class="topBar"><h1>Settings</h1><a class="editor-control" href="#" role="button" id="settingsReset">Reset Settings</a><a class="editor-control" href="#" role="button" id="settingsCloseButton" style="margin-left:auto">Close</a></div>';

    const container = document.createElement("div");
    container.className = "scroll-container";
    container.id = "settingsContainer";
    menu.appendChild(container);
    document.body.appendChild(menu);

    for (const [cssProperty, defaultColor] of Object.entries(defaultColors)) {
        const label = document.createElement("label");
        label.className = "settingsOption";
        label.textContent = cssProperty;

        const input = document.createElement("input");
        input.type = "color";
        input.className = "color-picker";
        input.value = localStorage.getItem(cssProperty) || defaultColor;
        input.addEventListener("input", () => {
            document.documentElement.style.setProperty(cssProperty, input.value);
            localStorage.setItem(cssProperty, input.value);
        });

        label.appendChild(input);
        container.appendChild(label);
        document.documentElement.style.setProperty(cssProperty, input.value);
    }

    document.getElementById("settingsCloseButton").addEventListener("click", event => {
        event.preventDefault();
        menu.remove();
    });

    document.getElementById("settingsReset").addEventListener("click", event => {
        event.preventDefault();
        for (const [cssProperty, defaultColor] of Object.entries(defaultColors)) {
            localStorage.removeItem(cssProperty);
            document.documentElement.style.setProperty(cssProperty, defaultColor);
        }
        menu.remove();
    });
}
