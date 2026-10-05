import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PreviewBar from "@/components/site/PreviewBar";
import { getBarNotices } from "@/lib/public/notices";
import { getSettings } from "@/lib/settings";

/**
 * Public website chrome. Settings (contact details, social links, announcement,
 * analytics IDs) and pinned notices are read at build/revalidate time, so every
 * page stays static. The admin (/admin) has its own layout and never shows this.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, notices] = await Promise.all([getSettings(), getBarNotices().catch(() => [])]);
  const { gaId, gtmId } = settings.analytics;
  const safeId = (id: string) => /^[A-Z0-9-]{4,30}$/i.test(id);
  return (
    <>
      {gtmId && safeId(gtmId) && (
        <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</Script>
      )}
      {gaId && safeId(gaId) && !gtmId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}</Script>
        </>
      )}
      <Header announcement={settings.announcement} notices={notices} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <PreviewBar />
    </>
  );
}
