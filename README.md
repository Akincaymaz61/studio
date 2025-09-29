# TeklifAI - Yapay Zeka Destekli Fiyat Teklifi Oluşturucu

Bu proje, [Firebase Studio](https://studio.firebase.google.com/) ortamında geliştirilmiş, Next.js tabanlı modern bir web uygulamasıdır. Tekliflerinizi kolayca oluşturmanıza, yönetmenize ve müşterilerinize göndermenize olanak tanır.

## Projeyi İndirme ve Kendi Sitenizde Yayınlama

Bu uygulamayı kendi hosting platformunuzda yayınlayarak `teklif.siteniz.com` gibi bir adres üzerinden kullanabilirsiniz. Gördüğünüz on binlerce dosyayı indirmenize gerek yoktur. Süreç oldukça basittir.

### Gereksinimler
- [Node.js](https://nodejs.org/en) (v20 veya üstü)
- [Git](https://git-scm.com/)

### Adım 1: Proje Dosyalarını İndirin

Projenin sadece kaynak kodunu indirmeniz yeterlidir. `node_modules` ve `.next` gibi klasörler **hariç** diğer tüm dosyaları bilgisayarınıza indirin.

### Adım 2: Gerekli Kütüphaneleri Yükleyin

Proje klasörünü bilgisayarınızda bir terminal veya komut istemi ile açın ve aşağıdaki komutu çalıştırın. Bu komut, `package.json` dosyasını okuyarak uygulamanın çalışması için gereken tüm kütüphaneleri (`node_modules` klasörünü) otomatik olarak internetten indirecektir.

```bash
npm install
```

### Adım 3: Projeyi GitHub'a Yükleme (Opsiyonel ama Tavsiye Edilir)

Uygulamanızı Vercel gibi platformlarda yayınlamanın en kolay yolu, projenizi bir GitHub deposuna yüklemektir. Bu, hem kodlarınızın bir yedeğini tutmanızı sağlar hem de yayınlama sürecini otomatikleştirir.

1.  **GitHub'da Yeni Depo Oluşturun:**
    *   [GitHub.com](https://github.com) adresine gidin ve hesabınıza giriş yapın.
    *   Sağ üst köşedeki "+" simgesine tıklayıp "New repository" seçeneğini seçin.
    *   Deponuza bir isim verin (örneğin, `teklif-ai-uygulamam`).
    *   Deponun "Public" (Herkese Açık) veya "Private" (Özel) olmasını seçin. Kodunuzu başkalarının görmesini istemiyorsanız "Private" seçebilirsiniz.
    *   "Create repository" butonuna tıklayın.

2.  **Projeyi Yerel Bilgisayarınızdan GitHub'a Gönderin:**
    *   Bilgisayarınızda projenin bulunduğu klasörü terminalde açın.
    *   Aşağıdaki komutları sırasıyla çalıştırın. GitHub'ın size verdiği depo URL'sini (`https://github.com/kullanici-adiniz/depo-adiniz.git`) kendi URL'niz ile değiştirmeyi unutmayın.

    ```bash
    # 1. Proje klasöründe yeni bir Git deposu başlatır.
    git init
    
    # 2. Tüm proje dosyalarını takip listesine ekler.
    git add .
    
    # 3. Dosyaların ilk versiyonunu "İlk versiyon" mesajıyla kaydeder.
    git commit -m "İlk versiyon"
    
    # 4. Ana dalın adını "main" olarak belirler.
    git branch -M main
    
    # 5. Yerel deponuzu GitHub'daki uzak depoya bağlar. (URL'yi değiştirin!)
    git remote add origin https://github.com/kullanici-adiniz/depo-adiniz.git
    
    # 6. Kaydettiğiniz dosyaları GitHub'a gönderir.
    git push -u origin main
    ```

Bu komutlardan sonra proje dosyalarınız GitHub deponuza yüklenmiş olacaktır.

### Adım 4: Yerel Bilgisayarda Çalıştırma (Opsiyonel)

Uygulamayı hosting'e yüklemeden önce kendi bilgisayarınızda test etmek için aşağıdaki komutu kullanabilirsiniz:

```bash
npm run dev
```

Bu komut, uygulamayı `http://localhost:9002` adresinde çalıştıracaktır. Tarayıcınızda bu adrese giderek uygulamayı görüntüleyebilirsiniz.

### Adım 5: Projeyi Yayınlama (Deployment)

Uygulamayı web'de yayınlamak için Vercel veya Netlify gibi modern hosting platformlarını kullanmanızı şiddetle tavsiye ederiz. Bu platformlar, Next.js projelerini yayınlamak için özel olarak tasarlanmıştır ve süreci inanılmaz derecede basitleştirir.

**Örnek: Vercel ile Yayınlama**

1.  **Vercel'e Kaydolun:** [vercel.com](https://vercel.com) adresine gidin ve bir hesap oluşturun (GitHub hesabınızla giriş yapabilirsiniz).
2.  **Vercel'de Yeni Proje Oluşturun:**
    *   Vercel dashboard'unda "Add New... -> Project" seçeneğine tıklayın.
    *   GitHub hesabınızı bağlayın ve projenizin bulunduğu depoyu (bir önceki adımda oluşturduğunuz) seçin.
    *   Vercel, projenizin bir Next.js uygulaması olduğunu otomatik olarak algılayacaktır. Herhangi bir ayar değiştirmenize gerek yoktur.
3.  **Deploy Edin:** "Deploy" butonuna tıklayın.

Vercel, projenizi otomatik olarak kuracak (`npm install`), yayına hazırlayacak (`npm run build`) ve size özel bir `.vercel.app` adresi üzerinden yayınlayacaktır.

#### Kendi Alan Adınızı Bağlama

Vercel'in size verdiği adresi kendi alan adınıza (örneğin, `teklif.siteniz.com`) kolayca bağlayabilirsiniz.

1.  **Vercel Proje Ayarları:** Vercel'deki proje sayfanızda "Settings" sekmesine ve ardından "Domains" menüsüne gidin.
2.  **Alan Adı Ekleme:** Kullanmak istediğiniz alan adını (örneğin, `teklif.siteniz.com`) girin ve "Add" butonuna tıklayın.
3.  **DNS Kayıtlarını Alın:** Vercel size bir CNAME veya A kaydı gibi bir DNS kaydı verecektir. Bu, Vercel sunucularını işaret eden bir adrestir.
4.  **DNS Yönetimi:** Alan adınızı satın aldığınız firmanın (GoDaddy, Namecheap, Turhost vb.) web sitesine gidin. Alan adı yönetim panelinizde "DNS Yönetimi", "DNS Zone" veya benzeri bir bölüm bulun.
5.  **Kaydı Ekleyin:** Vercel'in size verdiği kaydı, alan adı sağlayıcınızın DNS yönetimi bölümüne ekleyin.
6.  **Bekleyin:** DNS kayıtlarının internete yayılması birkaç dakikadan birkaç saate kadar sürebilir. Vercel, bağlantı kurulduğunda sizi bilgilendirecektir.

Artık kendi profesyonel teklif oluşturma aracınızı kullanmaya hazırsınız!
