"use client"

import { useState, useEffect } from "react"
import { Info, X } from "lucide-react"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": any
    }
  }
}

export function InfoModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load Spline viewer script
    const script = document.createElement("script")
    script.type = "module"
    script.src =
      "https://unpkg.com/@splinetool/viewer@1.10.89/build/spline-viewer.js"
    document.body.appendChild(script)

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <>
      {/* Info Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-8 h-8 bg-gray-400/10 hover:bg-gray-400/20 backdrop-blur-sm rounded-full border border-gray-300/20 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
        aria-label="Information"
      >
        <Info className="w-4 h-4 text-gray-500" />
      </button>

      {/* Slide-up Page */}
      {isOpen && (
        <>
          <style jsx global>{`
            .leaflet-container {
              z-index: 1 !important;
            }
            .leaflet-control-container {
              z-index: 1 !important;
            }
          `}</style>
          <div
            className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Content */}
              <div className="flex flex-col h-full">
                {/* Spline Embed */}
                <div className="w-full h-48 relative bg-white">
                  <div className="absolute inset-0">
                    {/* @ts-ignore */}
                    <spline-viewer url="https://prod.spline.design/l0XiYvDHRB4L6fdC/scene.splinecode"></spline-viewer>
                  </div>
                </div>

                {/* Text Info */}
                <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
                  <div className="space-y-4 text-center">
                    <h2 className="text-m font-bold text-gray-900">
                      About This App
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      This app uses data from DataSF to help make finding and
                      understanding San Francisco parking rules a little easier.
                      While it’s a helpful reference, please always double-check
                      official street signs and SF government data for the most
                      accurate, up-to-date information.
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      P.S. Made for my wife, Bobo — and here’s hoping one day
                      San Francisco will have more public parking available for
                      all of us.
                    </p>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Data provided by{" "}
                        <a
                          href="https://data.sfgov.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline font-medium"
                        >
                          DataSF
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
