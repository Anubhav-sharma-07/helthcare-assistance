# Phase 16 — Cloud Deployment: AI-Powered Smart Healthcare Assistant

This document outlines the deployment configuration for hosting the platform on AWS EC2, connecting to a MongoDB Atlas cluster, setting up Nginx, and installing Let's Encrypt SSL certificates.

---

## 1. Cloud Infrastructure Overview

```
[Web Users] ➔ [Route 53 / DNS] ➔ [AWS EC2 Instance (Ubuntu)]
                                       │
                             [Nginx Reverse Proxy]
                                 ├── Port 80 (Redirect to 443)
                                 ├── Port 443 (SSL Decryption)
                                 │     ├── /    ➔ Frontend Container (Port 80)
                                 │     └── /api ➔ Backend Container (Port 8000)
                                       │
                             [MongoDB Atlas (Cloud DB)]
```

---

## 2. MongoDB Atlas Configuration
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Shared cluster (M0 free-tier).
3. Under **Database Access**, create a user account with read/write privileges.
4. Under **Network Access**, whitelist the elastic IP address of the EC2 instance (or add `0.0.0.0/0` temporarily for setup).
5. Retrieve the connection string: `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`.

---

## 3. EC2 Instance Provisioning
1. Launch an **AWS EC2 Ubuntu 22.04 LTS** instance (t3.micro is sufficient for basic testing).
2. Attach an **Elastic IP** to prevent IP changes on reboots.
3. Configure Security Group rules:
   * Port 22 (SSH) from trusted IPs.
   * Port 80 (HTTP) from Anywhere.
   * Port 443 (HTTPS) from Anywhere.

---

## 4. Install Docker & Docker Compose
Connect to your EC2 instance via SSH and run:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

---

## 5. Nginx Configuration on Host (Port 80/443 Routing)
Instead of serving directly, install Nginx on the host to route incoming domains to correct container ports:

```nginx
# File: /etc/nginx/sites-available/smartcare
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Certbot SSL validation block
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Serve React Frontend Container
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Serve FastAPI Backend Router
    location /api {
        proxy_pass http://127.0.0.1:8000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/smartcare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Obtain Let's Encrypt SSL
Install Certbot on host to acquire SSL validation:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot will auto-update the Nginx files to resolve verification files and maintain a cron job to renew certificates every 90 days.
