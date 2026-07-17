/**
 * Form Handler Module
 * Handles form data collection, validation, error display, and loading state
 */

import { showLoading, hideLoading } from './loading-overlay.js';
import { backend_url } from './load-page.js'
import { getAuthToken, setAuthToken } from './auth.js'

let currentFormData = null;

/**
 * Get form field configuration from the loaded data
 */
function getFieldsConfig(data) {
    return {
        checkboxes: data['policy-section']?.checkboxes || [],
        email: data['policy-section']['email-input'] || [],
        auth: data['policy-section']['auth-input'] || [],
        formConfig: data.formConfig || {},
        formErrors: data.formErrors || {},
    };
}

/**
 * Collect form data from all input fields matching the JSON schema
 */
function collectFormData() {
    const formData = {
        checkboxes: {},
        inputs: {}
    };

    // Collect checkbox values
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        const id = checkbox.id;
        if (id) {
            formData.checkboxes[id] = checkbox.checked;
        }
    });

    // Collect input field values
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"]').forEach((input) => {
        const id = input.id;
        if (id) {
            formData.inputs[id] = input.value.trim();
        }
    });

    return formData;
}

/**
 * Validate email using custom regex from form config
 */
function validateEmail(email, emailRegex) {
    if (!emailRegex) {
        // Fallback: basic email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    const regex = new RegExp(emailRegex);
    return regex.test(email);
}

/**
 * Validate form: check required fields and email format
 */
function validateForm(fieldsConfig) {
    const errors = [];
    const formData = collectFormData();

    // Check required checkboxes
    if (fieldsConfig?.checkboxes) {
        fieldsConfig.checkboxes.forEach((checkbox) => {
            if (checkbox.isRequired && !formData.checkboxes[checkbox.id]) {
                errors.push({
                    field: checkbox.id,
                    message: fieldsConfig.formErrors.termsRequired || 'This field is required.'
                });
            }
        });
    }

    // Check and validate email
    if (fieldsConfig?.email) {
        const input = fieldsConfig?.email
        const value = formData.inputs['email'];

        if (input.isRequired && !value) {
            errors.push({
                field: 'email',
                message: fieldsConfig.formErrors.emailInvalid || 'Please enter a valid email address.'
            });
        }

        if (value) {
            if (!validateEmail(value, fieldsConfig.formConfig.emailRegex)) {
                errors.push({
                    field: 'email',
                    message: fieldsConfig.formErrors.emailInvalid || 'Please enter a valid email address.'
                });
            }
        }
    }

    // Check and validate auth
    if (fieldsConfig?.auth) {
        const inputSettings = fieldsConfig?.auth
        const values = Object.keys(formData.inputs)
            .filter(key => key.startsWith("auth_code_"))
            .map(key => formData.inputs[key])

        for (const value of values) {
            if (inputSettings.isRequired && !value) {
                errors.push({
                    field: inputSettings.id,
                    message: fieldsConfig.formErrors.invalidAuthCode || 'Validation code expired or invalid. You can reset the code by pressing "Submit" next your email.'
                });
                break;
            };
        };
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Display validation errors in the error container
 */
function showErrors(errors) {
    const errorContainer = document.getElementById('form-errors-container');
    if (!errorContainer) return;

    errorContainer.innerHTML = '';
    const errorList = document.createElement('ul');
    errorList.className = 'form-errors-list';

    errors.forEach((error) => {
        const errorItem = document.createElement('li');
        errorItem.textContent = error.message;
        errorList.appendChild(errorItem);
    });

    errorContainer.appendChild(errorList);
    errorContainer.style.display = 'block';
}

/**
 * Clear all error messages
 */
function clearErrors() {
    const errorContainer = document.getElementById('form-errors-container');
    if (errorContainer) {
        errorContainer.innerHTML = '';
        errorContainer.style.display = 'none';
    }
}
/**
 * Display/hide one time passcode Section
 */
function toggleOtpSection(show) {
    const element = document.querySelector('.auth-field');

    if (!element) {
        return
    };

    element.style.display = show ? 'flex' : 'none'
}

/**
 * Update email status
 */
function showEmailStatusMessage(status, color) {
    const element = document.querySelector('.email-status-message');

    if (!element) {
        return
    }

    element.textContent = status;
    element.style.color = color;
}

/**
 * Update email status
 */
function deactivateEmailInput(deactivate) {
    const element = document.getElementById('email');

    if (!element) {
        return
    };

    element.readOnly = deactivate ? true : false
}

function updateSendOptCodeButton({show, message, timeout, timeoutMsg} = {}) {
    const element = document.getElementById('send-email-otp');
    let secondsLeft = 30;

    if (!element) {
        return
    };
        
    if (typeof show !== 'undefined') {    
        element.style.display = show ? 'flex' : 'none'
    };
    
    if (message) {
        element.innerText = message
    };
        
    if (timeout) {    
        element.disabled = true;
        element.style.backgroundColor = 'var(--text-muted)';
        var previousInnerText = element.innerText
  
        const timer = setInterval(() => {
            secondsLeft--;
            let data = {'secondsLeft': secondsLeft}
            element.innerText = timeoutMsg.replace(/\${(.*?)}/g, (_, key) => data[key.trim()]) || `Wait (${secondsLeft}s)`;
            
            if (secondsLeft <= 0) {
                clearInterval(timer);
                element.disabled = false;
                secondsLeft = 30;
                element.innerText = previousInnerText;
                element.style.backgroundColor = 'var(--navy)';
            }
        }, 1000);
    };
}

/**
 * Initialize form submission handler
 */
function initFormHandler(data) {
    const submitButton = document.getElementById('submit-button');
    const sendEmailButton = document.getElementById('send-email-otp');
    const fieldsConfig = getFieldsConfig(data);
    
    if (!submitButton || !sendEmailButton) return;

    updateSendOptCodeButton({message: fieldsConfig.email?.buttonLabel?.confirm})
    
    submitButton.addEventListener('click', async (e) => {
        e.preventDefault();
        clearErrors();

        const validation = validateForm(fieldsConfig);

        
        if (!validation.isValid) {
            showErrors(validation.errors);
            return;
        }
        
        const formData = fieldsConfig['formData']
        
        showLoading(fieldsConfig['policy-section']?.subbmitButton?.loadingMessage || 'Processing your request...');

        try {
            const lang = document.documentElement.lang
            const token = getAuthToken()

            if (token === 'Bearer null') {
                showErrors([{ field: 'general', message: fieldsConfig.formErrors?.didNotAuthenticate }]);
                return;
            }

            const response = await fetch(`${backend_url}/ws/form-response-url`,{
                method: 'GET',
                headers: {
                    'Language': lang,
                    'Authorization': token,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                }
            });

            const statusCode = response.status
            const data = await response.json()

            if (statusCode === 401) {
                setAuthToken(null);
                toggleOtpSection(true);
                updateSendOptCodeButton({show: true});
                deactivateEmailInput(false);
                showEmailStatusMessage('', 'var(--text-muted)');
                showErrors([{ field: 'general', message: fieldsConfig.formErrors?.authTokenExpired }]);

            } else if (statusCode === 429) {
                showErrors([{ field: 'general', message: data?.message }]);
            } else {
                window.open(data?.url, "_blank")
            }

        } catch (error) {
            console.error('API call failed:', error);
            showErrors([{ field: 'general', message: 'An error occurred. Please try again.' }]);
        } finally {
            hideLoading();
        }
    });

    sendEmailButton.addEventListener('click', async (e) => {
        e.preventDefault();
        clearErrors();

        const validation = validateForm((({ email, formConfig, formData, formErrors }) => ({ email, formConfig, formData, formErrors }))(fieldsConfig));

        if (!validation.isValid) {
            showErrors(validation.errors);
            return;
        }

        const formData = collectFormData();
        
        showLoading(fieldsConfig['policy-section']?.subbmitButton?.loadingMessage || 'Processing your request...');
        try {
            const userEmail = formData.inputs['email']
            const lang = document.documentElement.lang

            const payload = {
                'email': userEmail
            };

            const response = await fetch(`${backend_url}/auth/request`, {
                method: 'POST',
                headers: {
                    'Language': lang,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                },
                body: JSON.stringify(payload),
            });

            toggleOtpSection(true)
            updateSendOptCodeButton({message: fieldsConfig.email?.buttonLabel?.resendCode, timeout: true, timeoutMsg: fieldsConfig.email?.buttonLabel?.timeout})

        } catch (error) {
            console.error('API call failed:', error);
            showErrors([{ field: 'general', message: 'An error occurred. Please try again.' }]);
        } finally {
            hideLoading()
        }
        
    });

}

const verifyOtpCode = async (data) => {
    clearErrors();
    const fieldsConfig = getFieldsConfig(data);

    const validation = validateForm((({ auth, formConfig, formErrors }) => ({ auth, formConfig, formErrors }))(fieldsConfig));

    if (!validation.isValid) {
        showErrors(validation.errors);
        return;
    }

    const formData = collectFormData();

    showLoading(fieldsConfig['policy-section']?.subbmitButton?.loadingMessage || 'Processing your request...');
    try {
        const userEmail = formData.inputs['email']
        const lang = document.documentElement.lang
        const code = Object.keys(formData.inputs)
            .filter(key => key.startsWith("auth_code_"))
            .map(key => formData.inputs[key])
            .join("");

        const payload = {
            'email': userEmail,
            'code': code,
        };

        const response = await fetch(`${backend_url}/auth/validate`, {
            method: 'POST',
            headers: {
                'Language': lang,
                'Content-Type': 'application/json',
                'Accept': '*/*',
            },
            body: JSON.stringify(payload),
        });

        const statusCode = response.status;
        const data = await response.json();

        if (statusCode == 401) {
            showErrors([{field: 'auth', message: data.message}])
        } else {
            setAuthToken(data.token);
            toggleOtpSection(false);
            updateSendOptCodeButton({show: false});
            deactivateEmailInput(true);
            showEmailStatusMessage('✔', 'var(--blue)');
        }
    } catch (error) {
        console.error('API call failed:', error);
        showErrors([{ field: 'general', message: 'An error occurred. Please try again.' }]);
    } finally {
        hideLoading()
    }
};

export { initFormHandler, getFieldsConfig, collectFormData, validateForm, validateEmail, verifyOtpCode };
