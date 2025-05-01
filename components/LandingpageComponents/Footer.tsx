import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  const footerLinks = [
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "FAQs", href: "/faqs" },
    { title: "Refund Policy", href: "legal/pricing-policy" },
    { title: "Privacy Policy", href: "/legal/privacy-policy" },
    { title: "Terms of Service", href: "/legal/terms-of-service" }
  ];
  
  const socialLinks = [
    { icon: <Instagram size={20} />, href: "https://instagram.com/pickcreator", label: "Instagram" },
    { icon: <Facebook size={20} />, href: "#facebook", label: "Facebook" },
    { icon: <Twitter size={20} />, href: "#twitter", label: "Twitter" }
  ];
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Logo and tagline */}
          <div className="md:col-span-5">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-pick-blue to-pick-purple bg-clip-text text-transparent">
                PickCreator
              </span>
            </div>
            
            <p className="mt-4 text-gray-600 max-w-md">
            Address:Sitamarhi, Bihar, India<br />
            Email: support@pickcreator.com<br />
            Phone: +91 xxxxxxxxxx
            </p>
            
            <div className="mt-8 flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ y: -3 }}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-pick-blue hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
          
          {/* Navigation and links */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <ul className="space-y-3">
                  {footerLinks.slice(0, 3).map((link, index) => (
                    <li key={index}>
                      <a href={link.href} className="text-gray-600 hover:text-pick-blue transition-colors">
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal</h3>
                <ul className="space-y-3">
                  {footerLinks.slice(3).map((link, index) => (
                    <li key={index}>
                      <Link href={link.href} className="text-gray-600 hover:text-pick-blue transition-colors">
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {year} PickCreator. All rights reserved.
          </p>
          
          <div className="mt-4 md:mt-0">
            <p className="text-gray-500 text-sm">
              Made with ❤️ for Indian creators and brands
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
