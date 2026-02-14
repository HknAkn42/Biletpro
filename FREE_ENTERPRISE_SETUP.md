# 🆓 Ücretsiz Enterprise BiletPro Kurulum Rehberi

## 🏠 **SEÇENEK 1: Kendi PC Sunucu (En İyi)**

### 💻 **Gerekli Donanım**
```
Minimum:
- CPU: 4 Core (Intel i5/AMD Ryzen 5)
- RAM: 8GB DDR4
- SSD: 256GB NVMe
- Network: 100Mbps upload
- OS: Ubuntu 22.04 LTS

Tavsiye:
- CPU: 8 Core (Intel i7/AMD Ryzen 7)
- RAM: 16GB DDR4
- SSD: 1TB NVMe
- Network: 1Gbps fiber
- OS: Ubuntu 22.04 LTS
```

### 🚀 **Kurulum Adımları**
```bash
# 1. Node.js Backend Kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. PostgreSQL Kurulumu
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
CREATE DATABASE biletpro;
CREATE USER biletpro WITH PASSWORD 'sifre123';
GRANT ALL PRIVILEGES ON DATABASE biletpro TO biletpro;

# 3. Redis Kurulumu
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 4. Nginx Load Balancer
sudo apt install -y nginx
sudo ufw allow 'Nginx Full'

# 5. SSL Sertifikası (Ücretsiz)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d biletpro.domain.com
```

### 📱 **Dynamic DNS (Ücretsiz)**
```bash
# DuckDNS (tamamen ücretsiz)
# 1. duckdns.org'a kayıt ol
# 2. Domain oluştur: biletpro.duckdns.org
# 3. Auto-update script kur

# Veya No-IP (ücretsiz)
# 1. noip.com'a kayıt ol
# 2. Domain: biletpro.ddns.net
```

### 🔥 **Firewall Konfigürasyonu**
```bash
# Gerekli portları aç
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5432  # PostgreSQL (sadece local)
sudo ufw allow 6379  # Redis (sadece local)
sudo ufw enable
```

## ☁️ **SEÇENEK 2: Cloud Services (Free Tier)**

### 🔥 **Oracle Cloud (Always Free)**
```yaml
# Compute: 4 AMD CPU, 24GB RAM, 200GB SSD
# Bandwidth: 10TB/ay (ücretsiz)
# Load Balancer: Ücretsiz
# Database: Autonomous Database (ücretsiz)
```

### 🟢 **Google Cloud ($300 kredi)**
```yaml
# Compute: e2-medium (2 vCPU, 4GB RAM)
# Storage: 100GB Persistent Disk
# Network: 100GB bandwidth
# Database: Cloud SQL (ücretsiz tier)
```

### 🔵 **Microsoft Azure ($200 kredi)**
```yaml
# Compute: B2s (2 vCPU, 4GB RAM)
# Storage: 128GB SSD
# Database: Azure SQL (ücretsiz tier)
# CDN: Azure CDN (ücretsiz tier)
```

## 🐳 **DOCKER KURULUMU (En Kolay)**

### 📦 **Docker Compose File**
```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: biletpro
      POSTGRES_USER: biletpro
      POSTGRES_PASSWORD: sifre123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Node.js API
  api:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://biletpro:sifre123@postgres:5432/biletpro
      REDIS_URL: redis://redis:6379
      JWT_SECRET: super-secret-key-change-in-production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 🚀 **Hızlı Başlatma Script**
```bash
#!/bin/bash
# start-biletpro.sh
echo "🚀 BiletPro Enterprise Başlatılıyor..."

# Docker'ı başlat
docker-compose up -d

# Servislerin durumunu kontrol et
sleep 10
docker-compose ps

echo "✅ BiletPro hazır!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:3000"
echo "📊 Database: localhost:5432"
```

## 📱 **MOBİL ERİŞİM**

### 🌐 **Tunneling (Ücretsiz)**
```bash
# Ngrok (ücretsiz)
npm install -g ngrok
ngrok http 80

# Veya Cloudflare Tunnel (ücretsiz)
npm install -g cloudflared
cloudflared tunnel --url http://localhost:3000
```

### 📱 **Local Network Access**
```bash
# Telefon/tablet'ten erişim için
# 1. Aynı WiFi'da ol
# 2. IP adresini bul: ifconfig | grep inet
# 3. Tarayıcıdan: http://192.168.1.100:3000
```

## 🔐 **GÜVENLİK KURULUMU**

### 🛡️ **Fail2Ban (Brute Force Koruması)**
```bash
sudo apt install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 🔥 **UFW Firewall**
```bash
# Rate limiting
sudo ufw limit 22/tcp
sudo ufw limit 80/tcp
sudo ufw limit 443/tcp

# Port knocking (gizli erişim)
sudo ufw reject 3000/tcp
# Sadece belirli IP'ler erişsin
sudo ufw allow from 192.168.1.0 to any port 3000
```

## 📊 **MONITORING (Ücretsiz)**

### 📈 **Uptime Kuma**
```bash
# UptimeRobot (ücretsiz)
# 1. uptimerobot.com'a kayıt ol
# 2. 50 monitor ücretsiz
# 3. SMS/e-posta alert
```

### 📊 **Performance Monitoring**
```bash
# Netdata (ücretsiz)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Web interface: http://localhost:19999
```

## 💾 **BACKUP STRATEJİSİ**

### 🔄 **Otomatik Backup Script**
```bash
#!/bin/bash
# backup-biletpro.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# PostgreSQL backup
docker exec postgres pg_dump -U biletpro biletpro > $BACKUP_DIR/biletpro_$DATE.sql

# Dosyaları sıkıştır
tar -czf $BACKUP_DIR/biletpro_$DATE.tar.gz $BACKUP_DIR/biletpro_$DATE.sql

# 7 gün eski backup'ları sil
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup tamamlandı: biletpro_$DATE.tar.gz"
```

### ☁️ **Cloud Backup (Ücretsiz)**
```bash
# Google Drive (15GB ücretsiz)
rclone sync /backups gdrive:biletpro-backups

# Veya Dropbox (2GB ücretsiz)
rclone sync /backups dropbox:biletpro-backups
```

## 🌐 **DOMAIN VE SSL**

### 🆓 **Ücretsiz Domain**
```
1. Freenom (.tk, .ml, .ga, .cf) - tamamen ücretsiz
2. EU.org (.org) - ücretsiz
3. No-IP (.ddns.net) - ücretsiz
4. DuckDNS (.duckdns.org) - ücretsiz
```

### 🔒 **Ücretsiz SSL**
```
1. Let's Encrypt (certbot) - en güvenilir
2. Cloudflare SSL - otomatik yenileme
3. ZeroSSL - ücretsiz 90 gün
```

## 📱 **DEPLOYMENT OTOMASYONU**

### 🚀 **GitHub Actions (Ücretsiz CI/CD)**
```yaml
# .github/workflows/deploy.yml
name: Deploy BiletPro
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted  # Kendi sunucu
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          docker-compose down
          docker-compose pull
          docker-compose up -d
```

## 💰 **TOPLAM MALİYET**

### 🏠 **Kendi PC Seçeneği**
```
Donanım (tek seferlik): ₺15,000
İnternet (aylık): ₺500
Domain (yıllık): ₺100
Toplam ilk yıl: ₺21,100
Sonraki yıllar: ₺6,100/yıl
```

### ☁️ **Cloud Seçeneği**
```
Oracle Cloud: Tamamen ücretsiz
Google Cloud: $300 kredi = 6 ay ücretsiz
Microsoft Azure: $200 kredi = 4 ay ücretsiz
Sonra: ~₺2,000/ay
```

## 🎯 **TAVSİYE**

### 🏆 **En İyi Seçenek**: Kendi PC + Oracle Cloud
- **Kapasite**: 25,000+ kullanıcı
- **Maliyet**: İlk yıl ₺21,100, sonra ₺6,100/yıl
- **Kontrol**: Tamamen sizde
- **Scalability**: Sınırsız

### 🥈 **İkinci Seçenek**: Sadece Oracle Cloud
- **Kapasite**: 25,000+ kullanıcı  
- **Maliyet**: Tamamen ücretsiz (ilk yıl)
- **Kurulum**: 30 dakika
- **Bakım**: Oracle yönetir

## 🚀 **HEMEN BAŞLAT**

### 1. **Oracle Cloud Hesabı**
1. oracle.com/cloud/free/'a gid
2. Hesap oluştur (kredi kartı gerekli, ama ücret alınmaz)
3. Always Free tier'ı seç

### 2. **Sunucu Kurulumu**
```bash
# Oracle VM oluşturduktan sonra
ssh -i private_key opc@your_ip
git clone https://github.com/kullanici/biletpro.git
cd biletpro
docker-compose up -d
```

**Bu şekilde 25,000 kullanıcıyı ücretsiz olarak destekleyebilirsin!**
