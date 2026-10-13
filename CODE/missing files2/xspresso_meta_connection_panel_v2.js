import { MetaConnectionApi } from './xspresso_meta_connection_api_v2.js';

const node = (tag, text, className) => {
  const item = document.createElement(tag);
  if (text != null) item.textContent = text;
  if (className) item.className = className;
  return item;
};

export function mountMetaConnectionPanel({ root = document.getElementById('app'), api = new MetaConnectionApi() } = {}) {
  if (!root) return null;
  let observer;
  const build = () => {
    if (document.getElementById('xspresso-meta-connection-v2')) return;
    const target = root.querySelector('main') || root;
    const panel = node('section', null, 'meta-connect-card');
    panel.id = 'xspresso-meta-connection-v2';
    panel.setAttribute('aria-labelledby', 'meta-connect-title-v2');
    const heading = node('h2', 'Meta Ads connection');
    heading.id = 'meta-connect-title-v2';
    const status = node('p', 'Checking connection…', 'meta-connect-status');
    status.setAttribute('role', 'status');
    const form = node('form', null, 'meta-connect-form');
    const accountLabel = node('label', 'Ad account ID');
    const account = node('input');
    account.name = 'adAccountId'; account.inputMode = 'numeric'; account.required = true;
    account.autocomplete = 'off'; account.maxLength = 32;
    accountLabel.append(account);
    const currencyLabel = node('label', 'Account currency (ISO code)');
    const currency = node('input');
    currency.name = 'currency'; currency.value = 'USD'; currency.required = true;
    currency.pattern = '[A-Za-z]{3}'; currency.maxLength = 3; currency.autocomplete = 'off';
    currencyLabel.append(currency);
    const connect = node('button', 'Connect Meta'); connect.type = 'submit';
    const disconnect = node('button', 'Disconnect'); disconnect.type = 'button';
    disconnect.className = 'meta-connect-secondary';
    const message = node('p', '', 'meta-connect-message'); message.setAttribute('aria-live', 'polite');
    form.append(accountLabel, currencyLabel, connect, disconnect);
    panel.append(heading, status, form, message);
    target.prepend(panel);

    const refresh = async () => {
      const token = sessionStorage.getItem('xspresso_token');
      if (!token) { status.textContent = 'Sign in to connect a Meta ad account.'; return; }
      try {
        const result = await api.status();
        const connection = result.connections?.[0];
        if (connection) {
          status.textContent = `Connected: ad account ${connection.adAccountId} (${connection.currency}).`;
          account.value = connection.adAccountId || '';
          currency.value = connection.currency || 'USD';
          disconnect.hidden = false;
        } else {
          status.textContent = 'No Meta ad account is connected.';
          disconnect.hidden = true;
        }
      } catch (error) {
        status.textContent = error.status === 401 ? 'Sign in to connect a Meta ad account.' : error.message;
      }
    };
    form.addEventListener('submit', async event => {
      event.preventDefault(); message.textContent = '';
      if (!form.reportValidity()) return;
      connect.disabled = true;
      try {
        const result = await api.connect({ adAccountId: account.value.trim(), currency: currency.value.trim().toUpperCase() });
        if (!result.authorizationUrl) throw new Error('The server did not return an authorization URL.');
        window.location.assign(result.authorizationUrl);
      } catch (error) { message.textContent = error.message; connect.disabled = false; }
    });
    disconnect.addEventListener('click', async () => {
      disconnect.disabled = true; message.textContent = '';
      try { await api.disconnect(); status.textContent = 'Meta account disconnected.'; disconnect.hidden = true; }
      catch (error) { message.textContent = error.message; }
      finally { disconnect.disabled = false; }
    });
    void refresh();
    document.addEventListener('submit', () => setTimeout(() => void refresh(), 400), { once: true });
    window.addEventListener('focus', () => void refresh());
  };
  build();
  observer = new MutationObserver(() => build());
  observer.observe(root, { childList: true, subtree: true });
  return () => observer?.disconnect();
}

if (typeof document !== 'undefined') mountMetaConnectionPanel();
