# 🚀 GitHub Repository Kurulum Rehberi

## 📋 **MEVCUT DURUM**
- ✅ Git repository oluşturuldu
- ✅ Dosyalar commit edildi
- ❌ GitHub'a push edilmedi
- ❌ Remote repository ayarlanmadı

## 🎯 **ADIM ADIM KURULUM**

### **Adım 1: GitHub Repository Oluştur (2 dakika)**

#### **Yöntem A: GitHub Web Interface**
```
1. github.com gir
2. Sağ üst "New" butonuna tıkla
3. Repository name: biletpro
4. Description: Enterprise SaaS Platform
5. Public seç (ücretsiz)
6. "Create repository" de
```

#### **Yöntem B: GitHub CLI (Hızlı)**
```bash
# GitHub CLI yükle (yoksa)
npm install -g @github/cli

# Giriş yap
gh auth login

# Repository oluştur
gh repo create biletpro --public --description "Enterprise SaaS Platform"
```

### **Adım 2: Repository Bağlantısı (1 dakika)**
```bash
# GitHub'dan aldığın URL ile
git remote add origin https://github.com/KULLANICI_ADI/biletpro.git

# Veya GitHub CLI ile
gh repo set-default
```

### **Adım 3: GitHub'a Push (1 dakika)**
```bash
# Ana branch'e push et
git push -u origin main

# Veya GitHub CLI ile
gh repo sync
```

## 🌐 **REPOSITORY URL'LERİ**

### **GitHub Repository**
```
Format: https://github.com/KULLANICI_ADI/biletpro
Örnek: https://github.com/ahmet/biletpro
```

### **GitHub Pages (Demo)**
```
Format: https://KULLANICI_ADI.github.io/biletpro
Örnek: https://ahmet.github.io/biletpro
```

### **GitHub Actions (CI/CD)**
```
Format: https://github.com/KULLANICI_ADI/biletpro/actions
Örnek: https://github.com/ahmet/biletpro/actions
```

## 🚀 **OTOMATİK DEPLOYMENT**

### **GitHub Pages ile Demo**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### **Netlify ile Otomatik Deploy**
```yaml
# .github/workflows/netlify.yml
name: Deploy to Netlify
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.1
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          netlify-auth-token: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          netlify-site-id: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📱 **MOBİL UYGULAMA İÇİN**

### **GitHub Mobile Repository**
```
1. github.com/KULLANICI_ADI/biletpro-mobile oluştur
2. React Native projesini yükle
3. Expo build konfigürasyonu
4. GitHub Actions ile otomatik build
```

### **GitHub Release**
```bash
# Release oluştur
gh release create v1.0.0 --title "BiletPro v1.0" --notes "Initial release"

# Veya manuel
# GitHub > Repository > Releases > Create a release
```

## 🔍 **REPOSITORY BULMA**

### **GitHub Arama**
```
1. github.com gir
2. Sağ üst arama kutusuna "biletpro" yaz
3. "Repositories" filtresini seç
4. Kendi repository'nu bul
```

### **GitHub Profile**
```
URL: https://github.com/KULLANICI_ADI
Tüm repository'lerin görünür
```

### **GitHub CLI ile Bul**
```bash
# Repository listele
gh repo list

# Repository detayları
gh repo view KULLANICI_ADI/biletpro

# Repository aç
gh repo view KULLANICI_ADI/biletpro --web
```

## 🌐 **PUBLIC URL'LER**

### **Repository URL**
```
https://github.com/KULLANICI_ADI/biletpro
```

### **Raw File URL**
```
https://raw.githubusercontent.com/KULLANICI_ADI/biletpro/main/package.json
```

### **GitHub Pages URL**
```
https://KULLANICI_ADI.github.io/biletpro
```

### **Download ZIP**
```
https://github.com/KULLANICI_ADI/biletpro/archive/refs/heads/main.zip
```

## 📊 **REPOSITORY STATİSTİKLERİ**

### **GitHub Insights**
```
1. Repository > Insights > Overview
2. Traffic: Ziyaretçi sayısı
3. Commits: Commit geçmişi
4. Contributors: Geliştiriciler
5. Network: Fork'lar
```

### **GitHub API**
```bash
# Repository bilgileri
curl https://api.github.com/repos/KULLANICI_ADI/biletpro

# Star sayısı
curl https://api.github.com/repos/KULLANICI_ADI/biletpro/stargazers

# Fork sayısı
curl https://api.github.com/repos/KULLANICI_ADI/biletpro/forks
```

## 🔧 **REPOSITORY AYARLARI**

### **Settings > General**
```
- Repository name
- Description
- Website URL
- Topics (etiketler)
- Features (Issues, Projects, Wiki)
```

### **Settings > Branches**
```
- Default branch: main
- Branch protection rules
- Required status checks
```

### **Settings > Integrations**
```
- GitHub Actions
- GitHub Pages
- Dependabot
- Code scanning
```

## 🎯 **HEMEN YAPILACAKLAR**

### **1. GitHub Repository Oluştur**
```bash
# GitHub web interface'de
1. github.com/new
2. Repository name: biletpro
3. Public seç
4. Create repository
```

### **2. Remote Ekle**
```bash
git remote add origin https://github.com/KULLANICI_ADI/biletpro.git
```

### **3. Push Et**
```bash
git push -u origin main
```

### **4. Kontrol Et**
```
URL: https://github.com/KULLANICI_ADI/biletpro
```

## 📱 **DEMO LINK'LER**

### **GitHub Pages Demo**
```
1. Repository > Settings > Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Save
5. 5 dakika sonra hazır
URL: https://KULLANICI_ADI.github.io/biletpro
```

### **Netlify Demo**
```
1. netlify.com gir
2. GitHub ile bağlan
3. BiletPro reposunu seç
4. Deploy
URL: https://biletpro.netlify.app
```

## 🎯 **SONUÇ**

**Repository GitHub'a yüklenmeli, şu an sadece local'de!**

**Hemen yapılacaklar:**
1. GitHub'da repository oluştur
2. Remote bağlantısını kur
3. Push et
4. Public URL'i al

**5 dakikada her şey hazır!**
