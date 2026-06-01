# 🌐 DNS Configuration Guide

**How to point your domain to your VPS**

---

## What is DNS?

DNS (Domain Name System) translates your domain name (e.g., `example.com`) to your VPS IP address (e.g., `123.456.789.012`).

---

## What You Need

- ✅ Your domain name (purchased from registrar)
- ✅ Your VPS IP address
- ✅ Access to domain registrar's control panel

---

## Step 1: Find Your VPS IP Address

```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Get public IP
curl ifconfig.me
# or
curl ipinfo.io/ip
```

Save this IP address (example: `123.456.789.012`)

---

## Step 2: Access Your Domain Registrar

Common registrars:
- **GoDaddy**: godaddy.com → My Products → Domain → DNS
- **Namecheap**: namecheap.com → Domain List → Manage → Advanced DNS
- **Google Domains**: domains.google.com → Your domain → DNS
- **Cloudflare**: cloudflare.com → Your domain → DNS

---

## Step 3: Add DNS Records

You need to add **3 A records**:

### Record 1: Main Domain

```
Type: A
Name: @ (or leave blank or use yourdomain.com)
Value: YOUR_VPS_IP
TTL: 3600 (or Auto)
```

**This makes `yourdomain.com` point to your VPS**

### Record 2: WWW Subdomain

```
Type: A
Name: www
Value: YOUR_VPS_IP
TTL: 3600 (or Auto)
```

**This makes `www.yourdomain.com` point to your VPS**

### Record 3: API Subdomain

```
Type: A
Name: api
Value: YOUR_VPS_IP
TTL: 3600 (or Auto)
```

**This makes `api.yourdomain.com` point to your VPS (for backend API)**

---

## Step 4: Wait for DNS Propagation

⏱️ **DNS changes take time to propagate globally**

- Minimum: 5 minutes
- Typical: 30 minutes to 2 hours
- Maximum: 24-48 hours

---

## Step 5: Test DNS Configuration

### Method 1: Using Ping

```bash
# From your local computer
ping yourdomain.com
ping www.yourdomain.com
ping api.yourdomain.com
```

If working, you'll see:
```
PING yourdomain.com (123.456.789.012): 56 data bytes
64 bytes from 123.456.789.012: icmp_seq=0 ttl=54 time=23.1 ms
```

### Method 2: Using nslookup

```bash
nslookup yourdomain.com
nslookup www.yourdomain.com
nslookup api.yourdomain.com
```

Should show your VPS IP address.

### Method 3: Online DNS Checker

Visit: https://www.whatsmydns.net/
Enter: `yourdomain.com`
Check if it resolves to your VPS IP worldwide

---

## Registrar-Specific Guides

### GoDaddy

1. Login to GoDaddy
2. Go to **My Products**
3. Click on your domain
4. Click **DNS** button
5. Scroll to **Records** section
6. Click **Add** for each record:

   **Record 1:**
   - Type: `A`
   - Name: `@`
   - Value: `YOUR_VPS_IP`
   - TTL: `1 Hour`
   
   **Record 2:**
   - Type: `A`
   - Name: `www`
   - Value: `YOUR_VPS_IP`
   - TTL: `1 Hour`
   
   **Record 3:**
   - Type: `A`
   - Name: `api`
   - Value: `YOUR_VPS_IP`
   - TTL: `1 Hour`

7. Click **Save**

---

### Namecheap

1. Login to Namecheap
2. Go to **Domain List**
3. Click **Manage** next to your domain
4. Click **Advanced DNS** tab
5. Click **Add New Record** for each:

   **Record 1:**
   - Type: `A Record`
   - Host: `@`
   - Value: `YOUR_VPS_IP`
   - TTL: `Automatic`
   
   **Record 2:**
   - Type: `A Record`
   - Host: `www`
   - Value: `YOUR_VPS_IP`
   - TTL: `Automatic`
   
   **Record 3:**
   - Type: `A Record`
   - Host: `api`
   - Value: `YOUR_VPS_IP`
   - TTL: `Automatic`

6. Click **Save All Changes**

---

### Cloudflare

If using Cloudflare for DNS and CDN:

1. Login to Cloudflare
2. Select your domain
3. Go to **DNS** section
4. Click **Add record** for each:

   **Record 1:**
   - Type: `A`
   - Name: `@` or `yourdomain.com`
   - IPv4 address: `YOUR_VPS_IP`
   - Proxy status: `Proxied` (orange cloud) ✅
   - TTL: `Auto`
   
   **Record 2:**
   - Type: `A`
   - Name: `www`
   - IPv4 address: `YOUR_VPS_IP`
   - Proxy status: `Proxied` (orange cloud) ✅
   - TTL: `Auto`
   
   **Record 3:**
   - Type: `A`
   - Name: `api`
   - IPv4 address: `YOUR_VPS_IP`
   - Proxy status: `Proxied` (orange cloud) ✅
   - TTL: `Auto`

5. **Important for Cloudflare:**
   - Go to **SSL/TLS** → **Overview**
   - Set to **Full (strict)** mode
   
**Note:** Cloudflare provides free SSL automatically! You may not need Certbot.

---

### Google Domains

1. Login to Google Domains
2. Click on your domain
3. Go to **DNS** in left sidebar
4. Scroll to **Custom resource records**
5. Add each record:

   **Record 1:**
   - Name: `@`
   - Type: `A`
   - TTL: `1h`
   - Data: `YOUR_VPS_IP`
   
   **Record 2:**
   - Name: `www`
   - Type: `A`
   - TTL: `1h`
   - Data: `YOUR_VPS_IP`
   
   **Record 3:**
   - Name: `api`
   - Type: `A`
   - TTL: `1h`
   - Data: `YOUR_VPS_IP`

6. Click **Add**

---

## Common Issues & Solutions

### Issue 1: DNS not propagating

**Solution:**
- Wait longer (up to 24 hours)
- Clear local DNS cache:
  
  **Windows:**
  ```cmd
  ipconfig /flushdns
  ```
  
  **Mac:**
  ```bash
  sudo dscacheutil -flushcache
  ```
  
  **Linux:**
  ```bash
  sudo systemd-resolve --flush-caches
  ```

### Issue 2: Domain shows "Site can't be reached"

**Possible causes:**
1. DNS not propagated yet → Wait longer
2. Firewall blocking ports → Check UFW allows 80/443
3. Nginx not running → `sudo systemctl status nginx`

### Issue 3: API subdomain not working

**Check:**
1. DNS record for `api` subdomain exists
2. Nginx configuration includes `api.yourdomain.com`
3. Backend is running: `pm2 status`

### Issue 4: Cloudflare showing "Error 522"

**Solution:**
```bash
# On VPS, allow Cloudflare IPs through firewall
sudo ufw allow from 173.245.48.0/20
sudo ufw allow from 103.21.244.0/22
sudo ufw allow from 103.22.200.0/22
# ... (see Cloudflare IP ranges documentation)
```

---

## Optional: Email Configuration

If you want to receive emails at your domain:

### Using Gmail (Recommended for small setups)

Add **MX Records**:

```
Type: MX
Name: @ (or blank)
Value: ASPMX.L.GOOGLE.COM
Priority: 1

Type: MX
Name: @
Value: ALT1.ASPMX.L.GOOGLE.COM
Priority: 5

Type: MX
Name: @
Value: ALT2.ASPMX.L.GOOGLE.COM
Priority: 5
```

Then configure Gmail to receive mail for your domain (Google Workspace required).

---

## Verification Checklist

After DNS configuration:

- [ ] `ping yourdomain.com` returns VPS IP
- [ ] `ping www.yourdomain.com` returns VPS IP
- [ ] `ping api.yourdomain.com` returns VPS IP
- [ ] Opening `http://yourdomain.com` in browser reaches your VPS
- [ ] Online DNS checker shows records worldwide
- [ ] No DNS errors in registrar panel
- [ ] TTL set appropriately (3600 seconds / 1 hour)

---

## Next Steps

After DNS is configured and propagating:

1. **Install SSL Certificate:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
   ```

2. **Test HTTPS:**
   - Visit: `https://yourdomain.com`
   - Visit: `https://api.yourdomain.com/health`

3. **Update Application:**
   - Backend CORS: Update `CORS_ORIGIN` in `.env`
   - Mobile app: Update API URL
   - Desktop app: Update API URL

---

## DNS Record Summary

| Record Type | Name | Value | Purpose |
|-------------|------|-------|---------|
| A | @ | YOUR_VPS_IP | Main domain (yourdomain.com) |
| A | www | YOUR_VPS_IP | WWW subdomain (www.yourdomain.com) |
| A | api | YOUR_VPS_IP | API subdomain (api.yourdomain.com) |

---

## Tips

1. **Use low TTL initially** (300 seconds) when testing, increase to 3600 after confirming it works
2. **Keep old DNS records** for first 48 hours when migrating
3. **Use Cloudflare** for free CDN, DDoS protection, and SSL
4. **Document your DNS setup** for future reference
5. **Set up DNS monitoring** (like UptimeRobot) to get alerts if DNS fails

---

## Resources

- **DNS Propagation Checker**: https://www.whatsmydns.net/
- **DNS Lookup Tool**: https://mxtoolbox.com/DNSLookup.aspx
- **Cloudflare DNS**: https://www.cloudflare.com/
- **Let's Encrypt SSL**: https://letsencrypt.org/

---

**DNS Configuration Complete! 🎉**

Once DNS propagates, proceed with SSL certificate installation.
