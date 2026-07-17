/**
 * Loading Overlay Module
 * Handles showing and hiding the global form loading overlay
 */

function setLoadingState(isLoading, message = '') {
    const overlay = document.getElementById('form-loading-overlay');
    const loadingMessage = document.getElementById('form-loading-message');

    if (!overlay || !loadingMessage) {
        return;
    }

    loadingMessage.textContent = message || '';
    overlay.style.display = isLoading ? 'flex' : 'none';
}

function showLoading(message = '') {
    setLoadingState(true, message);
}

function hideLoading() {
    setLoadingState(false);
}

export { setLoadingState, showLoading, hideLoading };
