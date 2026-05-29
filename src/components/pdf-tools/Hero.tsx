'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Globe, FileText } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl relative">
              <span className="text-blue-700 font-bold text-3xl">Y</span>
              <FileText className="w-5 h-5 text-blue-400 absolute -bottom-1 -right-1" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight">
            YadavjiPDF
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-2 font-medium">
            Made in India 🇮🇳 | Merge, Split, Compress & Convert PDFs Online
          </p>
          <p className="text-sm text-blue-200 mb-8 max-w-2xl mx-auto">
            All your PDF operations in one place. Fast, secure, and free. 
            Your files never leave our Indian servers — privacy is our promise.
          </p>
          <p className="text-xs text-blue-300 font-medium">
            Developed & Idea by Brijesh Yadav
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {[
              { icon: Shield, text: '100% Secure' },
              { icon: Zap, text: 'Lightning Fast' },
              { icon: Globe, text: 'Indian Servers' },
              { icon: FileText, text: 'All Formats' },
            ].map((badge, i) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2 text-blue-100"
              >
                <badge.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80V30C240 60 480 0 720 30C960 60 1200 0 1440 30V80H0Z" fill="white" />
        </svg>
      </div>
    </section>
  )
}
