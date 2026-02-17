"use client";

import Link from "next/link";
import { Music, Mail, Twitter, Github, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Documentation", href: "#" },
    ],
    company: [
      { label: "À propos", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Carrières", href: "#" },
      { label: "Contact", href: "#" },
    ],
    legal: [
      { label: "Confidentialité", href: "#" },
      { label: "Conditions d'utilisation", href: "#" },
      { label: "Mentions légales", href: "#" },
      { label: "RGPD", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="section-container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Vibe Control</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
              La plateforme collaborative de gestion de playlist qui vous permet
              de garder le contrôle total de l'ambiance musicale.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Produit</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Entreprise</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Légal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} Vibe Control. Tous droits réservés.
            </p>

            <div className="flex gap-6 text-sm">
              <Link
                href="#"
                className="hover:text-primary-400 transition-colors duration-200"
              >
                Statut du service
              </Link>
              <Link
                href="#"
                className="hover:text-primary-400 transition-colors duration-200"
              >
                API
              </Link>
              <Link
                href="#"
                className="hover:text-primary-400 transition-colors duration-200"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
