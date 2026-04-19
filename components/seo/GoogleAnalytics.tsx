import Script from 'next/script';

/**
 * Google Analytics 4 (gtag.js) loader.
 *
 * Set NEXT_PUBLIC_GA_ID in env (e.g. G-XXXXXXXXXX).
 * Scripts are loaded with strategy="afterInteractive" so they don't
 * block LCP/TBT and only run in production.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id || process.env.NODE_ENV !== 'production') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}