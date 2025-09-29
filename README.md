# TeklifAI - Yapay Zeka Destekli Fiyat Teklifi Oluşturucu

Bu proje, [Firebase Studio](https://studio.firebase.google.com/) ortamında geliştirilmiş, Next.js tabanlı modern bir web uygulamasıdır. Tekliflerinizi kolayca oluşturmanıza, yönetmenize ve müşterilerinize göndermenize olanak tanır.

**ÖNEMLİ: Bu uygulamanın verilerini kalıcı olarak saklayabilmesi için ücretsiz bir [JSONBin.io](https://jsonbin.io/) hesabına ihtiyacı vardır.**

## Projeyi İndirme ve Kendi Sitenizde Yayınlama

Bu uygulamayı kendi hosting platformunuzda yayınlayarak `teklif.siteniz.com` gibi bir adres üzerinden kullanabilirsiniz. Süreç oldukça basittir.

### Gereksinimler
- [Node.js](https://nodejs.org/en) (v20 veya üstü)
- [Git](https://git-scm.com/)
- [GitHub Hesabı](https://github.com/) (Ücretsiz)
- [JSONBin.io Hesabı](https://jsonbin.io/) (Ücretsiz)

### Adım 1: Proje Dosyalarını İndirin

Projenin sadece kaynak kodunu indirmeniz yeterlidir. `node_modules` ve `.next` gibi klasörler **hariç** diğer tüm dosyaları bilgisayarınıza indirin.

### Adım 2: Gerekli Kütüphaneleri Yükleyin

Proje klasörünü bilgisayarınızda bir terminal veya komut istemi ile açın ve aşağıdaki komutu çalıştırın. Bu komut, `package.json` dosyasını okuyarak uygulamanın çalışması için gereken tüm kütüphaneleri (`node_modules` klasörünü) otomatik olarak internetten indirecektir.

```bash
npm install
```

### Adım 3: Veritabanını Ayarlama (JSONBin.io)

Uygulamanın kaydettiği tekliflerin ve müşteri bilgilerinin kalıcı olması için ücretsiz bir bulut veritabanı hizmeti olan JSONBin.io'yu kullanacağız.

1.  **JSONBin.io'ya Kaydolun:** [jsonbin.io](https://jsonbin.io/signup) adresine gidin ve ücretsiz bir hesap oluşturun.
2.  **API Anahtarı Alın:** Giriş yaptıktan sonra, sol menüden "API Keys" sayfasına gidin. Sağ üstteki "Create Key" butonuna tıklayın. Anahtarınıza bir isim verin (örn. "TeklifAI Anahtarım") ve anahtarı oluşturun. **Size verilen API anahtarını kopyalayıp güvenli bir yere not edin.**
3.  **Yeni bir "Bin" (Kutu) Oluşturun:** Sol menüden "Bins" sayfasına gidin. Sağ üstteki "Create Bin" butonuna tıklayın. Bin'inize bir isim verin (örn. "TeklifAI-DB") ve "Private" (Özel) olarak işaretlendiğinden emin olun. Ardından "Create Bin" butonuna basın.
4.  **Bin ID'sini Kopyalayın:** Oluşturulan Bin'in URL'sinden veya ayarlarından Bin ID'sini kopyalayın. ID, genellikle URL'nin sonundaki uzun karakter dizisidir (örneğin: `https://jsonbin.io/b/66fa1b2be402bf3e552...`).

### Adım 4: Proje Ayarlarını Yapılandırma

1.  **`.env` Dosyasını Düzenleyin:** Proje klasörünüzdeki `.env` dosyasını bir metin editörü ile açın. Bir önceki adımda aldığınız bilgileri aşağıdaki gibi doldurun:

    ```
    JSONBIN_API_KEY=buraya_kopyaladiginiz_api_anahtarini_yapistirin
    JSONBIN_BIN_ID=buraya_kopyaladiginiz_bin_id_sini_yapistirin
    ```

2.  **Değişiklikleri Kaydedin.**

### Adım 5: Projeyi GitHub'a Yükleme

Uygulamanızı Vercel gibi platformlarda yayınlamanın en kolay yolu, projenizi bir GitHub deposuna yüklemektir.

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

### Adım 6: Projeyi Vercel'de Yayınlama

1.  **Vercel'e Kaydolun:** [vercel.com](https://vercel.com) adresine gidin ve GitHub hesabınızla giriş yapın.
2.  **Vercel'de Yeni Proje Oluşturun:**
    *   Vercel dashboard'unda "Add New... -> Project" seçeneğine tıklayın.
    *   Projenizin bulunduğu GitHub deposunu seçin ve "Import" deyin.
3.  **Ortam Değişkenlerini Ayarlayın:** Bu en önemli adımdır. "Environment Variables" bölümünü açın ve `.env` dosyanıza girdiğiniz bilgileri buraya da ekleyin:
    *   **İsim:** `JSONBIN_API_KEY`, **Değer:** `buraya_api_anahtarinizi_yapistirin`
    *   **İsim:** `JSONBIN_BIN_ID`, **Değer:** `buraya_bin_id_nizi_yapistirin`
4.  **Deploy Edin:** "Deploy" butonuna tıklayın. Vercel projenizi yayınlayacak ve size bir `.vercel.app` adresi verecektir.

### Adım 7: Kendi Alan Adınızı Bağlama (Opsiyonel)

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

2.  **Otomatik Güncellemeyi Doğrulama:** Bu komutları çalıştırdıktan hemen sonra Vercel, GitHub'daki güncellemeyi otomatik olarak algılar. Projenizin Vercel kontrol paneline giderseniz, projenizin en üstünde "Building" (İnşa Ediliyor) durumunda yeni bir dağıtımın başladığını göreceksiniz. Bu sürecin yanında yazdığınız commit mesajını da ("Yaptığınız değişikliğin kısa bir açıklaması") görebilirsiniz. İşlem bitip "Ready" (Hazır) durumuna geçtiğinde, siteniz güncellenmiş demektir.

Artık kendi profesyonel teklif oluşturma aracınızı kullanmaya hazırsınız!
