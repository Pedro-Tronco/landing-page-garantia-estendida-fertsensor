/**
 * Form Handler Module
 * Handles form data collection, validation, error display, and loading state
 */

import { showLoading, hideLoading } from './loading-overlay.js';
import { backendFetch } from './api-endpoint-helper.js'
import { getAuthToken, setAuthToken } from './auth.js'
import { clearOtpInputFields } from './otp-input-handler.js'

let currentFormData = null;
let formState = "sendOtpCode"

/**
 * Get form field configuration from the loaded data
 */
function getFieldsConfig(data) {
    return {
        checkboxes: data['login-section']?.checkboxes || [],
        email: data['login-section']?.['email-input'] || [],
        auth: data['login-section']?.['auth-input'] || [],
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
 * Update button label and step explanation
 */
function updateFormState(data, state) {
    const content = data?.["login-section"]?.["states"]?.[state];
    formState = state;

    const button = document.getElementById("submit-button");
    const buttonNote = document.getElementById("submit-button-note");
    const explanation = document.getElementById("auth-explanation");

    if (button) {
        button.innerText = content?.["subbmitButton"]?.["label"];
    }

    if (buttonNote) {
        buttonNote.innerText = content?.["subbmitButton"]?.["note"] ? content["subbmitButton"]["note"] : "";
    }

    if (explanation) {
        explanation.innerText = content?.["explanation"];
    }
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
        const inputSettings = fieldsConfig?.auth;
        const values = Object.keys(formData.inputs)
            .filter(key => key.startsWith("auth_code_"))
            .map(key => formData.inputs[key]);

        const element = document.getElementById('send-email-otp');


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
function toggleLoginPopup(enable) {
    const element = document.getElementById("login-section-target");

    if (!element) {
        return
    }

    if (enable) {
        element.style.display = "grid";
        document.body.style.overflow = 'hidden';
    } else {
        element.style.display = "none";
        document.body.style.overflow = '';
    }
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

function activateOtpTimeout(data) {
    const element = document.getElementById('submit-button');
    let secondsLeft = 60;

    if (!element) {
        return
    };
        
    if (typeof show !== 'undefined') {    
        element.style.display = show ? 'flex' : 'none'
    };
    
    element.disabled = true;
    element.style.backgroundColor = 'var(--text-muted)';
    const label = data?.["login-section"]?.["states"]?.["timeout"]?.["subbmitButton"]?.["label"]

    const timer = setInterval(() => {
        secondsLeft--;
        let timerData = {'secondsLeft': secondsLeft}
        element.innerText = label.replace(/\${(.*?)}/g, (_, key) => timerData[key.trim()]) || `Wait (${secondsLeft}s)`;
        
        if (secondsLeft <= 0 || formState != "verifyOtpCode") {
            clearInterval(timer);
            element.disabled = false;
            secondsLeft = 30;
            element.innerText = data?.["login-section"]?.["states"]?.[formState]?.["subbmitButton"]?.["label"];
            element.style.backgroundColor = 'var(--navy)';
        }
    }, 1000);
}

/**
 * Initialize form submission handler
 */
function initFormHandler(data) {
    const submitButton = document.getElementById('submit-button');
    const exitPopupButton = document.getElementById('exit-login-popup');
    const openPopupButton = document.getElementById('open-login-popup');
    const openPopupButtonReminder = document.getElementById('open-login-popup-reminder');
    const formElement = document.getElementById('login-form');
    const loginBackdrop = document.getElementById('login-section-target');

    updateFormState(data, "sendOtpCode")
    
    if (!submitButton || !exitPopupButton || !openPopupButton || !openPopupButtonReminder) return;    

    submitButton.addEventListener('click', async (e) => {
        showLoading();

        if (formState == "sendOtpCode") {
            await sendOtpCode(data);
        } else if (formState == "verifyOtpCode") {
            await sendOtpCode(data);
        } else if (formState == "proceedToForm") {
            await subbmitForm(data);
        }

        hideLoading();
    });

    exitPopupButton.addEventListener('click', async (e) => {
        toggleLoginPopup(false);
    });

    openPopupButton.addEventListener('click', async (e) => {
        toggleLoginPopup(true);
    });

    openPopupButtonReminder.addEventListener('click', async (e) => {
        toggleLoginPopup(true);
    });

    document.addEventListener('keydown', function(event) {
        if (event.key == 'Enter') {
            event.preventDefault();
            submitButton.click();
        }
        
        if (event.key == 'Escape') {
            event.preventDefault();
            exitPopupButton.click();
        }
    });

    loginBackdrop.addEventListener('click', (e) => {
        if (!formElement.contains(e.target)) {
            toggleLoginPopup(false);
        }
    });
}

const subbmitForm = async (data) => {
    const fieldsConfig = getFieldsConfig(data);
    clearErrors();

    const validation = validateForm(fieldsConfig);

    
    if (!validation.isValid) {
        showErrors(validation.errors);
        return;
    }
    
    const formData = fieldsConfig['formData']
    
    showLoading(fieldsConfig['login-section']?.subbmitButton?.loadingMessage || 'Processing your request...');

    try {
        const token = getAuthToken()

        if (token === 'Bearer null') {
            showErrors([{ field: 'general', message: fieldsConfig.formErrors?.didNotAuthenticate }]);
            return;
        }

        const response = await backendFetch('ws/form-response-url', {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'Accept': '*/*',
            }
        });

        const statusCode = response.status
        const result = await response.json()

        if (statusCode === 401) {
            setAuthToken(null);
            toggleOtpSection(true);
            deactivateEmailInput(false);
            showEmailStatusMessage('', 'var(--text-muted)');
            showErrors([{ field: 'general', message: fieldsConfig.formErrors?.authTokenExpired }]);
            clearOtpInputFields();
            updateFormState(data, "verifyOtpCode");
        } else if (statusCode === 429) {
            showErrors([{ field: 'general', message: result?.message }]);
        } else {
            window.open(result?.url, "_blank");
            toggleLoginPopup(false);
        }

    } catch (error) {
        console.error('API call failed:', error);
        showErrors([{ field: 'general', message: 'An error occurred. Please try again.' }]);
    }
};

const sendOtpCode = async (data) => {
    const fieldsConfig = getFieldsConfig(data);
    clearErrors();

    const validation = validateForm((({ email, formConfig, formData, formErrors }) => ({ email, formConfig, formData, formErrors }))(fieldsConfig));

    if (!validation.isValid) {
        showErrors(validation.errors);
        return;
    }

    const formData = collectFormData();
    
    showLoading(fieldsConfig['login-section']?.subbmitButton?.loadingMessage || 'Processing your request...');
    try {
        const userEmail = formData.inputs['email']

        const payload = {
            'email': userEmail
        };

        const response = await backendFetch('auth/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
            },
            body: JSON.stringify(payload),
        });

        const statusCode = response.status
        const result = await response.json()

        if (statusCode === 429) {
            showErrors([{ field: 'general', message: result?.message }]);
        } else {
            toggleOtpSection(true);
            updateFormState(data, "verifyOtpCode");
            activateOtpTimeout(data);
        }

        return

    } catch (error) {
        console.error('API call failed:', error);
        showErrors([{ field: 'general', message: 'An error occurred. Please try again.' }]);
    } finally {
        hideLoading()
    }
};

const verifyOtpCode = async (data) => {
    const fieldsConfig = getFieldsConfig(data);
    clearErrors();

    const validation = validateForm((({ auth, formConfig, formErrors }) => ({ auth, formConfig, formErrors }))(fieldsConfig));

    if (!validation.isValid) {
        showErrors(validation.errors);
        return;
    }

    const formData = collectFormData();

    showLoading(fieldsConfig['login-section']?.subbmitButton?.loadingMessage || 'Processing your request...');
    try {
        const userEmail = formData.inputs['email']
        const code = Object.keys(formData.inputs)
            .filter(key => key.startsWith("auth_code_"))
            .map(key => formData.inputs[key])
            .join("");

        const payload = {
            'email': userEmail,
            'code': code,
        };

        const response = await backendFetch('auth/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
            },
            body: JSON.stringify(payload),
        });

        const statusCode = response.status;
        const result = await response.json();

        if (statusCode == 401) {
            showErrors([{field: 'auth', message: result.message}]);
            clearOtpInputFields();
        } else if (statusCode == 429) {
            showErrors([{field: 'auth', message: result.message}]);
            clearOtpInputFields();
        } else {
            setAuthToken(result.token);
            toggleOtpSection(false);
            deactivateEmailInput(true);
            updateFormState(data, "proceedToForm");
            showEmailStatusMessage('✔', 'var(--blue)');
        }

        return
    } catch (error) {
        console.error('API call failed:', error);
        showErrors([{ field: 'general', message: 'An error occurred. Please try again.' }]);
    } finally {
        hideLoading()
    }
};

export { initFormHandler, getFieldsConfig, collectFormData, validateForm, validateEmail, verifyOtpCode };
