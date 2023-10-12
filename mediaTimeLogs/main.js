

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  initForm();

  document.getElementById("log-form")?.addEventListener("input", (e) => {
    if (e.target.type === 'select-one') {
      e.target.title = `${e.target.selectedOptions[0]?.label ? e.target.selectedOptions[0].label + ' - ' : ''}${e.target.value}`
    } else {
      e.target.title = e.target.value;
    }
    setState({
      form: {
        [e.target.name]: e.target.value
      }
    });

    if (!validateForm()) {
      disableFormBtns(true);
    } else {
      disableFormBtns(false);
    }
  });

  document.getElementById("save-btn")?.addEventListener("click", handleSaveForm);
  document.getElementById("create-btn")?.addEventListener("click", handleSaveForm);
  document.getElementById("cancel-btn")?.addEventListener("click", handleCancelEdit);

  document.getElementById("kaiten-time-logs-list")?.addEventListener("click", handleClickLogList);
  document.querySelector(".commit-btn-cont")?.addEventListener("click", handleClickCommitCont);

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.commit-btn-cont')) {
      document.querySelector('.commit-btn-cont .dropdown')?.classList.remove('open');
    }
  });

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "clearForm": {
        clearForm();
        break;
      }
      case "updateTimeLogsData": {
        updateTimeLogsData(message.data);
        break;
      }
      case "updateRolesData": {
        updateRolesData(message.data);
        break;
      }
      case "updateCommitsData": {
        updateCommitsData(message.data);
        break;
      }
      case "setEditedTimeLog": {
        setState({
          form: {
            role_id: message.data.role_id,
            time_spent: message.data.time_spent,
            for_date: message.data.for_date,
            comment: message.data.comment,
          }
        });
        initForm();
        if (!validateForm()) {
          disableFormBtns(true);
        } else {
          disableFormBtns(false);
        }
        break;
      }
    }
  });


  /**
   * 
   * @param {string} timeLogsHtml 
   */
  function updateTimeLogsData(timeLogsHtml) {
    const contEl = document.querySelector("#kaiten-time-logs-list");
    if (!contEl) return;

    contEl.innerHTML = timeLogsHtml; 
  }
  /**
   * 
   * @param {string} roleOptionsHtml 
   */
  function updateRolesData(roleOptionsHtml) {
    const contEl = document.querySelector("#role_select");
    if (!contEl) return;

    contEl.innerHTML = roleOptionsHtml; 
  }
  /**
   * 
   * @param {string} commitListHtml 
   */
  function updateCommitsData(commitListHtml) {
    const contEl = document.querySelector("#commit-list");
    if (!contEl) return;

    contEl.innerHTML = commitListHtml; 
  }

  function validateForm() {
    const form = document.getElementById('log-form');
    if (!form) return;
    let validated = true;
    const formState = getState().form;
    const validate = (key) => {
      const v = formState[key];
      if (v !== undefined && v !== '') {
        form.elements[key].parentNode.classList.remove('invalid-value');
      } else {
        form.elements[key].parentNode.classList.add('invalid-value');
        validated = false;
      }
    };
    validate('role_id');
    validate('time_spent');
    validate('for_date');

    return validated;
  }

  function handleSaveForm(e) {
    e.preventDefault();
    e.stopPropagation();
    const state = getState();
    if (!state || !validateForm()) return;

    vscode.postMessage({
      type: state.editedLogId ? 'updateTimeLog' : 'addTimeLog',
      payload: {
        ...state.form,
        id: state.editedLogId
      },
    });

    clearForm();
  }

  function handleCancelEdit(e) {
    e.preventDefault();
    e.stopPropagation();
    setState({
      editedLogId: null
    });

    clearForm();
  }

  function handleClickLogList(e) {
    if (!e.target.closest('.time-log__item .btn')) return;
    const itemId = e.target.closest('.time-log__item').dataset.id;
    if (e.target.closest(".delete-btn")) {
      vscode.postMessage({
        type: 'removeTimeLog',
        payload: itemId,
      });
    }
    if (e.target.closest(".edit-btn")) {
      vscode.postMessage({
        type: 'editTimeLog',
        payload: itemId,
      });
      setState({
        editedLogId: itemId
      });
    }
  }

  function handleClickCommitCont(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.closest('.commit-btn-cont .dropdown')) {
      if (e.target.closest('.commit-btn-cont .commit-list__item')) {
        const commitEl = e.target.closest('.commit-btn-cont .commit-list__item');
        const textArea = document.querySelector('#log-form textarea[name="comment"]');
        if (!textArea) return;
        const message = commitEl.querySelector('.commit-message')?.innerHTML;
        let text = '';
        const start = textArea.selectionStart;
        //ищем последнее положение выделенного символа
        const end = textArea.selectionEnd;
        if (message) text = `${start !== 0 ? "\n" : ''}${message}\n`;
        // текст до + вставка + текст после (если этот код не работает, значит у вас несколько id)
        const finText = textArea.value.substring(0, start) + text + textArea.value.substring(end);
        // подмена значения
        textArea.value = finText;
        // возвращаем фокус на элемент
        textArea.focus();
        // возвращаем курсор на место - учитываем выделили ли текст или просто курсор поставили
        textArea.selectionEnd = ( start == end )? (end + text.length) : end ;
        textArea.dispatchEvent(new InputEvent('input',  { bubbles: true }));
      }
    } else {
      const dropdown = document.querySelector('.commit-btn-cont .dropdown');
      if (!dropdown) return;
      if (dropdown.classList.contains('open')) dropdown.classList.remove('open');
      else dropdown.classList.add('open');
    }

  }

  function initForm() {
    const formState = getState().form;
    const form = document.getElementById('log-form');
    if (!form) return;
    Array.from(form.elements).forEach(elem => {
      elem.value = formState[elem.name] || '';
      if (elem.type === 'select-one') {
        elem.title = `${elem.selectedOptions[0]?.label ? elem.selectedOptions[0].label + ' - ' : ''}${elem.value}`
      } else {
        elem.title = elem.value;
      }
    });
    updateFormBtns(getState().editedLogId);
  }

  function clearForm() {
    setState({
      form: { 
        role_id: undefined,
        time_spent: undefined,
        for_date: getDateNow(),
        comment: ''
      },
      editedLogId: null,
    });
    initForm();
  }

  function setState(data) {
    const oldState = vscode.getState() || {
      form: { 
        role_id: undefined,
        time_spent: undefined,
        for_date: getDateNow(),
        comment: ''
      },
      editedLogId: null,
    };
    if ('editedLogId' in data && oldState.editedLogId !== data.editedLogId) updateFormBtns(data.editedLogId);
    vscode.setState({
      ...oldState,
      ...data,
      form: {
        ...oldState.form,
        ...(data.form || {})
      },
    });
  }

  function getState() {
    return vscode.getState() || {
      form: { 
        role_id: undefined,
        time_spent: undefined,
        for_date: getDateNow(),
        comment: ''
      },
      editedLogId: null,
    };
  }

  /**
   * @param {string | undefined} editedLogId 
   */
  function updateFormBtns(editedLogId) {
    const save = document.getElementById("save-btn");
    const cancel = document.getElementById("cancel-btn");
    const create = document.getElementById("create-btn");
    if (!save || !create || !cancel) return;
    if (editedLogId !== null) {
      save.classList.remove('kaiten-hidden');
      cancel.classList.remove('kaiten-hidden');
      create.classList.add('kaiten-hidden');
    } else {
      create.classList.remove('kaiten-hidden');
      save.classList.add('kaiten-hidden');
      cancel.classList.add('kaiten-hidden');
    }
  }
  /**
   * @param {boolean} disable 
   */
  function disableFormBtns(disable) {
    const save = document.getElementById("save-btn");
    const cancel = document.getElementById("cancel-btn");
    const create = document.getElementById("create-btn");
    if (!save || !create || !cancel) return;
    if (disable) {
      save.disabled = true;
      cancel.disabled = true;
      create.disabled = true;
    } else {
      create.disabled = false;
      save.disabled = false;
      cancel.disabled = false;
    }
  }

  function getDateNow() {
    const [month, day, year] = new Date().toLocaleDateString().split('/');
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
  }

})();
