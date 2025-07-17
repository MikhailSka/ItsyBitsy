/**
 * FormManager - Handles form validation and submission
 */

class FormManager {
    constructor(eventManager, translationManager = null) {
        this.eventManager = eventManager;
        this.translationManager = translationManager;
        this.forms = new Map();
        this.validators = new Map();
        this.init();
    }

    /**
     * Initialize form manager
     */
    init() {
        this.setupDefaultValidators();
        this.setupEventListeners();
        this.setupFormDetection();
    }

    /**
     * Setup default validation rules
     */
    setupDefaultValidators() {
        // Default validators
        this.addValidator('required', (value) => {
            return value && value.trim().length > 0;
        });

        this.addValidator('email', (value) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        });

        this.addValidator('minLength', (value, min) => {
            return value && value.length >= parseInt(min);
        });

        this.addValidator('maxLength', (value, max) => {
            return !value || value.length <= parseInt(max);
        });

        this.addValidator('phone', (value) => {
            return /^[\+]?[0-9\s\-\(\)]{9,}$/.test(value);
        });

        this.addValidator('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });

        // Field-specific validators
        this.addValidator('name', (value) => {
            return value && value.trim().length >= 2;
        });

        this.addValidator('message', (value) => {
            return value && value.trim().length >= 10;
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for form events from EventManager
        this.eventManager.on('formSubmit', this.handleFormSubmission.bind(this));
        
        // Setup form delegation for input events
        document.addEventListener('blur', this.handleFieldBlur.bind(this), true);
        document.addEventListener('input', this.eventManager.debounce(
            this.handleFieldInput.bind(this), 300
        ));
        document.addEventListener('change', this.handleFieldChange.bind(this));
    }

    /**
     * Automatically detect and setup forms
     */
    setupFormDetection() {
        // Setup contact form if it exists
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            this.setupForm('contactForm', {
                submitEndpoint: '/api/contact.php', // Placeholder PHP endpoint
                successMessage: 'form_success',
                errorMessage: 'form_error',
                validationErrorMessage: 'form_validation_error',
                // Use custom PHP email handler
                onSuccess: this.handleEmailSubmissionSuccess.bind(this),
                onError: this.handleEmailSubmissionError.bind(this)
            });
        }

        // Auto-detect other forms
        document.querySelectorAll('form').forEach((form, index) => {
            if (!form.id) {
                form.id = `auto-form-${index}`;
            }
            
            if (!this.forms.has(form.id)) {
                this.setupForm(form.id);
            }
        });
    }

    /**
     * PLACEHOLDER FUNCTION FOR PHP EMAIL INTEGRATION
     * 
     * This function handles successful email submissions.
     * Developers should customize this based on their PHP backend response.
     * 
     * @param {Object} response - Server response from PHP script
     * @param {HTMLFormElement} form - The contact form element
     */
    async handleEmailSubmissionSuccess(response, form) {
        console.log('📧 Email submission successful:', response);
        
        // Parse PHP response (adjust based on your PHP script response format)
        let responseData = response;
        
        // If response is a string, try to parse as JSON
        if (typeof response === 'string') {
            try {
                responseData = JSON.parse(response);
            } catch (e) {
                // If not JSON, treat as plain text success message
                responseData = { success: true, message: response };
            }
        }
        
        // Check if PHP script indicates success
        if (responseData.success) {
            // Show success message
            this.showNotification(
                responseData.message || 'Thank you! Your message has been sent successfully.',
                'success'
            );
            
            // Reset form
            form.reset();
            
            // Remove any error states
            form.querySelectorAll('.error').forEach(field => {
                this.removeFieldError(field);
            });
            
            // Optional: Track successful submission (for analytics)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submit', {
                    event_category: 'Contact',
                    event_label: 'Email Sent Successfully'
                });
            }
            
            // Emit success event for other parts of the application
            this.eventManager.emit('emailSent', {
                form,
                response: responseData,
                formId: 'contactForm'
            });
            
        } else {
            // PHP script returned failure
            throw new Error(responseData.message || 'Email sending failed');
        }
    }
    
    /**
     * PLACEHOLDER FUNCTION FOR PHP EMAIL ERROR HANDLING
     * 
     * This function handles email submission errors.
     * Developers can customize error handling based on their needs.
     * 
     * @param {Error} error - Error object or response
     * @param {HTMLFormElement} form - The contact form element
     */
    async handleEmailSubmissionError(error, form) {
        console.error('📧 Email submission failed:', error);
        
        // Extract error message
        let errorMessage = 'Sorry, there was an error sending your message. Please try again.';
        
        if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        // Show error message to user
        this.showNotification(errorMessage, 'error');
        
        // Optional: Track failed submission (for monitoring)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_error', {
                event_category: 'Contact',
                event_label: 'Email Send Failed',
                value: error.message || 'Unknown error'
            });
        }
        
        // Emit error event for other parts of the application
        this.eventManager.emit('emailError', {
            form,
            error,
            formId: 'contactForm'
        });
        
        // Optional: Send error to error tracking service
        // if (window.errorTracker) {
        //     window.errorTracker.captureException(error, {
        //         context: 'contact_form_submission',
        //         formData: new FormData(form)
        //     });
        // }
    }

    /**
     * HELPER FUNCTION: Format form data for PHP email script
     * 
     * This function prepares form data in a format suitable for PHP processing.
     * Can be customized based on PHP script requirements.
     * 
     * @param {FormData} formData - Raw form data
     * @returns {Object} Formatted data object
     */
    formatDataForPHP(formData) {
        const data = {};
        
        // Convert FormData to regular object
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Add additional data that PHP script might need
        data.timestamp = new Date().toISOString();
        data.userAgent = navigator.userAgent;
        data.referrer = document.referrer;
        data.currentUrl = window.location.href;
        
        // Optional: Add basic spam protection
        data.honeypot = ''; // PHP should check this is empty
        data.submitTime = Date.now(); // PHP can check submission speed
        
        return data;
    }

    /**
     * Submit form data
     * WordPress Compatible Version
     */
    async submitForm(formData, formType = 'contact') {
        console.log('FormManager: Submitting form', { formType, data: formData });
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Special handling for contact form in WordPress environment
            if (formType === 'contact') {
                return await this.submitContactFormWordPress(formData);
            }
            
            // Handle other form types here
            throw new Error('Form type not supported yet');
            
        } catch (error) {
            console.error('FormManager: Form submission error:', error);
            this.handleEmailSubmissionError(error.message);
            return false;
        }
    }

    /**
     * Submit contact form to WordPress AJAX handler
     */
    async submitContactFormWordPress(formData) {
        // Check if we're in WordPress environment
        const isWordPress = typeof itsybitsy_ajax !== 'undefined';
        
        if (isWordPress) {
            // WordPress AJAX submission
            const response = await fetch(itsybitsy_ajax.ajax_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: itsybitsy_ajax.action,
                    nonce: itsybitsy_ajax.nonce,
                    ...this.formatDataForPHP(formData),
                    submitTime: Date.now()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.handleEmailSubmissionSuccess(result.data.message);
                return true;
            } else {
                throw new Error(result.data.message || 'Failed to send message');
            }
        } else {
            // Fallback to standalone PHP (non-WordPress)
            console.warn('WordPress AJAX not detected, falling back to standalone PHP');
            return await this.submitContactFormStandalone(formData);
        }
    }

    /**
     * Submit contact form to standalone PHP (non-WordPress fallback)
     */
    async submitContactFormStandalone(formData) {
        const response = await fetch('api/contact.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                ...this.formatDataForPHP(formData),
                submitTime: Date.now()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Network error occurred');
        }

        const result = await response.json();
        
        if (result.success) {
            this.handleEmailSubmissionSuccess(result.message);
            return true;
        } else {
            throw new Error(result.message || 'Failed to send message');
        }
    }

    /**
     * Setup a specific form
     * @param {string} formId - Form ID
     * @param {Object} options - Form configuration options
     */
    setupForm(formId, options = {}) {
        const form = document.getElementById(formId);
        if (!form) {
            console.warn(`Form with ID ${formId} not found`);
            return;
        }

        const formConfig = {
            id: formId,
            element: form,
            submitEndpoint: options.submitEndpoint || '/wp-admin/admin-ajax.php',
            method: options.method || 'POST',
            successMessage: options.successMessage || 'Form submitted successfully',
            errorMessage: options.errorMessage || 'Form submission failed',
            validationErrorMessage: options.validationErrorMessage || 'Please correct the errors below',
            showNotifications: options.showNotifications !== false,
            preventDefault: options.preventDefault !== false,
            validateOnInput: options.validateOnInput !== false,
            validateOnBlur: options.validateOnBlur !== false,
            customValidators: options.customValidators || {},
            beforeSubmit: options.beforeSubmit || null,
            afterSubmit: options.afterSubmit || null,
            onSuccess: options.onSuccess || null,
            onError: options.onError || null
        };

        // Add custom validators for this form
        Object.entries(formConfig.customValidators).forEach(([name, validator]) => {
            this.addValidator(name, validator);
        });

        this.forms.set(formId, formConfig);
        
        // Setup field validation attributes
        this.setupFormFields(form);
        
        // Add form submission event listener
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            this.eventManager.emit('formSubmit', {
                form,
                formData,
                originalEvent: event
            });
        });
        
        console.log(`FormManager: Setup form ${formId} with endpoint ${formConfig.submitEndpoint}`);

    }

    /**
     * Setup validation attributes for form fields
     * @param {HTMLFormElement} form - Form element
     */
    setupFormFields(form) {
        const fields = form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            // Add validation attributes based on field properties
            if (field.hasAttribute('required') && !field.hasAttribute('data-validator')) {
                field.setAttribute('data-validator', 'required');
            }
            
            if (field.type === 'email') {
                const validators = field.getAttribute('data-validator') || '';
                if (!validators.includes('email')) {
                    field.setAttribute('data-validator', validators ? `${validators},email` : 'email');
                }
            }
            
            if (field.name === 'name' || field.name === 'firstName' || field.name === 'lastName') {
                const validators = field.getAttribute('data-validator') || '';
                if (!validators.includes('name')) {
                    field.setAttribute('data-validator', validators ? `${validators},name` : 'name');
                }
            }
            
            if (field.name === 'message' && field.tagName === 'TEXTAREA') {
                const validators = field.getAttribute('data-validator') || '';
                if (!validators.includes('message')) {
                    field.setAttribute('data-validator', validators ? `${validators},message` : 'message');
                }
            }
        });
    }

    /**
     * Add a custom validator
     * @param {string} name - Validator name
     * @param {Function} validatorFunction - Validation function
     */
    addValidator(name, validatorFunction) {
        this.validators.set(name, validatorFunction);
    }

    /**
     * Validate a single field
     * @param {HTMLElement} field - Form field element
     * @returns {boolean} Validation result
     */
    validateField(field) {
        const value = field.value.trim();
        const validators = field.getAttribute('data-validator');
        
        if (!validators) return true;
        
        // Remove existing errors
        this.removeFieldError(field);
        
        const validatorList = validators.split(',').map(v => v.trim());
        
        for (const validatorName of validatorList) {
            // Parse validator with parameters (e.g., "minLength:5")
            const [name, ...params] = validatorName.split(':');
            const validator = this.validators.get(name);
            
            if (!validator) {
                console.warn(`Validator ${name} not found`);
                continue;
            }
            
            // Skip validation for empty optional fields
            if (!field.hasAttribute('required') && !value && name !== 'required') {
                continue;
            }
            
            if (!validator(value, ...params)) {
                const errorMessage = this.getErrorMessage(field.name, name, params);
                this.addFieldError(field, errorMessage);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Validate entire form
     * @param {HTMLFormElement} form - Form element
     * @returns {boolean} Validation result
     */
    validateForm(form) {
        const fields = form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        fields.forEach(field => {
            const fieldValid = this.validateField(field);
            if (!fieldValid) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Add error styling and message to field
     * @param {HTMLElement} field - Form field
     * @param {string} message - Error message
     */
    addFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        this.removeFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        // Insert after the field or its wrapper
        const wrapper = field.closest('.form-group') || field.parentNode;
        wrapper.appendChild(errorDiv);
        
        // Add error class to wrapper if it exists
        if (wrapper.classList.contains('form-group')) {
            wrapper.classList.add('has-error');
        }
    }

    /**
     * Remove error styling and message from field
     * @param {HTMLElement} field - Form field
     */
    removeFieldError(field) {
        field.classList.remove('error');
        
        const wrapper = field.closest('.form-group') || field.parentNode;
        const errorDiv = wrapper.querySelector('.field-error');
        
        if (errorDiv) {
            errorDiv.remove();
        }
        
        if (wrapper.classList.contains('form-group')) {
            wrapper.classList.remove('has-error');
        }
    }

    /**
     * Get error message for field validation
     * @param {string} fieldName - Field name
     * @param {string} validatorName - Validator name
     * @param {Array} params - Validator parameters
     * @returns {string} Error message
     */
    getErrorMessage(fieldName, validatorName, params = []) {
        // Try to get translated message first
        const translationKey = `error_${fieldName}_${validatorName}`;
        let message = this.translate(translationKey);
        
        if (message === translationKey) {
            // Fallback to generic validator message
            message = this.translate(`error_${validatorName}`);
        }
        
        if (message === `error_${validatorName}`) {
            // Fallback to default messages
            const defaultMessages = {
                required: 'This field is required',
                email: 'Please enter a valid email address',
                minLength: `Minimum ${params[0] || 2} characters required`,
                maxLength: `Maximum ${params[0] || 255} characters allowed`,
                phone: 'Please enter a valid phone number',
                url: 'Please enter a valid URL',
                name: 'Name must be at least 2 characters long',
                message: 'Message must be at least 10 characters long'
            };
            
            message = defaultMessages[validatorName] || 'Invalid input';
        }
        
        return message;
    }

    /**
     * Handle field blur events
     * @param {Event} event - Blur event
     */
    handleFieldBlur(event) {
        const field = event.target;
        
        if (!this.isFormField(field)) return;
        
        const form = field.closest('form');
        if (!form) return;
        
        const formConfig = this.forms.get(form.id);
        if (formConfig && formConfig.validateOnBlur) {
            this.validateField(field);
        }
    }

    /**
     * Handle field input events
     * @param {Event} event - Input event
     */
    handleFieldInput(event) {
        const field = event.target;
        
        if (!this.isFormField(field)) return;
        
        const form = field.closest('form');
        if (!form) return;
        
        const formConfig = this.forms.get(form.id);
        if (formConfig && formConfig.validateOnInput) {
            // Only validate if field has errors or has been validated before
            if (field.classList.contains('error') || field.dataset.validated) {
                this.validateField(field);
                field.dataset.validated = 'true';
            }
        }
    }

    /**
     * Handle field change events
     * @param {Event} event - Change event
     */
    handleFieldChange(event) {
        const field = event.target;
        
        if (!this.isFormField(field)) return;
        
        // Validate on change for select elements
        if (field.tagName === 'SELECT') {
            this.validateField(field);
        }
    }

    /**
     * Check if element is a form field
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Is form field
     */
    isFormField(element) {
        return element && (
            element.tagName === 'INPUT' ||
            element.tagName === 'TEXTAREA' ||
            element.tagName === 'SELECT'
        );
    }

    /**
     * Handle form submission
     * @param {Object} eventData - Form submission event data
     */
    async handleFormSubmission(eventData) {
        const { form, formData, originalEvent } = eventData;
        const formConfig = this.forms.get(form.id);
        
        if (!formConfig) {
            console.warn(`No configuration found for form ${form.id}`);
            return;
        }
        
        if (formConfig.preventDefault) {
            originalEvent.preventDefault();
        }
        
        // Run beforeSubmit hook
        if (formConfig.beforeSubmit) {
            const shouldContinue = await formConfig.beforeSubmit(form, formData);
            if (shouldContinue === false) return;
        }
        
        // Validate form
        const isValid = this.validateForm(form);
        if (!isValid) {
            this.showNotification(
                this.translate(formConfig.validationErrorMessage),
                'error'
            );
            return;
        }
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        const originalText = submitButton ? 
            (submitButton.textContent || submitButton.value) : '';
        
        if (submitButton) {
            if (submitButton.tagName === 'INPUT') {
                submitButton.value = this.translate('form_sending') || 'Sending...';
            } else {
                submitButton.textContent = this.translate('form_sending') || 'Sending...';
            }
            submitButton.disabled = true;
        }
        
        try {
            // Submit form
            const response = await this.submitForm(formConfig, formData);
            
            // Handle success
            if (formConfig.onSuccess) {
                await formConfig.onSuccess(response, form);
            } else {
                this.handleSubmissionSuccess(formConfig, form, response);
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            
            // Handle error
            if (formConfig.onError) {
                await formConfig.onError(error, form);
            } else {
                this.handleSubmissionError(formConfig, form, error);
            }
            
        } finally {
            // Reset button state
            if (submitButton) {
                if (submitButton.tagName === 'INPUT') {
                    submitButton.value = originalText;
                } else {
                    submitButton.textContent = originalText;
                }
                submitButton.disabled = false;
            }
            
            // Run afterSubmit hook
            if (formConfig.afterSubmit) {
                await formConfig.afterSubmit(form, formData);
            }
        }
    }

    /**
     * Handle successful form submission
     * @param {Object} formConfig - Form configuration
     * @param {HTMLFormElement} form - Form element
     * @param {*} response - Server response
     */
    handleSubmissionSuccess(formConfig, form, response) {
        if (formConfig.showNotifications) {
            this.showNotification(
                this.translate(formConfig.successMessage),
                'success'
            );
        }
        
        // Reset form
        form.reset();
        
        // Remove any error states
        form.querySelectorAll('.error').forEach(field => {
            this.removeFieldError(field);
        });
        
        // Emit success event
        this.eventManager.emit('formSubmissionSuccess', {
            form,
            response,
            formId: formConfig.id
        });
    }

    /**
     * Handle form submission error
     * @param {Object} formConfig - Form configuration
     * @param {HTMLFormElement} form - Form element
     * @param {Error} error - Error object
     */
    handleSubmissionError(formConfig, form, error) {
        if (formConfig.showNotifications) {
            this.showNotification(
                this.translate(formConfig.errorMessage),
                'error'
            );
        }
        
        // Emit error event
        this.eventManager.emit('formSubmissionError', {
            form,
            error,
            formId: formConfig.id
        });
    }

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        // Try to use a notification system if available
        if (window.notificationManager && window.notificationManager.show) {
            window.notificationManager.show(message, type);
            return;
        }
        
        // Fallback to simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set colors based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Get translation for key
     * @param {string} key - Translation key
     * @returns {string} Translated text
     */
    translate(key) {
        if (this.translationManager && this.translationManager.translate) {
            return this.translationManager.translate(key);
        }
        
        // Fallback to global translation function
        if (window.translations && window.translationManager) {
            const currentLanguage = window.translationManager.getCurrentLanguage();
            if (window.translations[currentLanguage] && window.translations[currentLanguage][key]) {
                return window.translations[currentLanguage][key];
            }
        }
        
        return key;
    }

    /**
     * Get form configuration
     * @param {string} formId - Form ID
     * @returns {Object|null} Form configuration
     */
    getFormConfig(formId) {
        return this.forms.get(formId) || null;
    }

    /**
     * Remove form from manager
     * @param {string} formId - Form ID
     */
    removeForm(formId) {
        this.forms.delete(formId);
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const forms = {};
        this.forms.forEach((config, id) => {
            forms[id] = {
                endpoint: config.submitEndpoint,
                method: config.method,
                hasElement: !!config.element
            };
        });
        
        return {
            forms,
            validators: Array.from(this.validators.keys()),
            totalForms: this.forms.size,
            totalValidators: this.validators.size
        };
    }
}

// Export for module systems or assign to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormManager;
} else {
    window.FormManager = FormManager;
} 