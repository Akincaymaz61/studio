# TeklifAI - Yapay Zeka Destekli Fiyat Teklifi Oluşturucu

Bu proje, [Firebase Studio](https://studio.firebase.google.com/) ortamında geliştirilmiş, Next.js tabanlı modern bir web uygulamasıdır. Tekliflerinizi kolayca oluşturmanıza, yönetmenize ve müşterilerinize göndermenize olanak tanır.

Uygulamanın verileri, ücretsiz bir JSON depolama hizmeti olan **JSONBin.io** üzerinde kalıcı olarak saklanır.

## Projeyi İndirme ve Kendi Sitenizde Yayınlama

Bu uygulamayı kendi hosting platformunuzda yayınlayarak `teklif.siteniz.com` gibi bir adres üzerinden kullanabilirsiniz. Süreç oldukça basittir ve en kolay yöntem Vercel kullanmaktır.

### Gereksinimler
- [Node.js](https://nodejs.org/en) (v20 veya üstü)
- [Git](https://git-scm.com/)
- [GitHub Hesabı](https://github.com/) (Ücretsiz)
- [Vercel Hesabı](https://vercel.com/) (Ücretsiz, GitHub ile bağlanılır)
- [JSONBin.io Hesabı](https://jsonbin.io/) (Ücretsiz)

---

### Adım 1: Proje Dosyalarını İndirin

Projenin sadece kaynak kodunu indirmeniz yeterlidir. `node_modules` ve `.next` gibi klasörler **hariç** diğer tüm dosyaları bilgisayarınıza indirin.

### Adım 2: Gerekli Kütüphaneleri Yükleyin

Proje klasörünü bilgisayarınızda bir terminal veya komut istemi ile açın ve aşağıdaki komutu çalıştırın. Bu komut, uygulamanın çalışması için gereken tüm kütüphaneleri internetten indirecektir.

```bash
npm install
```

### Adım 3: Projeyi GitHub'a Yükleme

Uygulamanızı Vercel'de yayınlamanın en kolay yolu, projenizi bir GitHub deposuna yüklemektir.

1.  **GitHub'da Yeni Depo Oluşturun:**
    *   [GitHub.com](https://github.com) adresine gidin ve "New repository" seçeneğini seçin.
    *   Deponuza bir isim verin (örneğin, `teklif-ai-uygulamam`) ve "Private" (Özel) olarak seçin.
    *   "Create repository" butonuna tıklayın.

2.  **Projeyi GitHub'a Gönderin:**
    *   Bilgisayarınızda projenin bulunduğu klasörü terminalde açın ve aşağıdaki komutları sırasıyla çalıştırın. GitHub'ın size verdiği depo URL'sini kendi URL'niz ile değiştirmeyi unutmayın.

    ```bash
    git init
    git add .
    git commit -m "İlk versiyon"
    git branch -M main
    git remote add origin https://github.com/kullanici-adiniz/depo-adiniz.git
    git push -u origin main
    ```

---

### Adım 4: Veritabanını Kurma (JSONBin.io) - EN ÖNEMLİ ADIM

Uygulamanın verilerini saklayabilmesi için ücretsiz bir bulut veritabanı kurmamız gerekiyor.

1.  **JSONBin.io'ya Kaydolun:**
    *   [jsonbin.io](https://jsonbin.io/) adresine gidin ve ücretsiz bir hesap oluşturun.

2.  **Yeni bir "Bin" (Veri Kutusu) Oluşturun:**
    *   Giriş yaptıktan sonra, karşınıza çıkan ekranda "Create Your First Bin" veya benzeri bir butona tıklayın.
    *   İçerik olarak `{"quotes":[],"customers":[],"companyProfiles":[]}` metnini yapıştırın ve "Create" butonuna basın.
    *   Oluşturulduktan sonra tarayıcınızın adres çubuğundaki URL'ye bakın. `https://jsonbin.io/`'dan sonra gelen uzun karakter dizisi sizin **Bin ID**'nizdir. Örnek: `671a53dfas7da12345e71234`. **Bu ID'yi kopyalayın.**

3.  **API Anahtarınızı Alın:**
    *   Sağ üstteki menüden "API Keys" sayfasına gidin.
    *   Bu sayfada size varsayılan olarak bir **"Master Key"** verilir. Bu anahtarın yanındaki kopyalama ikonuna tıklayarak **API anahtarınızı kopyalayın.** Bu anahtar `$2a$...` ile başlar.

Artık elinizde 2 önemli bilgi var: **Bin ID** ve **API Anahtarı**.

### Adım 5: Projeyi Vercel'de Yayınlama ve Veritabanını Bağlama

1.  **Vercel'e Kaydolun:** [vercel.com](https://vercel.com) adresine gidin ve GitHub hesabınızla giriş yapın.
2.  **Vercel'de Yeni Proje Oluşturun:**
    *   Vercel dashboard'unda "Add New... -> Project" seçeneğine tıklayın.
    *   Bir önceki adımda oluşturduğunuz GitHub deposunu seçin ve "Import" deyin.
3.  **Ortam Değişkenlerini (Environment Variables) Ayarlayın:**
    *   Bu en kritik adımdır. Deploy ekranında, **"Environment Variables"** bölümünü bulun.
    *   **"Add New"** diyerek iki adet değişken ekleyin:
        *   **Değişken 1:**
            *   **Name:** `JSONBIN_API_KEY`
            *   **Value:** JSONBin.io'dan aldığınız **API Anahtarını** buraya yapıştırın.
        *   **Değişken 2:**
            *   **Name:** `JSONBIN_BIN_ID`
            *   **Value:** JSONBin.io'dan aldığınız **Bin ID**'yi buraya yapıştırın.
4.  **Deploy Edin:** "Deploy" butonuna tıklayın. Vercel projenizi yayınlayacak ve veritabanı bağlantı bilgilerinizle birlikte çalışır hale getirecektir.

---

### Adım 6: Kendi Alan Adınızı Bağlama (Opsiyonel)

1.  **Vercel Proje Ayarları:** Vercel'deki proje sayfanızda "Settings" sekmesine ve ardından "Domains" menüsüne gidin.
2.  **Alan Adı Ekleme:** Kullanmak istediğiniz alan adını (örneğin, `teklif.siteniz.com`) girin ve "Add" butonuna tıklayın.
3.  **DNS Kayıtlarını Alın:** Vercel size bir CNAME veya A kaydı gibi bir DNS kaydı verecektir.
4.  **DNS Yönetimi:** Alan adınızı satın aldığınız firmanın (GoDaddy, Namecheap, Turhost vb.) web sitesine gidip DNS yönetim bölümüne Vercel'in verdiği kaydı ekleyin. Bu işlemin aktif olması birkaç saat sürebilir.

## Proje Nasıl Güncellenir?

Bu geliştirme ortamında veya kendi bilgisayarınızda projede bir değişiklik yaptıktan sonra, bu güncellemeyi canlı sitenize yansıtmak çok basittir.

1.  **Değişiklikleri GitHub'a Gönderin:** Bilgisayarınızda proje klasörünü terminalde açın ve aşağıdaki komutları çalıştırın.

    ```bash
    # 1. Tüm değiştirilen dosyaları takip listesine ekler.
    git add .
    
    # 2. Değişiklikleri anlamlı bir mesajla kaydeder.
    git commit -m "Yaptığınız değişikliğin kısa bir açıklaması"
    
    # 3. Kaydettiğiniz değişiklikleri GitHub'a gönderir.
    git push origin main
    ```

2.  **Otomatik Güncellemeyi Doğrulama:** Bu komutları çalıştırdıktan hemen sonra Vercel, GitHub'daki güncellemeyi otomatik olarak algılar. Projenizin Vercel kontrol paneline giderseniz, projenizin en üstünde **"Building" (İnşa Ediliyor)** durumunda yeni bir dağıtımın başladığını göreceksiniz. Bu sürecin yanında yazdığınız commit mesajını da ("Yaptığınız değişikliğin kısa bir açıklaması") görebilirsiniz. İşlem bitip **"Ready" (Hazır)** durumuna geçtiğinde, siteniz güncellenmiş demektir.

Artık kendi profesyonel teklif oluşturma aracınızı kullanmaya hazırsınız!
