let backendBaseUrl = '';

function normalizeBackendUrl(url) {
  return String(url || '').replace(/\/+$/u, '');
}

function normalizeEndpoint(endpoint) {
  let value = String(endpoint || '').trim();
  if (!value) {
    throw new Error('API endpoint must be a non-empty string');
  }

  value = value.replace(/^\/+/, '');
  if (value.toLowerCase().startsWith('api/')) {
    value = value.replace(/^api\/+/, '');
  }

  return value;
}

function configureBackend(url) {
  backendBaseUrl = normalizeBackendUrl(url);
}

function buildApiUrl(endpoint) {
  if (!backendBaseUrl) {
    throw new Error('Backend base URL is not configured. Call configureBackend() first.');
  }

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  return `${backendBaseUrl}/api/${normalizedEndpoint}`;
}

function createHeaders(initialHeaders, skipLanguageHeader = false) {
  const headers = new Headers(initialHeaders || {});
  if (!skipLanguageHeader && !headers.has('Language')) {
    const language = document.documentElement?.lang || 'en-us';
    headers.set('Language', language);
  }
  return headers;
}

async function backendFetch(endpoint, options = {}) {
  const url = buildApiUrl(endpoint);
  const { skipLanguageHeader, ...restOptions } = options;
  const mergedOptions = {
    ...restOptions,
    headers: createHeaders(options.headers, skipLanguageHeader),
  };

  return fetch(url, mergedOptions);
}

function processStaticApiEndopints(data) {
  // Ensure we are working with an object or array
  if (typeof data !== 'object' || data === null) {
    return;
  }

  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      // If the key matches, override its value
      if (key === 'apiEndpoint') {
        data[key] = buildApiUrl(data[key]);
      }
      
      // If the property value is an object or array, drill down deeper
      if (typeof data[key] === 'object' && data[key] !== null) {
        processStaticApiEndopints(data[key]);
      }
    }
  }
  return data
}

function getApiEndpointElements() {
  const elements = [];

  if (document instanceof Element && document.matches('[data-api-endpoint]')) {
    elements.push(document);
  }
  elements.push(...Array.from(document.querySelectorAll('[data-api-endpoint]')));

  return elements;
}

function processDataApiEndpoints(root = document) {
  const elements = getApiEndpointElements(root);

  for (const element of elements) {
    const endpoint = element.dataset.apiEndpoint;
    if (!endpoint) {
      continue;
    }

    const url = buildApiUrl(endpoint)

    element.href = url
  }
}

export {
  configureBackend,
  buildApiUrl,
  backendFetch,
  processDataApiEndpoints,
  processStaticApiEndopints,
};