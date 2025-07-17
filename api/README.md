# API Directory

This directory contains the backend PHP scripts for handling form submissions and other server-side functionality.

## Files

- `contact.php` - Main contact form email handler
- `README.md` - This file

## Setup Instructions

1. **Update Configuration**: Edit `contact.php` and update the email addresses in the configuration section:
   ```php
   $to_email = 'your-email@domain.com';        // Your actual email
   $from_email = 'noreply@yourdomain.com';     // Your domain email
   ```

2. **Test Email Functionality**: 
   - Upload the files to your PHP-enabled server
   - Test the contact form on your website
   - Check that emails are being received

3. **Production Recommendations**:
   - Use PHPMailer for better email delivery
   - Implement proper error logging
   - Add rate limiting for spam protection
   - Consider using environment variables for sensitive data

## Security Notes

- The provided `contact.php` includes basic spam protection
- For production use, consider additional security measures:
  - CSRF token validation
  - Captcha integration (reCAPTCHA)
  - Server-side rate limiting
  - Input sanitization (already included)

## Testing

You can test the email functionality using tools like:
- [Mailtrap.io](https://mailtrap.io/) - Email testing in development
- [Mail-tester.com](https://www.mail-tester.com/) - Check email deliverability
- Your server's error logs for debugging

## Support

If you encounter issues:
1. Check your server's PHP error logs
2. Verify your server supports the `mail()` function
3. Test with a simple PHP script first
4. Ensure CORS headers are properly set

See the main `README.md` file for comprehensive setup instructions. 