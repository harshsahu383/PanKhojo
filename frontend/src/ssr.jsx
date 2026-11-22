import React from "react";
import App from "./App.jsx";
import {
  AboutPage,
  ContactPage,
  HowItWorksPage,
  NotFoundPage,
  PanGuidePage,
  PrivacyPage,
  RefundPage,
  TermsPage,
} from "./InfoPages.jsx";

const pages = {
  "/how-pankhojo-works": HowItWorksPage,
  "/pan-number-guide": PanGuidePage,
  "/about-us": AboutPage,
  "/contact-us": ContactPage,
  "/privacy-policy": PrivacyPage,
  "/terms-and-conditions": TermsPage,
  "/refund-policy": RefundPage,
};

export function renderRoute(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return React.createElement(App);
  const Page = pages[path] || NotFoundPage;
  return React.createElement(Page);
}
