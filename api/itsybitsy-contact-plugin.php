<?php
/**
 * Plugin Name: ItsyBitsy Contact Form
 * Plugin URI: https://itsybitsy.pl
 * Description: WordPress contact form handler for ItsyBitsy Montessori website. Provides secure AJAX form submission with spam protection and email notifications.
 * Version: 1.0.0
 * Author: ItsyBitsy Development Team
 * License: GPL v2 or later
 * Text Domain: itsybitsy-contact
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * ItsyBitsy Contact Form Plugin Class
 */
class ItsyBitsyContactForm {
    
    /**
     * Plugin version
     */
    const VERSION = '1.0.0';
    
    /**
     * Initialize the plugin
     */
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_ajax_itsybitsy_contact_form', array($this, 'handle_contact_form'));
        add_action('wp_ajax_nopriv_itsybitsy_contact_form', array($this, 'handle_contact_form'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Plugin initialization code here
        load_plugin_textdomain('itsybitsy-contact', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Enqueue scripts and localize for AJAX
     */
    public function enqueue_scripts() {
        // Only enqueue on pages where the contact form is needed
        if (is_page() || is_front_page() || is_home()) {
            // You can customize this to target specific pages/templates
            
            wp_localize_script('itsybitsy-main-script', 'itsybitsy_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('itsybitsy_contact_nonce'),
                'action' => 'itsybitsy_contact_form'
            ));
        }
    }
    
    /**
     * Handle contact form submission
     */
    public function handle_contact_form() {
        try {
            // Verify nonce for security
            if (!wp_verify_nonce($_POST['nonce'], 'itsybitsy_contact_nonce')) {
                throw new Exception(__('Security verification failed. Please refresh the page and try again.', 'itsybitsy-contact'));
            }
            
            // Get and sanitize form data using WordPress functions
            $name = sanitize_text_field($_POST['name'] ?? '');
            $email = sanitize_email($_POST['email'] ?? '');
            $phone = sanitize_text_field($_POST['phone'] ?? '');
            $message = sanitize_textarea_field($_POST['message'] ?? '');
            
            // Basic validation
            if (empty($name)) {
                throw new Exception(__('Name is required.', 'itsybitsy-contact'));
            }
            
            if (empty($email)) {
                throw new Exception(__('Email is required.', 'itsybitsy-contact'));
            }
            
            if (!is_email($email)) {
                throw new Exception(__('Please enter a valid email address.', 'itsybitsy-contact'));
            }
            
            if (empty($message)) {
                throw new Exception(__('Message is required.', 'itsybitsy-contact'));
            }
            
            if (strlen($message) < 10) {
                throw new Exception(__('Message must be at least 10 characters long.', 'itsybitsy-contact'));
            }
            
            // Spam protection
            $honeypot = sanitize_text_field($_POST['honeypot'] ?? '');
            if (!empty($honeypot)) {
                throw new Exception(__('Spam detected.', 'itsybitsy-contact'));
            }
            
            // Check submission timing (prevent too fast submissions)
            $submit_time = intval($_POST['submitTime'] ?? 0);
            $current_time = time() * 1000;
            if ($submit_time > 0 && ($current_time - $submit_time) < 3000) {
                throw new Exception(__('Please wait a moment before submitting.', 'itsybitsy-contact'));
            }
            
            // Prepare email
            $to_email = $this->get_notification_email();
            $subject = sprintf(__('New Contact Form Submission - %s', 'itsybitsy-contact'), get_bloginfo('name'));
            $email_body = $this->create_email_body($name, $email, $phone, $message);
            
            // WordPress email headers
            $headers = array(
                'Content-Type: text/html; charset=UTF-8',
                sprintf('From: %s <%s>', get_bloginfo('name'), get_option('admin_email')),
                sprintf('Reply-To: %s <%s>', $name, $email)
            );
            
            // Send email using WordPress wp_mail()
            $success = wp_mail($to_email, $subject, $email_body, $headers);
            
            if ($success) {
                // Log successful submission
                error_log(sprintf('ItsyBitsy contact form submission from: %s (%s)', $email, $name));
                
                // Save to database (optional)
                $this->save_submission($name, $email, $phone, $message);
                
                // Return success response
                wp_send_json_success(array(
                    'message' => __('Thank you! Your message has been sent successfully. We will get back to you soon.', 'itsybitsy-contact')
                ));
            } else {
                throw new Exception(__('Failed to send email. Please try again later or contact us directly.', 'itsybitsy-contact'));
            }
            
        } catch (Exception $e) {
            // Log error
            error_log('ItsyBitsy contact form error: ' . $e->getMessage());
            
            // Return error response
            wp_send_json_error(array(
                'message' => $e->getMessage()
            ));
        }
    }
    
    /**
     * Get email address for notifications
     */
    private function get_notification_email() {
        // You can customize this or add a settings page
        $custom_email = get_option('itsybitsy_contact_email', '');
        return !empty($custom_email) ? $custom_email : get_option('admin_email');
    }
    
    /**
     * Create formatted email body
     */
    private function create_email_body($name, $email, $phone, $message) {
        $timestamp = current_time('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        
        $name_esc = esc_html($name);
        $email_esc = esc_html($email);
        $phone_esc = esc_html($phone ?: __('Not provided', 'itsybitsy-contact'));
        $message_esc = esc_html($message);
        $website_name_esc = esc_html(get_bloginfo('name'));
        $user_agent_esc = esc_html($user_agent);
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>" . __('Contact Form Submission', 'itsybitsy-contact') . "</title>
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
                    <h2>" . __('New Contact Form Submission', 'itsybitsy-contact') . "</h2>
                    <p>" . sprintf(__('From %s', 'itsybitsy-contact'), $website_name_esc) . "</p>
                </div>
                
                <div class='content'>
                    <div class='field'>
                        <div class='label'>" . __('Name:', 'itsybitsy-contact') . "</div>
                        <div class='value'>{$name_esc}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>" . __('Email:', 'itsybitsy-contact') . "</div>
                        <div class='value'>{$email_esc}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>" . __('Phone:', 'itsybitsy-contact') . "</div>
                        <div class='value'>{$phone_esc}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='label'>" . __('Message:', 'itsybitsy-contact') . "</div>
                        <div class='value message-content'>{$message_esc}</div>
                    </div>
                </div>
                
                <div class='footer'>
                    <strong>" . __('Submission Details:', 'itsybitsy-contact') . "</strong><br>
                    " . __('Time:', 'itsybitsy-contact') . " {$timestamp}<br>
                    " . __('IP Address:', 'itsybitsy-contact') . " {$ip}<br>
                    " . __('User Agent:', 'itsybitsy-contact') . " {$user_agent_esc}
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    /**
     * Save submission to database (optional feature)
     */
    private function save_submission($name, $email, $phone, $message) {
        global $wpdb;
        
        // Create table if it doesn't exist
        $table_name = $wpdb->prefix . 'itsybitsy_submissions';
        
        $wpdb->insert(
            $table_name,
            array(
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'message' => $message,
                'submitted_at' => current_time('mysql'),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s')
        );
    }
}

/**
 * Initialize the plugin
 */
new ItsyBitsyContactForm();

/**
 * Plugin activation hook - create database table
 */
register_activation_hook(__FILE__, 'itsybitsy_contact_create_table');

function itsybitsy_contact_create_table() {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'itsybitsy_submissions';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        phone varchar(50),
        message text NOT NULL,
        submitted_at datetime NOT NULL,
        ip_address varchar(45),
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

/**
 * Add settings page (optional enhancement)
 */
add_action('admin_menu', 'itsybitsy_contact_admin_menu');

function itsybitsy_contact_admin_menu() {
    add_options_page(
        __('ItsyBitsy Contact Settings', 'itsybitsy-contact'),
        __('ItsyBitsy Contact', 'itsybitsy-contact'),
        'manage_options',
        'itsybitsy-contact-settings',
        'itsybitsy_contact_settings_page'
    );
}

function itsybitsy_contact_settings_page() {
    if (isset($_POST['submit'])) {
        update_option('itsybitsy_contact_email', sanitize_email($_POST['contact_email']));
        echo '<div class="notice notice-success"><p>' . __('Settings saved!', 'itsybitsy-contact') . '</p></div>';
    }
    
    $contact_email = get_option('itsybitsy_contact_email', get_option('admin_email'));
    ?>
    <div class="wrap">
        <h1><?php _e('ItsyBitsy Contact Form Settings', 'itsybitsy-contact'); ?></h1>
        <form method="post" action="">
            <table class="form-table">
                <tr>
                    <th scope="row"><?php _e('Notification Email', 'itsybitsy-contact'); ?></th>
                    <td>
                        <input type="email" name="contact_email" value="<?php echo esc_attr($contact_email); ?>" class="regular-text" />
                        <p class="description"><?php _e('Email address to receive contact form submissions. Leave empty to use admin email.', 'itsybitsy-contact'); ?></p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
?> 