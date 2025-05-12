
# Deploying to Hostinger VPS with Nginx

This guide covers the steps for deploying your React application to a Hostinger VPS using FileZilla and Nginx.

## Prerequisites

1. A Hostinger VPS with SSH access
2. FileZilla installed on your local machine
3. Node.js installed on your VPS
4. Nginx installed on your VPS

## Deployment Steps

### 1. Build Your Application Locally

```bash
npm run build
```

This will create a production-ready build in the `dist` directory.

### 2. Connect to Your Hostinger VPS using FileZilla

1. Open FileZilla
2. Enter your Hostinger VPS credentials:
   - Host: Your VPS IP address
   - Username: Your SSH username
   - Password: Your SSH password
   - Port: 22
3. Click "Quickconnect"

### 3. Transfer Files to Your VPS

1. In the left panel (local site), navigate to your project's `dist` directory
2. In the right panel (remote site), navigate to `/var/www/html` or your preferred web directory
3. Select all files and folders from your `dist` directory
4. Right-click and select "Upload"
5. Wait for the transfer to complete

### 4. Configure Nginx

1. Connect to your VPS via SSH:
   ```bash
   ssh username@your-vps-ip
   ```

2. Create a new Nginx server block:
   ```bash
   sudo nano /etc/nginx/sites-available/gambia-voter-connect
   ```

3. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       root /var/www/html;
       index index.html;

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/javascript application/json;
       gzip_min_length 1000;

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN";
       add_header X-XSS-Protection "1; mode=block";
       add_header X-Content-Type-Options "nosniff";
       add_header Referrer-Policy "strict-origin-when-cross-origin";
       add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://fhyhyfoqzpkzkxbkqcdp.supabase.co;";
       add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";

       # Cache control for static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 30d;
           add_header Cache-Control "public, max-age=31536000, immutable";
       }

       # HTML files should not be cached aggressively
       location ~* \.html$ {
           add_header Cache-Control "public, max-age=0, must-revalidate";
       }

       # Handle SPA routing - important for React Router
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. Create a symbolic link to enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/gambia-voter-connect /etc/nginx/sites-enabled/
   ```

5. Test the Nginx configuration:
   ```bash
   sudo nginx -t
   ```

6. If the test is successful, restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### 5. SSL Configuration (Highly Recommended)

1. Install Certbot:
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtain and install SSL certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. Follow the prompts to complete the SSL setup

### 6. Verify Your Deployment

1. Visit your domain in a web browser
2. Test navigation through the application to ensure routing works properly
3. Check the browser console for any errors

## Maintenance and Updates

When you need to update your application:

1. Build a new version locally:
   ```bash
   npm run build
   ```

2. Use FileZilla to upload the updated files to your VPS, replacing the old files

3. If you've made significant changes to the server configuration, remember to:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Troubleshooting

1. **404 errors or routing issues**: Check your Nginx configuration to ensure the try_files directive is set correctly
2. **Permission issues**: Ensure your web directory has the correct permissions
   ```bash
   sudo chown -R www-data:www-data /var/www/html
   sudo chmod -R 755 /var/www/html
   ```
3. **SSL certificate issues**: Check the Certbot logs
   ```bash
   sudo certbot certificates
   ```
