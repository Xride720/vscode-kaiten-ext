//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  const oldState = vscode.getState() || { colors: [] };

  /** @type {Array<{ value: string }>} */
  let colors = oldState.colors;

  // updateColorList(colors);

  // document.querySelector(".add-color-button").addEventListener("click", () => {
  //   addColor();
  // });

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "updateTaskData": {
        updateTaskData(message.data);
        break;
      }
    }
  });


  /**
   * 
   * @param {string} taskInfoHtml 
   */
  function updateTaskData(taskInfoHtml) {
    const contEl = document.querySelector("#kaiten-task-info");
    if (!contEl) return;

    contEl.innerHTML = taskInfoHtml; 
  }
})();
