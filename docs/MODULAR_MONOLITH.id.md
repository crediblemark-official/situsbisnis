### Modular Monolith: Arsitektur Strategis untuk Skalabilitas dan Efisiensi Pengembangan

#### Ringkasan Eksekutif

Dokumen ini merangkum wawasan mendalam mengenai arsitektur  *Modular Monolith*  sebagai alternatif yang lebih unggul dibandingkan monolit tradisional maupun transisi prematur ke  *microservices* . Premis utamanya adalah bahwa membangun aplikasi monolitik dengan batasan logis yang ketat (modular) memungkinkan organisasi untuk fokus pada pertumbuhan bisnis tanpa terjebak dalam kompleksitas infrastruktur yang berlebihan.Poin-poin kritis dalam dokumen ini meliputi:

* **Efisiensi Pengembangan:**  Menghindari  *over-engineering*  pada tahap awal bisnis dengan tetap menjaga kualitas kode.  
* **Pemisahan Logis:**  Penggunaan kontrak ( *interface* ) antar modul untuk memastikan kemandirian setiap domain bisnis.  
* **Jalur Migrasi yang Mulus:**  Desain modular mempermudah ekstraksi modul menjadi  *microservices*  di masa depan tanpa merombak logika bisnis utama.  
* **Disiplin Arsitektur:**  Penerapan pengujian otomatis untuk mencegah ketergantungan antar modul yang tidak sah ( *spaghetti code* ).

#### Masalah pada Arsitektur Tradisional dan Risiko Microservices

Analisis ini mengidentifikasi tantangan signifikan dalam dua pendekatan arsitektur yang umum digunakan:

##### 1\. Masalah Monolit Tradisional

Monolit tradisional sering kali berakhir menjadi "spaghetti code" karena alasan berikut:

* **Ketiadaan Batasan Akses:**  Tidak ada batasan antar domain bisnis (misalnya, modul Order langsung memanggil logika internal modul Product), yang menyebabkan ketergantungan yang sangat erat ( *high coupling* ).  
* **Circular Code:**  Situasi di mana modul A memanggil B, B memanggil C, dan C memanggil kembali A, menciptakan kerumitan dalam pemeliharaan.  
* **Keterikatan Database:**  Database menjadi sangat kompleks dengan ratusan tabel yang saling terhubung melalui  *join*  dan  *foreign key*  yang masif, sehingga sulit untuk memisahkan satu modul di kemudian hari.

##### 2\. Risiko Prematur Microservices

Membangun  *microservices*  di awal perkembangan bisnis sering dianggap sebagai  *over-engineering*  karena:

* **Kompleksitas Infrastruktur:**  Membutuhkan pengelolaan yang jauh lebih rumit, termasuk CI/CD, Kubernetes,  *service discovery* , dan API Gateway.  
* **Overhead Jaringan:**  Komunikasi antar layanan melalui HTTP atau gRPC lebih lambat dibandingkan panggilan kode langsung.  
* **Transaksi Terdistribusi:**  Kegagalan transaksi jauh lebih sulit dikelola, sering kali memerlukan implementasi pola yang kompleks seperti  *Saga Pattern* .  
* **Efisiensi Tim:**  Adanya risiko di mana jumlah layanan melebihi jumlah anggota tim, yang justru menurunkan produktivitas.

#### Strategi dan Implementasi Modular Monolit

*Modular Monolith*  menawarkan jalan tengah: satu unit  *deployment*  namun dengan pemisahan domain yang sangat jelas.

##### Konsep Kontrak dan Modul

Setiap domain bisnis dipecah menjadi dua komponen utama untuk memastikan batasan yang ketat ( *strict boundary* ):| Komponen | Deskripsi || \------ | \------ || **Modul Klien (Kontrak)** | Berisi  *interface*  atau kontrak API yang mendefinisikan apa yang bisa digunakan oleh modul lain. Hanya mengekspos fungsi yang benar-benar diperlukan (misalnya:  *Get Product by ID* ). || **Modul Implementasi** | Berisi logika bisnis internal dan detail teknis. Modul lain tidak diperbolehkan mengakses bagian ini secara langsung. |

##### Prinsip Interaksi Antar Modul

* **Enkapsulasi:**  Kompleksitas internal sebuah modul disembunyikan. Modul luar hanya berinteraksi melalui kontrak klien yang telah disepakati.  
* **Minimalis:**  Kontrak hanya mengekspos data dan fungsi yang relevan bagi modul lain. Misalnya, jika tabel produk memiliki 100 kolom tetapi modul order hanya butuh 20, maka kontrak hanya memberikan 20 kolom tersebut.

#### Isolasi Database dan Penanganan Data

Salah satu aspek paling krusial dalam  *Modular Monolith*  adalah mengubah paradigma pengelolaan database:

* **Tanpa Foreign Key Antar Modul:**  Tidak boleh ada relasi fisik di database antar tabel yang berbeda modul (misalnya, tabel Orders tidak memiliki  *foreign key*  ke tabel Customers). Hal ini dilakukan agar modul dapat dipindahkan ke database berbeda di masa depan dengan mudah.  
* **Menghindari Database Join:**  Alih-alih melakukan  *join*  antar tabel domain yang berbeda, aplikasi harus mengambil data melalui kontrak klien.  
* *Solusi N+1 Query:*  Gunakan strategi pengambilan data massal (misalnya, getCustomersByIds) untuk mengoptimalkan performa.  
* **Independensi Database:**  Setiap modul dirancang seolah-olah memiliki database sendiri, meskipun pada praktiknya masih berada dalam satu skema yang sama saat fase monolit.

#### Fleksibilitas Migrasi: Microservices dan Event-Driven

Arsitektur ini menyediakan jalur migrasi yang efisien jika beban trafik meningkat:

* **Migrasi ke Microservices:**  Saat sebuah modul (misalnya: Payment) perlu dipisahkan, pengembang hanya perlu mengganti implementasi di dalam modul klien dari panggilan kode langsung menjadi panggilan API (HTTP/gRPC). Logika bisnis pada modul lain (misalnya: Order) tidak memerlukan perubahan sama sekali.  
* **Migrasi ke Event-Driven:**  Jika diperlukan komunikasi asinkron, implementasi kontrak dapat diubah untuk mengirim pesan melalui  *message broker*  seperti Kafka atau RabbitMQ. Modul pengirim tetap menggunakan kontrak yang sama tanpa mengetahui bahwa di balik layar data kini dikirim melalui sistem pesan.

#### Menjaga Integritas Arsitektur di SitusBisnis

Tanpa pengawasan, *Modular Monolith* berisiko kembali menjadi monolit tradisional yang berantakan (*spaghetti code*). Oleh karena itu, di SitusBisnis kami menerapkan perlindungan statis:

* **Architecture Linter (`dependency-cruiser`)**: Kami mengonfigurasi `.dependency-cruiser.json` untuk memeriksa semua impor file di dalam `/src/modules`. Aturan utamanya adalah:
  * Modul dilarang mengimpor file internal dari modul lain secara langsung.
  * Komunikasi antar-modul wajib melewati **Facade Client / Pintu Gerbang Utama** di `src/modules/<nama-modul>/index.ts`.
  * Menjalankan perintah `bun run test:architecture` di CI/CD atau lokal untuk memastikan kepatuhan 100%.

---

#### Struktur Layered Architecture (Arsitektur Berlapis)

Setiap modul domain bisnis (seperti `auth`, `tenant`, `billing`, `order`, `catalog`, `content`) dipecah menjadi lapisan tanggung jawab tunggal (*Single Responsibility*) agar kode tetap rapi, modular, DRY, dan di bawah batas 300 baris per file:

1. **Facade Layer (`index.ts`)**: Kontak publik tunggal modul (misalnya `BillingClient`, `CatalogClient`) yang diimpor oleh modul luar atau rute API.
2. **Action Layer (`actions.ts` / Server Actions)**: Lapisan interaksi pembungkus yang menerima input pengguna, menangani request Next.js, dan memanggil Service.
3. **Service Layer (`services/*.service.ts`)**: Lapisan logika bisnis utama (validasi aturan bisnis, kalkulasi data, integrasi pihak ketiga).
4. **Repository Layer (`repositories/*.repository.ts`)**: Lapisan akses data yang berinteraksi langsung dengan database lewat Prisma Client (`db`).

---

#### Decoupling Database Fisik (Site - User)

Untuk menghindari foreign key yang mengikat ketat lintas batas fisik modul:
* Relasi langsung Many-to-Many `SiteToUser` di skema Prisma telah dihapus dan diganti dengan model tabel jembatan `SiteUser`.
* Pengecekan data relasi lintas modul dilakukan secara *in-memory* menggunakan helper client (seperti `IdentityClient.getSiteOwner`) untuk mensimulasikan lingkungan multi-database/microservices.

---

#### Kesimpulan

*Modular Monolith* dengan *Layered Architecture* di SitusBisnis memungkinkan proyek dikembangkan dengan cepat dan teratur. Pemisahan yang ketat melalui Facade dan decoupling database memastikan bahwa setiap modul siap diekstraksi menjadi *microservices* mandiri di masa mendatang jika kebutuhan skala bisnis menuntutnya.
