
# Deploying to Hostinger

This guide covers the steps for deploying your React application to Hostinger shared hosting.

## Pre-deployment Steps

1. **Build your application**
   ```
   npm run build
   ```
   This will create a `dist` folder containing your compiled application.

2. **Prepare the files**
   - The `dist` folder contains all files needed for deployment
   - Make sure `.htaccess` is included (it should be copied automatically from the `public` folder)

## Deployment Steps

1. **Log in to your Hostinger control panel**

2. **Access File Manager or use FTP**
   - You can use the built-in File Manager
   - Alternatively, use an FTP client like FileZilla with your Hostinger FTP credentials

3. **Navigate to your website's root directory**
   - This is typically `public_html` or a subdirectory if you're using a subdomain

4. **Upload your files**
   - Upload all contents from the `dist` folder to your website's root directory
   - Make sure to include the `.htaccess` file

5. **Verify deployment**
   - Visit your website URL to check if the application loads correctly
   - Test navigation to ensure routing works properly

## Troubleshooting

- **White screen or 404 errors**: Check if the `.htaccess` file was uploaded correctly
- **API connection issues**: Verify your Supabase URL and API key are correctly set
- **Missing assets**: Ensure all files from the `dist` folder were uploaded

## Additional Configuration

- If you're using a custom domain, make sure DNS settings are correctly configured in your Hostinger account
- For HTTPS support, enable SSL certificates through your Hostinger control panel

## Maintenance

When updating your application:
1. Build locally with `npm run build`
2. Upload the new files to replace the old ones on the server
