<?php
/**
 * Contact Form Email Handler - ItsyBitsy (WordPress Compatible)
 * 
 * WordPress Integration Options:
 * 1. Add to theme's functions.php
 * 2. Create as a custom plugin
 * 3. Use WordPress AJAX handler (recommended)
 * 
 * For WordPress integration, this file should be modified to use:
 * - wp_mail() instead of mail()
 * - WordPress nonces for security
 * - WordPress sanitization functions
 * - wp-admin/admin-ajax.php for AJAX handling
 */

// ========================================
// WORDPRESS AJAX HANDLER VERSION
// ========================================

/**
 * Add this to your theme's functions.php or create a custom plugin
 */

// Hook for logged-in users
add_action('wp_ajax_itsybitsy_contact_form', 'handle_itsybitsy_contact_form');
// Hook for non-logged-in users (public contact form)
add_action('wp_ajax_nopriv_itsybitsy_contact_form', 'handle_itsybitsy_contact_form');

// Enqueue script with nonce for WordPress AJAX
add_action('wp_enqueue_scripts', 'itsybitsy_enqueue_contact_scripts');

function itsybitsy_enqueue_contact_scripts() {
    // Only enqueue on pages that need the contact form
    if (is_page() || is_front_page()) {
        wp_localize_script('your-main-script', 'itsybitsy_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('itsybitsy_contact_nonce'),
            'action' => 'itsybitsy_contact_form'
        ));
    }
}

/**
 * WordPress AJAX Contact Form Handler
 */
function handle_itsybitsy_contact_form() {
    // ========================================
    // CONFIGURATION - UPDATE THESE VALUES
    // ========================================
    
    $to_email = get_option('admin_email'); // Uses WordPress admin email by default
    $website_name = get_bloginfo('name');  // Uses WordPress site name
    
    // You can also set custom emails:
    // $to_email = 'kontakt@itsybitsy.pl';
    
    try {
        // Verify nonce for security
        if (!wp_verify_nonce($_POST['nonce'], 'itsybitsy_contact_nonce')) {
            throw new Exception('Security verification failed. Please refresh the page and try again.');
        }
        
        // Get and sanitize form data using WordPress functions
        $name = sanitize_text_field($_POST['name'] ?? '');
        $email = sanitize_email($_POST['email'] ?? '');
        $phone = sanitize_text_field($_POST['phone'] ?? '');
        $message = sanitize_textarea_field($_POST['message'] ?? '');
        
        // Basic validation
        if (empty($name)) {
            throw new Exception('Name is required.');
        }
        
        if (empty($email)) {
            throw new Exception('Email is required.');
        }
        
        if (!is_email($email)) { // WordPress email validation
            throw new Exception('Please enter a valid email address.');
        }
        
        if (empty($message)) {
            throw new Exception('Message is required.');
        }
        
        if (strlen($message) < 10) {
            throw new Exception('Message must be at least 10 characters long.');
        }
        
        // WordPress spam protection
        $honeypot = sanitize_text_field($_POST['honeypot'] ?? '');
        if (!empty($honeypot)) {
            throw new Exception('Spam detected.');
        }
        
        // Check submission timing
        $submit_time = intval($_POST['submitTime'] ?? 0);
        $current_time = time() * 1000;
        if ($submit_time > 0 && ($current_time - $submit_time) < 3000) {
            throw new Exception('Please wait a moment before submitting.');
        }
        
        // Prepare email content
        $subject = sprintf('New Contact Form Submission - %s', $website_name);
        $email_body = itsybitsy_create_email_body($name, $email, $phone, $message, $website_name);
        
        // WordPress email headers
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            sprintf('From: %s <%s>', $website_name, get_option('admin_email')),
            sprintf('Reply-To: %s <%s>', $name, $email)
        );
        
        // Send email using WordPress wp_mail()
        $success = wp_mail($to_email, $subject, $email_body, $headers);
        
        if ($success) {
            // Log successful submission using WordPress error log
            error_log(sprintf('ItsyBitsy contact form submission from: %s (%s)', $email, $name));
            
            // Return success response
            wp_send_json_success(array(
                'message' => 'Thank you! Your message has been sent successfully. We will get back to you soon.'
            ));
        } else {
            throw new Exception('Failed to send email. Please try again later or contact us directly.');
        }
        
    } catch (Exception $e) {
        // Log error using WordPress error log
        error_log('ItsyBitsy contact form error: ' . $e->getMessage());
        
        // Return error response using WordPress function
        wp_send_json_error(array(
            'message' => $e->getMessage()
        ));
    }
}

/**
 * Create formatted email body for WordPress
 */
function itsybitsy_create_email_body($name, $email, $phone, $message, $website_name) {
    $timestamp = current_time('Y-m-d H:i:s'); // WordPress current time
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    // Use WordPress escaping functions
    $name_esc = esc_html($name);
    $email_esc = esc_html($email);
    $phone_esc = esc_html($phone ?: 'Not provided');
    $message_esc = esc_html($message);
    $website_name_esc = esc_html($website_name);
    $user_agent_esc = esc_html($user_agent);
    
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>Contact Form Submission</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007cba; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { background: white; padding: 10px; border-left: 3px solid #007cba; margin-top: 5px; }
            .footer { background: #eee; padding: 15px; font-size: 12px; color: #666; }
            .message-content { white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>New Contact Form Submission</h2>
                <p>From {$website_name_esc}</p>
            </div>
            
            <div class='content'>
                <div class='field'>
                    <div class='label'>Name:</div>
                    <div class='value'>{$name_esc}</div>
                </div>
                
                <div class='field'>
                    <div class='label'>Email:</div>
                    <div class='value'>{$email_esc}</div>
                </div>
                
                <div class='field'>
                    <div class='label'>Phone:</div>
                    <div class='value'>{$phone_esc}</div>
                </div>
                
                <div class='field'>
                    <div class='label'>Message:</div>
                    <div class='value message-content'>{$message_esc}</div>
                </div>
            </div>
            
            <div class='footer'>
                <strong>Submission Details:</strong><br>
                Time: {$timestamp}<br>
                IP Address: {$ip}<br>
                User Agent: {$user_agent_esc}
            </div>
        </div>
    </body>
    </html>
    ";
}

// ========================================
// STANDALONE VERSION (Non-WordPress)
// ========================================

/**
 * If you're NOT using WordPress, uncomment the code below
 * and comment out the WordPress version above
 */

/*
// Set proper headers for AJAX requests
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Configuration for standalone version
$to_email = 'kontakt@itsybitsy.pl';
$from_email = 'noreply@itsybitsy.pl';
$website_name = 'ItsyBitsy Montessori';

// Process form submission (same logic as WordPress version but without WP functions)
// ... (rest of the standalone code would go here)
*/

/**
 * WORDPRESS SETUP INSTRUCTIONS:
 * 
 * 1. OPTION A - Add to functions.php:
 *    Copy the WordPress AJAX handler code above to your theme's functions.php
 * 
 * 2. OPTION B - Create Custom Plugin:
 *    Create a new file in /wp-content/plugins/itsybitsy-contact/itsybitsy-contact.php
 *    Add the plugin header and the code above
 * 
 * 3. Update JavaScript (FormManager.js):
 *    Change the AJAX URL to use WordPress admin-ajax.php
 *    Add nonce to form submissions
 * 
 * 4. WordPress Email Configuration:
 *    - Install a WordPress SMTP plugin (like WP Mail SMTP)
 *    - Configure proper SMTP settings in WordPress admin
 *    - Test email delivery using a plugin like Mail Tester
 * 
 * 5. For production WordPress sites:
 *    - Consider using Contact Form 7 or Gravity Forms
 *    - Add WordPress security plugins
 *    - Enable WordPress caching
 *    - Use WordPress security measures (limit login attempts, etc.)
 */
?> 