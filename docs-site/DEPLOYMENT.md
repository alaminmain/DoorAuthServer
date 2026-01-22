# DoorAuth Documentation Site - Deployment Guide

Complete guide for deploying the DoorAuth documentation site to GitHub Pages.

## 📋 Prerequisites

- GitHub account
- Git installed locally
- DoorAuth repository forked or cloned

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Push to GitHub

```bash
# Navigate to your DoorAuth repository
cd DoorAuthServer

# Add all files
git add .

# Commit the docs-site
git commit -m "Add documentation website"

# Push to GitHub
git push origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/docs-site`
4. Click **Save**

### Step 3: Wait for Deployment

- GitHub will automatically build and deploy your site
- This usually takes 1-3 minutes
- Check the **Actions** tab to see deployment progress

### Step 4: Access Your Site

Your documentation will be live at:

```
https://YOUR_USERNAME.github.io/DoorAuthServer/
```

## 🔧 Configuration

### Update GitHub Links

Before deploying, update all GitHub links in `index.html`:

```bash
# Find and replace in index.html
# Replace: yourusername
# With: YOUR_ACTUAL_GITHUB_USERNAME
```

Or use this command:

```bash
# Linux/Mac
sed -i 's/yourusername/YOUR_USERNAME/g' docs-site/index.html

# Windows (PowerShell)
(Get-Content docs-site/index.html) -replace 'yourusername', 'YOUR_USERNAME' | Set-Content docs-site/index.html
```

### Update Sitemap

Update `docs-site/sitemap.xml`:

```bash
# Replace yourusername with your GitHub username
sed -i 's/yourusername/YOUR_USERNAME/g' docs-site/sitemap.xml
```

### Update Robots.txt

Update `docs-site/robots.txt`:

```bash
# Replace yourusername with your GitHub username
sed -i 's/yourusername/YOUR_USERNAME/g' docs-site/robots.txt
```

## 🔄 Automatic Deployment with GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys changes.

### How It Works

1. Any push to `main` branch that modifies `docs-site/**` triggers deployment
2. GitHub Actions builds and deploys the site
3. Changes are live within 1-3 minutes

### Workflow File

The workflow is located at: `.github/workflows/deploy-docs.yml`

### Manual Trigger

You can manually trigger deployment:

1. Go to **Actions** tab
2. Select **Deploy Documentation to GitHub Pages**
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## 🌐 Custom Domain (Optional)

### Step 1: Add CNAME File

Create `docs-site/CNAME`:

```
docs.yourdomain.com
```

### Step 2: Configure DNS

Add a CNAME record in your domain's DNS settings:

```
Type: CNAME
Name: docs
Value: YOUR_USERNAME.github.io
TTL: 3600
```

### Step 3: Enable HTTPS

1. Go to repository **Settings** → **Pages**
2. Check **Enforce HTTPS**
3. Wait for SSL certificate to provision (can take up to 24 hours)

## 📊 Monitoring

### Check Deployment Status

```bash
# View GitHub Actions logs
# Go to: https://github.com/YOUR_USERNAME/DoorAuthServer/actions
```

### Common Issues

#### Site Not Loading

**Problem**: 404 error when accessing site

**Solution**:

1. Verify GitHub Pages is enabled
2. Check that `index.html` exists in `docs-site/`
3. Wait 5 minutes for propagation
4. Clear browser cache

#### Styles Not Loading

**Problem**: Site loads but looks broken

**Solution**:

1. Check browser console for errors
2. Verify `styles.css` and `script.js` are in `docs-site/`
3. Ensure file paths are relative (no leading `/`)
4. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

#### GitHub Actions Failing

**Problem**: Deployment workflow fails

**Solution**:

1. Check **Actions** tab for error details
2. Verify workflow file syntax
3. Ensure GitHub Pages is enabled
4. Check repository permissions

## 🧪 Testing Locally

Before deploying, test the site locally:

### Option 1: Python HTTP Server

```bash
cd docs-site
python -m http.server 8000
# Visit: http://localhost:8000
```

### Option 2: Node.js HTTP Server

```bash
cd docs-site
npx http-server -p 8000
# Visit: http://localhost:8000
```

### Option 3: VS Code Live Server

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

## 📱 Mobile Testing

Test on mobile devices:

1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start local server
3. Visit `http://YOUR_IP:8000` on mobile device
4. Ensure both devices are on same network

## 🔍 SEO Optimization

### Verify Sitemap

```bash
# Check sitemap is accessible
curl https://YOUR_USERNAME.github.io/DoorAuthServer/sitemap.xml
```

### Submit to Search Engines

1. **Google Search Console**:
   - Add property: `https://YOUR_USERNAME.github.io/DoorAuthServer/`
   - Submit sitemap: `https://YOUR_USERNAME.github.io/DoorAuthServer/sitemap.xml`

2. **Bing Webmaster Tools**:
   - Add site
   - Submit sitemap

### Verify Robots.txt

```bash
# Check robots.txt is accessible
curl https://YOUR_USERNAME.github.io/DoorAuthServer/robots.txt
```

## 📈 Analytics (Optional)

### Add Google Analytics

1. Create Google Analytics property
2. Get tracking ID (G-XXXXXXXXXX)
3. Add to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
</script>
```

## 🔐 Security

### Enable HTTPS

GitHub Pages automatically provides HTTPS. To enforce it:

1. Go to **Settings** → **Pages**
2. Check **Enforce HTTPS**

### Content Security Policy

Add to `index.html` `<head>`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline';"
/>
```

## 🎨 Customization

### Change Colors

Edit `styles.css`:

```css
:root {
  --primary: #667eea; /* Your brand color */
  --secondary: #764ba2; /* Secondary color */
}
```

### Add Logo

1. Add logo image to `docs-site/`
2. Update `index.html`:

```html
<div class="nav-brand">
  <img src="logo.png" alt="DoorAuth" width="40" height="40" />
  <span class="brand-name">DoorAuth</span>
</div>
```

### Update Content

Edit sections in `index.html`:

- Hero section: Update title, subtitle, stats
- Features: Modify feature cards
- Quick Start: Update installation steps
- Integration: Add/modify framework guides

## 📦 Backup

### Create Backup

```bash
# Create backup of docs-site
tar -czf docs-site-backup-$(date +%Y%m%d).tar.gz docs-site/
```

### Restore from Backup

```bash
# Extract backup
tar -xzf docs-site-backup-YYYYMMDD.tar.gz
```

## 🔄 Updates

### Update Documentation

1. Edit files in `docs-site/`
2. Test locally
3. Commit and push:

```bash
git add docs-site/
git commit -m "Update documentation"
git push origin main
```

4. GitHub Actions will automatically deploy

### Version Control

Tag releases:

```bash
git tag -a v1.0.0 -m "Documentation site v1.0.0"
git push origin v1.0.0
```

## 📞 Support

### Getting Help

- **GitHub Issues**: Report bugs or request features
- **GitHub Discussions**: Ask questions
- **Documentation**: Check README.md

### Useful Links

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## ✅ Deployment Checklist

Before going live:

- [ ] Update all `yourusername` references
- [ ] Test all links
- [ ] Verify code examples
- [ ] Test on mobile devices
- [ ] Check browser compatibility
- [ ] Verify sitemap and robots.txt
- [ ] Test 404 page
- [ ] Enable HTTPS
- [ ] Add analytics (optional)
- [ ] Submit sitemap to search engines

## 🎉 Success!

Your DoorAuth documentation site is now live! Share it with:

- README.md badge
- Social media
- Developer communities
- Documentation portals

---

**Need help?** Open an issue on GitHub or check the troubleshooting section above.
