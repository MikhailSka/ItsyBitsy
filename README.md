# ItsyBitsy - Przedszkole Montessori Website

A modern, responsive website for ItsyBitsy Montessori Kindergarten featuring lazy loading optimization, multilingual support, and contact form integration.

## Features

- ✨ **Lazy Loading**: Optimized image and video loading for better performance
- 🌍 **Multilingual**: Polish and English language support
- 📱 **Responsive**: Mobile-first design with Bootstrap 5
- 🎨 **Modern UI**: Clean, professional design with smooth animations
- 📧 **Contact Form**: Ready for PHP email integration
- ⚡ **Performance**: Optimized loading with priority-based content delivery

## Quick Start

1. Clone or download the repository
2. Open `index.html` in a web browser
3. For PHP email functionality, see [Email Integration](#email-integration) below

## Email Integration Setup

The contact form is ready for PHP email integration with support for both standalone servers and WordPress websites. Choose the option that matches your hosting environment:

### WordPress Integration (Recommended for WordPress sites)

If your server runs on WordPress, use the WordPress-compatible version for better integration and security:

#### Option A: Add to Theme Functions (Easiest)

Add this code to your active theme's `functions.php` file:

```php
// WordPress AJAX Contact Form Handler for ItsyBitsy
add_action('wp_ajax_itsybitsy_contact_form', 'handle_itsybitsy_contact_form');
add_action('wp_ajax_nopriv_itsybitsy_contact_form', 'handle_itsybitsy_contact_form');

// Enqueue scripts with WordPress nonce
add_action('wp_enqueue_scripts', 'itsybitsy_enqueue_contact_scripts');

function itsybitsy_enqueue_contact_scripts() {
    if (is_page() || is_front_page()) {
        wp_localize_script('itsybitsy-main-script', 'itsybitsy_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('itsybitsy_contact_nonce'),
            'action' => 'itsybitsy_contact_form'
        ));
    }
}

function handle_itsybitsy_contact_form() {
    // Verify nonce for security
    if (!wp_verify_nonce($_POST['nonce'], 'itsybitsy_contact_nonce')) {
        wp_send_json_error(array('message' => 'Security verification failed.'));
    }
    
    // Get and sanitize form data using WordPress functions
    $name = sanitize_text_field($_POST['name'] ?? '');
    $email = sanitize_email($_POST['email'] ?? '');
    $phone = sanitize_text_field($_POST['phone'] ?? '');
    $message = sanitize_textarea_field($_POST['message'] ?? '');
    
    // Validation
    if (empty($name) || empty($email) || empty($message)) {
        wp_send_json_error(array('message' => 'All required fields must be filled.'));
    }
    
    if (!is_email($email)) {
        wp_send_json_error(array('message' => 'Please enter a valid email address.'));
    }
    
    // Prepare email
    $to = get_option('admin_email'); // Or set custom email: 'kontakt@itsybitsy.pl'
    $subject = 'New Contact Form Submission - ' . get_bloginfo('name');
    $headers = array('Content-Type: text/html; charset=UTF-8');
    
    $email_body = sprintf(
        '<h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> %s</p>
        <p><strong>Email:</strong> %s</p>
        <p><strong>Phone:</strong> %s</p>
        <p><strong>Message:</strong></p>
        <p>%s</p>',
        esc_html($name),
        esc_html($email),
        esc_html($phone ?: 'Not provided'),
        nl2br(esc_html($message))
    );
    
    // Send email using WordPress wp_mail()
    if (wp_mail($to, $subject, $email_body, $headers)) {
        wp_send_json_success(array(
            'message' => 'Thank you! Your message has been sent successfully.'
        ));
    } else {
        wp_send_json_error(array(
            'message' => 'Failed to send email. Please try again later.'
        ));
    }
}
```

#### Option B: Create Custom Plugin

1. Create a new directory: `/wp-content/plugins/itsybitsy-contact/`
2. Copy the file `api/itsybitsy-contact-plugin.php` to `/wp-content/plugins/itsybitsy-contact/itsybitsy-contact.php`
3. Activate the plugin in WordPress admin

The plugin includes:
- Complete contact form handling
- WordPress admin settings page
- Database logging of submissions
- Internationalization support
- Proper WordPress security measures

#### WordPress Email Configuration

1. **Install SMTP Plugin**: For reliable email delivery, install "WP Mail SMTP" plugin
2. **Configure SMTP**: Set up your email provider's SMTP settings in the plugin
3. **Test Email**: Use the plugin's test feature to verify email functionality

#### WordPress Security Enhancements

- The WordPress version automatically includes:
  - Nonce verification for CSRF protection
  - WordPress sanitization functions
  - Built-in spam protection
  - Rate limiting through WordPress

#### WordPress Script Integration

If integrating into a WordPress theme, properly enqueue the scripts in your `functions.php`:

```php
function itsybitsy_enqueue_scripts() {
    // Main scripts
    wp_enqueue_script('itsybitsy-managers', get_template_directory_uri() . '/assets/js/managers/FormManager.js', array(), '1.0', true);
    wp_enqueue_script('itsybitsy-main-script', get_template_directory_uri() . '/assets/js/LandingPageManager.js', array('itsybitsy-managers'), '1.0', true);
    
    // Localize script for AJAX (this must match the script name used above)
    wp_localize_script('itsybitsy-main-script', 'itsybitsy_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('itsybitsy_contact_nonce'),
        'action' => 'itsybitsy_contact_form'
    ));
}
add_action('wp_enqueue_scripts', 'itsybitsy_enqueue_scripts');
```

**Important**: Make sure the script handle in `wp_localize_script()` matches the one used in `wp_enqueue_script()`.

### Standalone Server Integration

For non-WordPress servers, use the standalone PHP integration:

### 1. Create PHP Email Script

Create a file called `contact.php` in your `/api/` directory (or update the path in `FormManager.js`):

```php
<?php
// api/contact.php
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

// Configuration - UPDATE THESE VALUES
$to_email = 'kontakt@itsybitsy.pl';  // Replace with your email
$from_email = 'noreply@itsybitsy.pl'; // Replace with your domain email
$smtp_host = 'localhost'; // Your SMTP host
$smtp_port = 587; // Your SMTP port
$smtp_username = ''; // SMTP username (if required)
$smtp_password = ''; // SMTP password (if required)

try {
    // Validate and sanitize input
    $name = filter_var(trim($_POST['name'] ?? ''), FILTER_SANITIZE_STRING);
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    $phone = filter_var(trim($_POST['phone'] ?? ''), FILTER_SANITIZE_STRING);
    $message = filter_var(trim($_POST['message'] ?? ''), FILTER_SANITIZE_STRING);
    
    // Basic validation
    if (empty($name) || empty($email) || empty($message)) {
        throw new Exception('All required fields must be filled.');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address.');
    }
    
    // Basic spam protection
    $honeypot = $_POST['honeypot'] ?? '';
    if (!empty($honeypot)) {
        throw new Exception('Spam detected.');
    }
    
    // Check submission time (prevent too fast submissions)
    $submit_time = $_POST['submitTime'] ?? 0;
    $current_time = time() * 1000; // Convert to milliseconds
    if ($current_time - $submit_time < 3000) { // Less than 3 seconds
        throw new Exception('Submission too fast. Please try again.');
    }
    
    // Prepare email content
    $subject = 'New Contact Form Submission - ItsyBitsy';
    $email_body = "
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> " . htmlspecialchars($name) . "</p>
    <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
    <p><strong>Phone:</strong> " . htmlspecialchars($phone) . "</p>
    <p><strong>Message:</strong></p>
    <p>" . nl2br(htmlspecialchars($message)) . "</p>
    
    <hr>
    <p><small>
    <strong>Submission Details:</strong><br>
    Time: " . date('Y-m-d H:i:s') . "<br>
    IP: " . $_SERVER['REMOTE_ADDR'] . "<br>
    User Agent: " . htmlspecialchars($_SERVER['HTTP_USER_AGENT']) . "
    </small></p>
    ";
    
    // Email headers
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . $from_email,
        'Reply-To: ' . $email,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Send email using PHP's mail() function
    // For production, consider using PHPMailer or similar library
    $mail_sent = mail($to_email, $subject, $email_body, implode("\r\n", $headers));
    
    if ($mail_sent) {
        // Log successful submission (optional)
        error_log("Contact form submission from: $email");
        
        echo json_encode([
            'success' => true,
            'message' => 'Thank you! Your message has been sent successfully.'
        ]);
    } else {
        throw new Exception('Failed to send email. Please try again later.');
    }
    
} catch (Exception $e) {
    // Log error (optional)
    error_log("Contact form error: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
```

### 2. Advanced SMTP Integration (Recommended)

For production environments, use PHPMailer for better email delivery:

```php
<?php
// api/contact.php (with PHPMailer)
require_once 'vendor/autoload.php'; // Install PHPMailer via Composer

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// SMTP Configuration - UPDATE THESE VALUES
$smtp_config = [
    'host' => 'smtp.gmail.com', // or your SMTP host
    'port' => 587,
    'username' => 'your-email@gmail.com',
    'password' => 'your-app-password',
    'encryption' => 'tls'
];

$to_email = 'kontakt@itsybitsy.pl';
$from_email = 'noreply@itsybitsy.pl';

try {
    // Validate input (same as above)
    $name = filter_var(trim($_POST['name'] ?? ''), FILTER_SANITIZE_STRING);
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    $phone = filter_var(trim($_POST['phone'] ?? ''), FILTER_SANITIZE_STRING);
    $message = filter_var(trim($_POST['message'] ?? ''), FILTER_SANITIZE_STRING);
    
    if (empty($name) || empty($email) || empty($message)) {
        throw new Exception('All required fields must be filled.');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address.');
    }
    
    // Create PHPMailer instance
    $mail = new PHPMailer(true);
    
    // SMTP configuration
    $mail->isSMTP();
    $mail->Host = $smtp_config['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $smtp_config['username'];
    $mail->Password = $smtp_config['password'];
    $mail->SMTPSecure = $smtp_config['encryption'];
    $mail->Port = $smtp_config['port'];
    
    // Email settings
    $mail->setFrom($from_email, 'ItsyBitsy Contact Form');
    $mail->addAddress($to_email);
    $mail->addReplyTo($email, $name);
    
    $mail->isHTML(true);
    $mail->Subject = 'New Contact Form Submission - ItsyBitsy';
    $mail->Body = "
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> " . htmlspecialchars($name) . "</p>
    <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
    <p><strong>Phone:</strong> " . htmlspecialchars($phone) . "</p>
    <p><strong>Message:</strong></p>
    <p>" . nl2br(htmlspecialchars($message)) . "</p>
    ";
    
    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Thank you! Your message has been sent successfully.'
    ]);
    
} catch (Exception $e) {
    error_log("Contact form error: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send email. Please try again later.'
    ]);
}
?>
```

### 3. Update JavaScript Configuration (Optional)

If you need to change the endpoint URL, update the `FormManager.js`:

```javascript
// In assets/js/managers/FormManager.js, line ~95
this.setupForm('contactForm', {
    submitEndpoint: '/your-custom-path/contact.php', // Update this path
    successMessage: 'form_success',
    errorMessage: 'form_error',
    validationErrorMessage: 'form_validation_error',
    onSuccess: this.handleEmailSubmissionSuccess.bind(this),
    onError: this.handleEmailSubmissionError.bind(this)
});
```

### 4. Install PHPMailer (if using SMTP)

```bash
# Using Composer
composer require phpmailer/phpmailer

# Or download manually from: https://github.com/PHPMailer/PHPMailer
```

### 5. Server Configuration

Ensure your server supports:
- PHP 7.4+ (recommended)
- `mail()` function enabled (for basic version)
- SMTP access (for PHPMailer version)
- SSL/TLS support
- Proper file permissions

### 6. Testing

1. **Local Testing**: Use a service like [Mailtrap](https://mailtrap.io/) for testing
2. **Production**: Test with real email addresses
3. **Check Spam Folders**: Ensure emails aren't being marked as spam

### 7. Security Considerations

- ✅ **Input Validation**: All inputs are sanitized and validated
- ✅ **Spam Protection**: Basic honeypot and timing checks included
- ✅ **Rate Limiting**: Consider implementing server-side rate limiting
- ✅ **CSRF Protection**: Add CSRF tokens if needed
- ✅ **File Permissions**: Ensure PHP files have proper permissions (644)
- ✅ **Error Logging**: Enable error logging for debugging

### 8. Customization Options

#### Custom Success/Error Messages

Update the response messages in your PHP script:

```php
// Success message
echo json_encode([
    'success' => true,
    'message' => 'Your custom success message here!'
]);

// Error message
echo json_encode([
    'success' => false,
    'message' => 'Your custom error message here!'
]);
```

#### Add Additional Fields

To add more form fields:

1. Add HTML input in `index.html`
2. Update the PHP script to handle the new field
3. Add validation if required

#### Email Templates

You can create HTML email templates by updating the `$email_body` variable in the PHP script.

### 9. Troubleshooting

**Form not submitting?**
- Check browser console for JavaScript errors
- Verify the PHP endpoint path is correct
- Ensure server supports PHP

**Emails not being sent?**
- Check PHP error logs
- Verify SMTP credentials (if using PHPMailer)
- Test with a simple PHP mail script first
- Check firewall settings for SMTP ports

**Getting CORS errors?**
- Ensure the PHP script includes proper CORS headers
- Host the website and PHP script on the same domain

### 10. Production Deployment

1. **Update Email Settings**: Change all placeholder emails to real ones
2. **Configure SMTP**: Set up proper SMTP credentials
3. **Test Thoroughly**: Test form submission in production environment
4. **Monitor**: Set up monitoring for failed email deliveries
5. **Backup**: Ensure you have backups of custom configurations

## File Structure

```
ItsyBitsy/
├── api/
│   └── contact.php          # PHP email handler (create this)
├── assets/
│   ├── css/
│   ├── images/
│   ├── js/
│   │   └── managers/
│   │       └── FormManager.js # Contains placeholder functions
│   └── videos/
├── index.html               # Main website file
└── README.md               # This file
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

This project is proprietary to ItsyBitsy Montessori Kindergarten.

## Support

For technical support with the email integration, check the browser console for error messages and verify your PHP configuration.
