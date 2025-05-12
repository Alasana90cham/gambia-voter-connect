
# Deploying to a VPS (Virtual Private Server)

This guide covers the steps for deploying your React application to a VPS such as DigitalOcean, Linode, AWS EC2, etc.

## Prerequisites

1. A VPS with SSH access
2. Node.js installed on your VPS
3. Nginx or Apache installed on your VPS
4. Domain name (optional but recommended)

## Deployment Steps

### 1. Build Your Application Locally

```bash
npm run build
```

This will create a production-ready build in the `dist` directory.

### 2. Transfer Files to VPS

Use SCP or SFTP to transfer the built files to your server:

```bash
# Example using SCP
scp -r ./dist/* user@your-server-ip:/var/www/your-site-directory/
```

Alternatively, you can use Git to pull the repository on your server and build it there.

### 3. Server Configuration

#### If using Nginx:

Create a new site configuration:

```bash
sudo nano /etc/nginx/sites-available/gambia-voter-connect
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/your-site-directory;
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

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/gambia-voter-connect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### If using Apache:

Create a new site configuration:

```bash
sudo nano /etc/apache2/sites-available/gambia-voter-connect.conf
```

Add the following configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/your-site-directory

    <Directory /var/www/your-site-directory>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript
    </IfModule>

    # Enable caching
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/gambia-voter-connect-error.log
    CustomLog ${APACHE_LOG_DIR}/gambia-voter-connect-access.log combined
</VirtualHost>
```

Enable the site and restart Apache:

```bash
sudo a2ensite gambia-voter-connect.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 4. SSL Configuration (Recommended)

Use Certbot to add SSL with Let's Encrypt:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx # for Nginx
# OR
sudo apt install certbot python3-certbot-apache # for Apache

sudo certbot --nginx -d your-domain.com -d www.your-domain.com # for Nginx
# OR
sudo certbot --apache -d your-domain.com -d www.your-domain.com # for Apache
```

### 5. Verify Deployment

Visit your domain name or server IP to ensure the application is running correctly.

## Maintenance and Updates

1. **Pull updated code from your repository**:
   ```bash
   cd /path/to/your/repo
   git pull origin main
   ```

2. **Rebuild the application**:
   ```bash
   npm install
   npm run build
   ```

3. **Copy the new build to the web directory**:
   ```bash
   cp -r dist/* /var/www/your-site-directory/
   ```

## Setting Up PM2 for API Services (Optional)

If your application includes API services, you can use PM2 to manage them:

```bash
# Install PM2
npm install -g pm2

# Start your API service
pm2 start server.js --name "gambia-voter-api"

# Set up PM2 to start on system boot
pm2 startup
pm2 save
```

## Monitoring

Consider setting up monitoring for your VPS:

1. **Server monitoring**: Tools like Netdata or Prometheus
2. **Application monitoring**: NewRelic, Sentry, or LogRocket
3. **Uptime monitoring**: UptimeRobot or StatusCake

These will help you detect and resolve issues quickly.
