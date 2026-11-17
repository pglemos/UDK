/**
 * Confirmação no padrão visual do painel, no lugar do window.confirm do navegador.
 * Usa <dialog> nativo: foco preso, Esc cancela e o foco volta para quem abriu.
 */
export function confirmAction(message: string, confirmLabel = "Confirmar"): Promise<boolean> {
  if (typeof document === "undefined" || typeof HTMLDialogElement === "undefined") {
    return Promise.resolve(window.confirm(message));
  }
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const dialog = document.createElement("dialog");
  dialog.className = "op-confirm";
  dialog.setAttribute("aria-labelledby", "op-confirm-text");

  const text = document.createElement("p");
  text.id = "op-confirm-text";
  text.textContent = message;

  const actions = document.createElement("div");
  actions.className = "op-confirm-actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "button-secondary";
  cancel.textContent = "Cancelar";
  const accept = document.createElement("button");
  accept.type = "button";
  accept.className = "button-danger";
  accept.textContent = confirmLabel;
  actions.append(cancel, accept);
  dialog.append(text, actions);
  document.body.append(dialog);

  return new Promise((resolve) => {
    const finish = (value: boolean) => {
      dialog.close();
      dialog.remove();
      opener?.focus();
      resolve(value);
    };
    cancel.addEventListener("click", () => finish(false));
    accept.addEventListener("click", () => finish(true));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(false);
    });
    dialog.showModal();
    cancel.focus();
  });
}
