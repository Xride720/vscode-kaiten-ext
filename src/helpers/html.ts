export const Input = (
  name: string,
  label: string,
  inputHtml: string,
  className?: string
) => `
<div class="input-container ${className || ''}">
  ${inputHtml}
  <fieldset aria-hidden="true" class="input-fieldset">
    <legend class="input-legend">
      <span>
        ${label}
      </span>
    </legend>
  </fieldset>
  <label class="input-label" for="${name}">${label}</label>
</div>
`;