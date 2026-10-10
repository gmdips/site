<h1 align="center">
  <img src="https://avatars.githubusercontent.com/u/218802473?s=160&v=4" width="80" alt="GDIPS Logo" onerror="this.src='https://gdips.wasmer.app/dashboard/icon.png'; this.width='80';"/>
  <br>
  GDIPS Website
  <br>
  <sup><i>Situs resmi Geometry Dash Indonesia Private Server</i></sup>
</h1>

<p align="center">
  <b>Website open-source untuk komunitas GDIPS</b><br>
  <em>Dibangun oleh komunitas, untuk komunitas</em>
</p>

<div align="center">

  ![Open Source](https://img.shields.io/badge/type-Open_Source-informational?style=flat-square)
  ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
  ![Status](https://img.shields.io/badge/deployment-🟢_Active-green?style=flat-square)
  ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)

</div>

<div align="center">
  <sub>Bagian dari <a href="https://github.com/gmdips"><b>@gmdips</b> organization</a></sub>
</div>

<br>

---

## 🌐 Live Preview

<div align="center">

<a href="https://gdips.pages.dev" target="_blank">
  <img src="https://github.com/user-attachments/assets/96cc7ef9-60a2-432b-b395-d466b349c76a" width="620" alt="Website Preview"/>
</a>

<br>
<sup>
  <a href="https://gdips.pages.dev">🏠 Buka Website</a> · 
  <a href="https://gdips.pages.dev/download">📥 Download Game</a> · 
  <a href="https://gdips.wasmer.app">🎮 Dashboard Server</a>
</sup>

</div>

<br>

---

## ❓ Apa Ini?

Ini adalah **source code website resmi GDIPS** — bukan game server-nya, melainkan:

- 🏠 **Landing page** utama organisasi
- 📥 **Halaman download** game client
- 📰 **Blog/artikel** seputar GDIPS
- 👥 **Halaman about** dan kontributor
- 📚 **Dokumentasi** lengkap
- 🔗 **Hub** yang menghubungkan semua layanan GDIPS

> Repo game server ada di sini: [gmdips/GDIPS](https://github.com/gmdips/server)

---

## 🏗 Tech Stack

```
┌─────────────────────────────────────────────┐
│                 FRONTEND                    │
│  ┌─────────┐ ┌────────┐ ┌────────────────┐  │
│  │  HTML5  │ │  CSS3  │ │   JavaScript   │  │
│  └─────────┘ └────────┘ └────────────────┘  │
│  ┌─────────┐ ┌────────┐ ┌────────────────┐  │
│  │ Tailwind│ │ Alpine │ │   Vanilla JS   │  │
│  │ CSS CDN │ │ JS CDN │ │   (no build)   │  │
│  └─────────┘ └────────┘ └────────────────┘  │
├─────────────────────────────────────────────┤
│                  HOSTING                    │
│  ┌──────────────────────────────────────┐   │
│  │     Cloudflare Pages (auto-deploy)   │   │
│  │           gdips.pages.dev            │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│                  TOOLING                    │
│  ┌─────────┐ ┌────────┐ ┌────────────────┐  │
│  │ Git     │ │ GitHub │ │   Cloudflare   │  │
│  │         │ │ Actions│ │  Pages CI/CD   │  │
│  └─────────┘ └────────┘ └────────────────┘  │
└─────────────────────────────────────────────┘
```

**Kenapa no-build?** Agar siapapun — bahkan yang baru pertama kali pakai Git — bisa berkontribusi tanpa setup Node.js, npm, atau build tool apapun.

---

## 🗺 Halaman Website

| Halaman | File | Status | Deskripsi |
|---------|------|--------|-----------|
| Home | `index.html` | ✅ | Landing page utama |
| Download | `download.html` | ✅ | Download game client |
| About | `about.html` | 📋 | Tentang GDIPS & organisasi |
| Contributors | `contributors.html` | 📋 | Daftar semua kontributor |
| Blog | `blog/index.html` | 🔮 | Artikel & update |
| Docs | `docs/index.html` | 🔮 | Dokumentasi teknis |
| 404 | `404.html` | ✅ | Halaman not found |

> ✅ Aktif · 📋 Planned · 🔮 Future · 🚧 WIP

---

## 🚀 Quick Start (Kontributor)

### Tanpa clone (cara termudah)

1. Buka file yang mau diedit langsung di GitHub
2. Klik ✏️ (edit)
3. Edit, commit, buat PR
4. Selesai!

### Dengan clone (lebih lengkap)

```bash
# 1. Fork repo ini
# (klik tombol Fork di atas kanan)

# 2. Clone fork kamu
git clone https://github.com/KAMU/site.git
cd site

# 3. Buat branch baru
git checkout -b fix/typo-landing

# 4. Edit file
# Buka file di text editor kamu

# 5. Preview lokal (opsional)
# Cara paling mudah: drag index.html ke browser
# Atau pakai Live Server di VS Code

# 6. Commit & push
git add .
git commit -m "fix: perbaiki typo di landing page"
git push origin fix/typo-landing

# 7. Buat Pull Request di GitHub
```

### Preview Lokal

```bash
# Option A: langsung buka di browser
# Double-click index.html

# Option B: VS Code Live Server
# Install extension "Live Server"
# Klik kanan index.html → "Open with Live Server"

# Option C: Python (kalau sudah installed)
python3 -m http.server 8080
# Buka http://localhost:8080

# Option D: Node.js (kalau sudah installed)
npx serve .
# Buka http://localhost:3000
```

---

## 📁 Struktur Folder

```
site/
├── 📂 public/                    # Static assets
│   ├── 📂 assets/
│   │   ├── 📂 img/               # Images & icons
│   │   │   ├── logo.png
│   │   │   ├── og-image.png      # Open Graph preview
│   │   │   └── favicon.ico
│   │   ├── 📂 css/
│   │   │   ├── style.css         # Custom styles
│   │   │   └── animations.css    # Animasi & transitions
│   │   └── 📂 js/
│   │       ├── main.js           # Script utama
│   │       └── utils.js          # Helper functions
│   └── 📂 downloads/             # Game client files
│       └── .gitkeep
│
├── 📂 blog/                      # Blog posts
│   ├── index.html
│   └── 📂 posts/
│       └── .gitkeep
│
├── 📂 docs/                      # Dokumentasi
│   ├── index.html
│   └── 📂 guides/
│       └── .gitkeep
│
├── 📂 .github/                   # GitHub configs
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── FUNDING.yml
│   └── workflows/
│       └── deploy.yml
│
├── 📄 index.html                 # Homepage
├── 📄 download.html              # Download page
├── 📄 about.html                 # About page
├── 📄 contributors.html          # Contributors page
├── 📄 404.html                   # Not found page
├── 📄 robots.txt                 # SEO crawl rules
├── 📄 sitemap.xml                # SEO sitemap
├── 📄 _redirects                 # Cloudflare redirects
├── 📄 .gitignore
├── 📄 CONTRIBUTING.md
├── 📄 CODE_OF_CONDUCT.md
├── 📄 LICENSE
├── 📄 README.md
└── 📄 SECURITY.md
```

---

## 🤝 Cara Berkontribusi

### Kontribusi Apa yang Bisa Dilakukan?

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   🐛  Fix Bug        →  Typo, broken link, dll      │
│   🎨  Desain         →  Layout, warna, animasi      │
│   📱  Responsif      →  Mobile-friendly             │
│   ♿  Aksesibilitas   →  Screen reader, keyboard    │
│   🌐  Terjemahan     →  Bahasa Indonesia/English    │
│   📝  Konten         →  Blog post, dokumentasi      │
│   📄  Halaman Baru   →  About, contributors, dll    │
│   🔍  SEO            →  Meta tags, sitemap          │
│   ⚡  Performa       →  Optimasi gambar, kode       │
│   🧪  Testing        →  Cross-browser, cross-device │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Yang Paling Mudah (Untuk Pemula)

- [ ] Fix typo di mana saja
- [ ] Perbaiki broken link
- [ ] Tambah alt text pada gambar
- [ ] Perbaiki indentation HTML
- [ ] Tambah komentar di kode
- [ ] Terjemahkan teks ke Bahasa Indonesia

> 💡 Cari issue dengan label **`good first issue`** atau **`help wanted`**

📖 **Panduan lengkap:** [CONTRIBUTING.md](https://github.com/gmdips/site/blob/main/CONTRIBUTING.md)

---

## 🗺 Roadmap

### Phase 1 — Foundation ✅
- [x] Landing page dasar
- [x] Halaman download
- [x] Responsive layout
- [x] SEO dasar (meta, OG, robots, sitemap)
- [x] Cloudflare Pages deployment
- [x] Open-source release

### Phase 2 — Content 🚧
- [ ] Halaman About lengkap
- [ ] Halaman Contributors (auto-fetch dari GitHub API)
- [ ] Blog system (static)
- [ ] FAQ page
- [ ] Changelog / release notes

### Phase 3 — Polish 📋
- [ ] Dark mode toggle
- [ ] Animasi halus
- [ ] PWA support (offline capable)
- [ ] Multi-language (ID/EN)
- [ ] Search functionality

### Phase 4 — Advanced 🔮
- [ ] Blog dengan kategori & tag
- [ ] Embed dashboard stats
- [ ] Real-time server status
- [ ] Interactive level browser
- [ ] Custom 404 yang lebih keren

---

## 🔗 Link Terkait

<div align="center">

| | Link | Deskripsi |
|---|------|-----------|
| 🌐 | [gdips.pages.dev](https://gdips.pages.dev) | Website ini (live) |
| 🎮 | [Dashboard](https://gdips.wasmer.app) | Game server dashboard |
| 📥 | [Download](https://gdips.pages.dev/download) | Download game client |
| 💻 | [gmdips/GDIPS](https://github.com/gmdips/server) | Repo game server |
| 🏢 | [gmdips org](https://github.com/gmdips) | Organization GitHub |
| ⭐ | [GDPSHub](https://gdpshub.com/gdps/2924) | Profil di GDPSHub |
| 💬 | [Discord](https://discord.gg/YyeZ2Sxjgf) | Server Discord |
| 💬 | [WhatsApp](https://chat.whatsapp.com/Fmh5DoSjbWkBje0ab3RAEF) | Group WhatsApp |
| 📱 | [Reddit](https://www.reddit.com/r/GDIPS) | Subreddit |

</div>

---

## 👥 Kontributor

<div align="center">

**Mereka yang sudah berkontribusi pada website ini:**

<a href="https://github.com/gmdips/site/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=gmdips/site&max=15" />
</a>

<br>

<sup>Mau namamu ada di sini? <a href="CONTRIBUTING.md">Mulai kontribusi!</a></sup>

</div>

---

## 📊 Statistik

<div align="center">

![Repo Size](https://img.shields.io/github/repo-size/gmdips/site?style=flat-square)
![Commit Activity](https://img.shields.io/github/commit-activity/m/gmdips/site?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/gmdips/site?style=flat-square)
![Issues](https://img.shields.io/github/issues/gmdips/site?style=flat-square)
![PRs](https://img.shields.io/github/issues-pr/gmdips/site?style=flat-square)

</div>

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah **MIT License**

```
GDIPS Website
Copyright (c) 2024 gmdips & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

> **Artinya:** Bebas digunakan, dimodifikasi, dan didistribusikan — dengan atau tanpa perubahan. Cukup cantumkan kredit asli.

---

## 💬 Closing

<div align="center">

> *"Website ini bukan cuma halaman statis — ini pintu masuk menuju komunitas kita. Setiap perbaikan kecil di sini berdampak pada kesan pertama ribuan orang."*

<br>

**Mulai dari yang kecil: typo, spacing, warna. Semua berarti.** 💚

<br>

![Divider](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<sup><b>Free Code For Everyone :D</b></sup><br>
<sup>Star repo ini & buat PR pertamamu!</sup><br><br>

<a href="#top">⬆ Kembali ke atas</a>

</div>
