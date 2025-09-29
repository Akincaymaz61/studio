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

### Adım 3: Yerel Bilgisayarda Çalıştırma (Opsiyonel)

Uygulamayı hosting'e yüklemeden önce kendi bilgisayarınızda test etmek için aşağıdaki komutu kullanabilirsiniz:

```bash
npm run dev
```

Bu komut, uygulamayı `http://localhost:9002` adresinde çalıştıracaktır. Tarayıcınızda bu adrese giderek uygulamayı görüntüleyebilirsiniz.

### Adım 4: Projeyi Yayınlama (Deployment)

Uygulamayı web'de yayınlamak için Vercel veya Netlify gibi modern hosting platformlarını kullanmanızı şiddetle tavsiye ederiz. Bu platformlar, Next.js projelerini yayınlamak için özel olarak tasarlanmıştır ve süreci inanılmaz derecede basitleştirir.

**Örnek: Vercel ile Yayınlama**

1.  **Vercel'e Kaydolun:** [vercel.com](https://vercel.com) adresine gidin ve bir hesap oluşturun (GitHub hesabınızla giriş yapabilirsiniz).
2.  **Projenizi GitHub'a Yükleyin:** Proje dosyalarınızı bir GitHub deposuna yükleyin.
3.  **Vercel'de Yeni Proje Oluşturun:**
    *   Vercel dashboard'unda "Add New... -> Project" seçeneğine tıklayın.
    *   GitHub hesabınızı bağlayın ve projenizin bulunduğu depoyu seçin.
    *   Vercel, projenizin bir Next.js uygulaması olduğunu otomatik olarak algılayacaktır. Herhangi bir ayar değiştirmenize gerek yoktur.
4.  **Deploy Edin:** "Deploy" butonuna tıklayın.

Hepsi bu kadar! Vercel, projenizi otomatik olarak kuracak (`npm install`), yayına hazırlayacak (`npm run build`) ve size özel bir `.vercel.app` adresi üzerinden yayınlayacaktır. Daha sonra bu adresi kendi alan adınıza (örneğin, `teklif.siteniz.com`) kolayca bağlayabilirsiniz.

Artık kendi profesyonel teklif oluşturma aracınızı kullanmaya hazırsınız!
