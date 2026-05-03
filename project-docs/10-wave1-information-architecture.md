# Wave 1 Information Architecture and Navigation

## Purpose

Define the initial EmDash-managed IA for the SMAN 2 Pangkalanbun website, based on the audited legacy structure, while keeping the implementation platform-native to this repository.

## Top-Level Navigation

Primary menu order:

1. Beranda
2. Profil Sekolah
3. Blog
4. Keuangan
5. Layanan
6. Prestasi
7. Profil Alumni
8. Kontak

## Menu Tree (Draft for EmDash Menus)

### Beranda

- `/`

### Profil Sekolah

- `/profil/sambutan-kepala-sekolah`
- `/profil/sejarah`
- `/profil/visi-misi`
- `/profil/kondisi-sekolah`
- `/profil/sarana-prasarana`
- `/profil/adiwiyata`
- `/profil/struktur-organisasi/sekolah`
- `/profil/struktur-organisasi/komite-sekolah`
- `/profil/struktur-organisasi/osis`
- `/profil/struktur-organisasi/mpk`
- `/profil/tenaga-pendidik/guru`
- `/profil/tenaga-pendidik/tata-usaha`

### Blog

- `/blogs` (Blog Terbaru)
- `/blogs/info-sekolah`
- `/blogs/agenda`
- `/blogs/galeri`

### Keuangan

- `/keuangan/bos`
- `/keuangan/apbd`
- `/keuangan/komite`

### Layanan

- `/layanan/ekstrakurikuler`
- `/layanan/kelas-layanan/osn`
- `/layanan/kelas-layanan/penelitian`
- `/layanan/laboratorium`
- `/layanan/perpustakaan`
- `/layanan/survei-kepuasan`
- `/layanan/kesiswaan`
- `/layanan/form-pendampingan`

### Prestasi

- `/prestasi`

### Profil Alumni

- `/alumni`

### Kontak

- `/kontak`

## Footer Navigation Groups

- Profil: profile-related links
- Informasi: blog, agenda, gallery links
- Keuangan: BOS/APBD/Komite
- Kontak: address, phone, email, social links

## Content Owner Mapping

This owner mapping is editorial responsibility, not RBAC role enforcement.

- Beranda: Tim Web Sekolah
- Profil Sekolah: Manajemen Sekolah (Kepala Sekolah + Humas)
- Struktur Organisasi: Tata Usaha + Humas
- Tenaga Pendidik/Kependidikan: Tata Usaha
- Blog/Info/Agenda/Galeri: Humas
- Keuangan (BOS/APBD/Komite): Bendahara + Komite
- Layanan Akademik/Kesiswaan: Waka Kurikulum + Waka Kesiswaan
- Prestasi: Waka Kesiswaan + Pembina Ekstrakurikuler
- Alumni: Ikatan Alumni + Humas
- Kontak: Tata Usaha + Humas

## EmDash Implementation Direction

- Manage navigation trees through EmDash menu features (not static JSON).
- Keep route slugs stable to reduce migration redirect overhead.
- Keep content source in EmDash collections (`pages`, `news`, `events`, `finance_reports`, `service_items`, `galleries`, `staff_profiles`, `achievements`, `alumni`).

## Open Decisions (Tracked)

- Whether to keep `/blogs` base path or migrate to `/berita` (defer; keep `/blogs` for parity).
- Whether `Kelas Layanan` should be a parent landing page or menu-only node (defer to #22 with frontend constraints).
