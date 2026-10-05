import { escapeHtml, icons } from '../utils/ui.js'

export function renderAuthModal(mode = 'login', errorMessage = '', noticeMessage = '') {
  const isSignup = mode === 'signup'
  const isForgotPassword = mode === 'forgot-password'
  const isUpdatePassword = mode === 'update-password'
  const title = isSignup ? 'Crea tu cuenta' : isForgotPassword ? 'Recupera tu contraseña' : isUpdatePassword ? 'Crea una contraseña nueva' : 'Qué bueno verte'
  const description = isSignup
    ? 'Publica solicitudes y sigue las respuestas.'
    : isForgotPassword
      ? 'Te enviaremos un enlace para restablecerla.'
      : isUpdatePassword
        ? 'Elige una contraseña segura para tu cuenta.'
        : 'Ingresa para publicar y administrar tus solicitudes.'
  const authModes = !isForgotPassword && !isUpdatePassword
    ? `<div class="auth-mode-switch"><button type="button" data-action="auth-mode" data-mode="login" class="${isSignup ? '' : 'active'}">Ingresar</button><button type="button" data-action="auth-mode" data-mode="signup" class="${isSignup ? 'active' : ''}">Crear cuenta</button></div>`
    : ''
  const emailField = !isUpdatePassword
    ? '<label>Correo electrónico<input name="email" type="email" autocomplete="email" required /></label>'
    : ''
  const passwordFields = !isForgotPassword
    ? `<label>${isUpdatePassword ? 'Nueva contraseña' : 'Contraseña'}<input name="password" type="password" autocomplete="${isSignup || isUpdatePassword ? 'new-password' : 'current-password'}" minlength="8" required /></label>${isUpdatePassword ? '<label>Confirmar contraseña<input name="confirm-password" type="password" autocomplete="new-password" minlength="8" required /></label>' : ''}`
    : ''
  const submitLabel = isSignup ? 'Crear cuenta' : isForgotPassword ? 'Enviar enlace' : isUpdatePassword ? 'Guardar contraseña' : 'Ingresar'
  return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title"><div class="modal-header"><div><span class="eyebrow">PACOTIZAR / TU CUENTA</span><h2 id="auth-modal-title">${title}</h2><p>${description}</p></div><button class="close-button" data-action="close-modal" aria-label="Cerrar">×</button></div>${authModes}<form id="auth-form" data-mode="${mode}">${isSignup ? '<label>Nombre<input name="name" autocomplete="name" required maxlength="100" /></label>' : ''}${emailField}${passwordFields}${errorMessage ? `<p class="form-error" role="alert">${escapeHtml(errorMessage)}</p>` : ''}${noticeMessage ? `<p class="auth-notice" role="status">${escapeHtml(noticeMessage)}</p>` : ''}${mode === 'login' ? '<button class="auth-link" type="button" data-action="auth-mode" data-mode="forgot-password">¿Olvidaste tu contraseña?</button>' : ''}${!noticeMessage && !isForgotPassword && !isUpdatePassword ? '<p class="auth-notice">Tu cuenta se autentica con Supabase. Nunca guardamos tu contraseña en este dispositivo.</p>' : ''}<div class="modal-actions">${isForgotPassword || isUpdatePassword ? '<button class="secondary-button" type="button" data-action="auth-mode" data-mode="login">Volver</button>' : ''}<button class="primary-button" type="submit">${submitLabel} ${icons.arrow}</button></div></form></section></div>`
}
