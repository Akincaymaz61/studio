# TeklifAI - Yapay Zeka Destekli Fiyat Teklifi Oluşturucu

Bu proje, [Firebase Studio](https://studio.firebase.google.com/) ortamında geliştirilmiş, Next.js tabanlı modern bir web uygulamasıdır. Tekliflerinizi kolayca oluşturmanıza, yönetmenize ve müşterilerinize göndermenize olanak tanır.

Uygulamanın verileri, projenizi yayınladığınızda **Vercel'in kendi KV (Key-Value) veritabanında** kalıcı olarak saklanır. Harici bir veritabanı servisine ihtiyacınız yoktur.

## Projeyi İndirme ve Kendi Sitenizde Yayınlama

Bu uygulamayı kendi hosting platformunuzda yayınlayarak `teklif.siteniz.com` gibi bir adres üzerinden kullanabilirsiniz. Süreç oldukça basittir ve en kolay yöntem Vercel kullanmaktır.

### Gereksinimler
- [Node.js](https://nodejs.org/en) (v20 veya üstü)
- [Git](https://git-scm.com/)
- [GitHub Hesabı](https://github.com/) (Ücretsiz)
- [Vercel Hesabı](https://vercel.com/) (Ücretsiz, GitHub ile bağlanılır)

### Adım 1: Proje Dosyalarını İndirin

Projenin sadece kaynak kodunu indirmeniz yeterlidir. `node_modules` ve `.next` gibi klasörler **hariç** diğer tüm dosyaları bilgisayarınıza indirin.

### Adım 2: Gerekli Kütüphaneleri Yükleyin

Proje klasörünü bilgisayarınızda bir terminal veya komut istemi ile açın ve aşağıdaki komutu çalıştırın. Bu komut, `package.json` dosyasını okuyarak uygulamanın çalışması için gereken tüm kütüphaneleri (`node_modules` klasörünü) otomatik olarak internetten indirecektir.

```bash
npm install
```

### Adım 3: Projeyi GitHub'a Yükleme

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

### Adım 4: Projeyi Vercel'de Yayınlama ve Veritabanını Bağlama

1.  **Vercel'e Kaydolun:** [vercel.com](https://vercel.com) adresine gidin ve GitHub hesabınızla giriş yapın.
2.  **Vercel'de Yeni Proje Oluşturun:**
    *   Vercel dashboard'unda "Add New... -> Project" seçeneğine tıklayın.
    *   Bir önceki adımda oluşturduğunuz GitHub deposunu seçin ve "Import" deyin.
3.  **Deploy Edin:** Herhangi bir ayar yapmanıza gerek yok. "Deploy" butonuna tıklayın. Vercel projenizi yayınlayacak ve size bir `.vercel.app` adresi verecektir.
4.  **Veritabanını Bağlayın (En Önemli Adım):**
    *   Projeniz Vercel'de yayınlandıktan sonra, proje sayfanızın üst menüsündeki **"Storage"** sekmesine tıklayın.
    *   Açılan ekranda **"KV (Key-Value)"** seçeneğini bulun ve yanındaki **"Connect"** butonuna basın.
    *   Projenizi seçip tekrar **"Connect"** dediğinizde, Vercel gerekli tüm bağlantı ayarlarını sizin için otomatik olarak yapacaktır. **Başka hiçbir ayar yapmanıza gerek yoktur.** Veritabanınız artık projenize bağlıdır.

### Adım 5: Kendi Alan Adınızı Bağlama (Opsiyonel)

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
