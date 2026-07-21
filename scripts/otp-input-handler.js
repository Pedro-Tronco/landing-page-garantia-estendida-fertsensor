import { verifyOtpCode } from './form-handler.js'

function initOptHandler(data) {

    const inputs = document.querySelectorAll('.otp-inputs input');

    inputs.forEach((input, index) => {

        // Move forward on input
        input.addEventListener('input', async (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            if (e.target.value.length === 1 && index == inputs.length - 1) {
                await verifyOtpCode(data)
            }
        });

        // Move backward on backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Handle pasting of 6-digit codes
        input.addEventListener('paste', async (e) => {
            const content = e.clipboardData.getData('text');
            if (content.length === inputs.length) {
                inputs.forEach((inp, i) => {
                    inp.value = content[i];
                });
                await verifyOtpCode(data)
                inputs[inputs.length - 1].focus();
            }
        });

        // Force immediate activation and highlight text on a single click/tap
        input.addEventListener('focus', (e) => {
            const firstEmptyIndex = Array.from(inputs).findIndex(inp => inp.value.length === 0);
            
            if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
                inputs[firstEmptyIndex].focus();
            }
        });
    });
}

function clearOtpInputFields() {
    const inputs = document.querySelectorAll('.otp-inputs input');

    inputs.forEach((input, index) => {
        input.value = null
    });

    inputs[0].focus()
}

export { initOptHandler, clearOtpInputFields }