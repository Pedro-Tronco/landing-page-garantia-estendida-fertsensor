import { verifyOtpCode } from './form-handler.js'

function initOptHandler(data) {

    const inputs = document.querySelectorAll('.otp-inputs input');

    inputs.forEach((input, index) => {

        // 1. Capture BOTH manual typing AND keyboard suggestions/pastes
        input.addEventListener('input', async (e) => {
            const value = e.target.value;

            // FIX: Check if a multi-digit string was dumped into this box
            if (value.length > 1) {
                // Strip non-numbers and limit payload to remaining empty boxes
                const cleanCode = value.replace(/[^0-9]/g, '').slice(0, inputs.length);
                
                // Distribute data across inputs starting from this input box
                cleanCode.split('').forEach((char, i) => {
                    if (inputs[index + i]) {
                        inputs[index + i].value = char;
                    }
                });

                // Auto-submit if the code reaches the final block length
                await verifyOtpCode(data);
                inputs[inputs.length - 1].focus();
                return;
            }

            // Normal workflow: Move forward on single-character input
            if (value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            if (value.length === 1 && index == inputs.length - 1) {
                await verifyOtpCode(data);
            }
        });

        // Move backward on backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Keep standard desktop right-click/long-press paste listener intact as a backup
        input.addEventListener('paste', async (e) => {
            e.preventDefault(); // Prevent double injection alongside the input handler
            const value = e.clipboardData.getData('text');
            const cleanCode = value.replace(/[^0-9]/g, '').slice(0, inputs.length);

            if (cleanCode.length === inputs.length) {
                inputs.forEach((inp, i) => {
                    inp.value = cleanCode[i];
                });
                await verifyOtpCode(data);
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