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
    title: "Forgot Your PAN Number? Find Your Existing PAN | PANKhojo",
    description: "Forgot your PAN number? Learn how to locate your existing PAN and explore PANKhojo’s independent private assistance process. Aadhaar number only where required; no Aadhaar photo or document.",
    type: "home",
  },
  {
    path: "/how-pankhojo-works",
    title: "How PANKhojo Works | PAN Finding Process",
    description: "See how PANKhojo’s independent private PAN-finding assistance works, who it is for, what information may be requested and what to expect after submitting a request.",
  },
  {
    path: "/pan-number-guide",
    title: "Forgot Your PAN Number? Official Ways to Find It | PANKhojo",
    description: "Forgot or misplaced your PAN? Learn the official ways to check your existing PAN, understand safe recovery options and avoid applying for a duplicate PAN.",
  },
  {
    path: "/about-us",
    title: "About PANKhojo | Independent PAN Finding Assistance",
    description: "Learn about PANKhojo, an independent private service helping people understand options for locating their own existing PAN number.",
  },
  {
    path: "/contact-us",
    title: "Contact PANKhojo | PAN Request and Payment Support",
    description: "Contact PANKhojo for help with an existing PAN-finding request, payment, delivery, cancellation or privacy question.",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | PANKhojo",
    description: "Read PANKhojo’s privacy information about personal data, Aadhaar number handling where required, request processing, security and customer choices.",
  },
  {
    path: "/terms-and-conditions",
    title: "Terms and Conditions | PANKhojo",
    description: "Review the terms, eligibility, limitations and conditions for using PANKhojo’s independent private existing PAN-finding assistance service.",
  },
  {
    path: "/refund-policy",
    title: "Cancellation and Refund Policy | PANKhojo",
    description: "Understand PANKhojo’s cancellation, payment issue and refund process before submitting an existing PAN-finding request.",
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
  const canonicalTag = `<link rel="canonical" href="${url}">`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace("</head>", `  ${canonicalTag}\n</head>`);
  }
  html = setMeta(html, "property=[\"\']og:title[\"\']", `<meta property="og:title" content="${title}">`);
  html = setMeta(html, "property=[\"\']og:description[\"\']", `<meta property="og:description" content="${description}">`);
  html = setMeta(html, "property=[\"\']og:url[\"\']", `<meta property="og:url" content="${url}">`);
  html = setMeta(html, "property=[\"\']og:type[\"\']", '<meta property="og:type" content="website">');
  html = setMeta(html, "name=[\"\']twitter:title[\"\']", `<meta name="twitter:title" content="${title}">`);
  html = setMeta(html, "name=[\"\']twitter:description[\"\']", `<meta name="twitter:description" content="${description}">`);
  const schemaGraph = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: route.title,
      description: route.description,
      isPartOf: { "@id": `${site}/#website` },
      inLanguage: "en-IN",
      ...(route.path !== "/" ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    },
  ];
  if (route.path !== "/") {
    const pageName = route.title.split("|")[0].trim();
    schemaGraph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${site}/` },
        { "@type": "ListItem", position: 2, name: pageName, item: url },
      ],
    });
  }
  const schema = { "@context": "https://schema.org", "@graph": schemaGraph };
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
