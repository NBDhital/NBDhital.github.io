// Google Analytics
const GA_ID = "G-4MXGH93NDS";

const gaScript = document.createElement("script");
gaScript.async = true;
gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
document.head.appendChild(gaScript);

window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

gtag("js", new Date());
gtag("config", GA_ID);