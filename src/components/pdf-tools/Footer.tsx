'use client'

export function Footer() {
  return (
    <footer className="bg-blue-900 text-blue-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-700 font-bold text-lg">Y</span>
              </div>
              <span className="text-lg font-bold text-white">YadavjiPDF</span>
            </div>
            <p className="text-sm text-blue-300 leading-relaxed">
              Made in India 🇮🇳 — Your trusted online PDF toolkit. 
              All processing happens on Indian servers with complete data privacy.
            </p>
            <div className="mt-3 pt-3 border-t border-blue-800">
              <p className="text-xs text-blue-400">Developed & Designed by</p>
              <p className="text-sm font-semibold text-white">Brijesh Yadav</p>
              <p className="text-xs text-blue-400">Idea & Concept by Brijesh Yadav</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">PDF Tools</h3>
            <ul className="space-y-1.5 text-sm text-blue-300">
              <li>Merge PDF</li>
              <li>Split PDF</li>
              <li>Compress PDF</li>
              <li>Image to PDF</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Convert</h3>
            <ul className="space-y-1.5 text-sm text-blue-300">
              <li>Word to PDF</li>
              <li>Excel to PDF</li>
              <li>PDF to Word</li>
              <li>PDF to Excel</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-6 text-center">
          <p className="text-sm text-blue-400">
            © {new Date().getFullYear()} YadavjiPDF — Made with ❤️ in India | Developed by Brijesh Yadav
          </p>
        </div>
      </div>
    </footer>
  )
}
