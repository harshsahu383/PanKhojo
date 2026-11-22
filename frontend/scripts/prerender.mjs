import { createServer } from "vite";
import React from "react";
import { renderToString } from "react-dom/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dist = path.join(root, "dist");
const site = "https://pankhojo.in";

const routes = [
  {
    path: "/",
    title: "Find Your Forgotten PAN Number Using Aadhaar | PANKhojo",
    description: "Forgot your PAN? Request help locating your existing PAN using your Aadhaar number. PANKhojo is a private service; no Aadhaar photo or document is needed.",
    type: "home",
  },
  {
    path: "/how-pankhojo-works",
    title: "How PANKhojo Works | Existing PAN Finding Assistance",
    description: "Understand PANKhojo's independent private process for people trying to locate their own existing PAN number, including eligibility, review and updates.",
  },
  {
    path: "/pan-number-guide",
    title: "PAN Number Knowledge Centre | PANKhojo",
    description: "Learn what to do if you have forgotten your PAN number, how to use official Income Tax Department options and how to avoid unsafe requests.",
  },
  {
    path: "/about-us",
    title: "About PANKhojo | Independent Existing PAN Assistance",
    description: "Learn about PANKhojo, an independent private assistance service for people seeking to locate their own existing PAN number.",
  },
  {
    path: "/contact-us",
    title: "Contact PANKhojo | Customer Support",
    description: "Contact PANKhojo for questions about the service, requests, payments, cancellations or privacy.",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | PANKhojo",
    description: "Read how PANKhojo approaches personal information, request handling, privacy, security and customer choices.",
  },
  {
    path: "/terms-and-conditions",
    title: "Terms and Conditions | PANKhojo",
    description: "Read the terms governing PANKhojo's independent private existing PAN assistance service.",
  },
  {
    path: "/refund-policy",
    title: "Refund and Cancellation Policy | PANKhojo",
    description: "Read PANKhojo's refund, cancellation and payment issue handling information before submitting a request.",
  },
];

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function setMeta(html, selector, replacement) {
  const pattern = new RegExp(`<meta\\s+[^>]*${selector}[^>]*>`, "i");
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace("</head>", `  ${replacement}\n</head>`);
}

function makeHead(html, route) {
  const url = `${site}${route.path}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = setMeta(html, "name=[\"\']description[\"\']", `<meta name="description" content="${description}">`);
  html = setMeta(html, "name=[\"\']robots[\"\']", '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">');
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${url}">`);
  html = setMeta(html, "property=[\"\']og:title[\"\']", `<meta property="og:title" content="${title}">`);
  html = setMeta(html, "property=[\"\']og:description[\"\']", `<meta property="og:description" content="${description}">`);
  html = setMeta(html, "property=[\"\']og:url[\"\']", `<meta property="og:url" content="${url}">`);
  html = setMeta(html, "property=[\"\']og:type[\"\']", '<meta property="og:type" content="website">');
  html = setMeta(html, "name=[\"\']twitter:title[\"\']", `<meta name="twitter:title" content="${title}">`);
  html = setMeta(html, "name=[\"\']twitter:description[\"\']", `<meta name="twitter:description" content="${description}">`);
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: route.title,
    description: route.description,
    isPartOf: { "@id": `${site}/#website` },
    inLanguage: "en-IN",
  };
  const schemaTag = `<script type="application/ld+json" data-page-schema>${JSON.stringify(schema)}</script>`;
  html = html.replace(/<script[^>]*data-page-schema[^>]*>[\s\S]*?<\/script>/i, "");
  html = html.replace("</head>", `  ${schemaTag}\n</head>`);
  return html;
}

const vite = await createServer({
  configFile: path.join(root, "vite.config.js"),
  root,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const { renderRoute } = await vite.ssrLoadModule("/src/ssr.jsx");
  const template = await readFile(path.join(dist, "index.html"), "utf8");

  for (const route of routes) {
    const markup = renderToString(React.createElement(React.StrictMode, null, renderRoute(route.path)));
    let html = template.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${markup}</div>`);
    html = makeHead(html, route);
    const targetFile = route.path === "/" ? path.join(dist, "index.html") : path.join(dist, `${route.path.slice(1)}.html`);
    await writeFile(targetFile, html, "utf8");
    console.log(`Prerendered ${route.path}`);
  }
} finally {
  await vite.close();
}
