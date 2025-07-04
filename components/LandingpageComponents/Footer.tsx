import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Twitter, Sparkles, Mail, Phone, MapPin, Heart, ExternalLink } from 'lucide-react';
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
    { icon: <Instagram size={24} />, href: "https://instagram.com/pickcreator", label: "Instagram", color: "from-pink-500 to-purple-600" },
    { icon: <Facebook size={24} />, href: "#facebook", label: "Facebook", color: "from-blue-600 to-blue-700" },
    { icon: <Twitter size={24} />, href: "#twitter", label: "Twitter", color: "from-blue-400 to-blue-500" }
  ];

  const quickStats = [
    { number: "2000+", label: "Active Creators" },
    { number: "300+", label: "Partner Brands" },
    { number: "₹50L+", label: "Paid to Creators" }
  ];

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-900 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container-custom py-20 relative z-10">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-3 gap-8 mb-16 text-center"
        >
          {quickStats.map((stat, index) => (
            <div key={index} className="group">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-400 font-medium group-hover:text-white transition-colors duration-300">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Logo and tagline */}
          <div className="md:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center mb-6"
            >
              <div className="relative mr-3">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg blur opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                PickCreator
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-gray-300 max-w-md mb-8 leading-relaxed"
            >
              Connecting brands with authentic creators to build meaningful partnerships that drive real results.
            </motion.p>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-3 mb-8"
            >
              <div className="flex items-center text-gray-300">
                <MapPin size={18} className="mr-3 text-violet-400" />
                <span>Sitamarhi, Bihar, India</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Mail size={18} className="mr-3 text-violet-400" />
                <span>support@pickcreator.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone size={18} className="mr-3 text-violet-400" />
                <span>+91 xxxxxxxxxx</span>
              </div>
            </motion.div>

            {/* Enhanced Social Links */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex space-x-4"
            >
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${social.color} flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 group`}
                  aria-label={social.label}
                >
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {social.icon}
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>

          {/* Navigation and links */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full mr-3" />
                  Quick Links
                </h3>
                <ul className="space-y-4">
                  {footerLinks.slice(0, 3).map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
                      >
                        <ExternalLink size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="group-hover:translate-x-1 transition-transform duration-300">{link.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3" />
                  Legal
                </h3>
                <ul className="space-y-4">
                  {footerLinks.slice(3).map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
                      >
                        <ExternalLink size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="group-hover:translate-x-1 transition-transform duration-300">{link.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="sm:col-span-2 lg:col-span-1"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-3" />
                  Newsletter
                </h3>
                <p className="text-gray-300 mb-4 text-sm">
                  Stay updated with the latest features and creator opportunities.
                </p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-l-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-r-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-300 font-semibold">
                    Subscribe
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-white/10 pt-8 mt-16"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm font-medium">
              © {year} PickCreator. All rights reserved.
            </p>
            <div className="flex items-center mt-4 md:mt-0">
              <p className="text-gray-400 text-sm font-medium flex items-center">
                Made with
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  className="mx-2"
                >
                  <Heart size={16} className="text-red-500 fill-current" />
                </motion.span>
                in India
              </p>
            </div>
          </div>

          {/* Additional branding */}
          <div className="text-center mt-6 pt-6 border-t border-white/5">
            <p className="text-gray-500 text-xs">
              Empowering creators and brands to build authentic connections
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
