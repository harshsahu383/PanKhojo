import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import CashfreeReturn from "./CashfreeReturn.jsx";
import {
    AboutPage, ContactPage, HowItWorksPage, NotFoundPage, PanGuidePage,
    PrivacyPage, RefundPage, TermsPage
} from "./InfoPages.jsx";

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const pages = {
    "/how-pankhojo-works": HowItWorksPage,
    "/pan-number-guide": PanGuidePage,
    "/about-us": AboutPage,
    "/contact-us": ContactPage,
    "/privacy-policy": PrivacyPage,
    "/terms-and-conditions": TermsPage,
    "/refund-policy": RefundPage,
};

let Root = App;
if (path.startsWith("/admin")) Root = AdminDashboard;
else if (path === "/payment-return") Root = CashfreeReturn;
else if (pages[path]) Root = pages[path];
else if (path !== "/") Root = NotFoundPage;

const prerenderedPaths = new Set(["/", ...Object.keys(pages)]);
const appTree = <StrictMode><Root /></StrictMode>;

if (prerenderedPaths.has(path) && !path.startsWith("/admin")) {
    hydrateRoot(document.getElementById("root"), appTree);
} else {
    createRoot(document.getElementById("root")).render(appTree);
}
