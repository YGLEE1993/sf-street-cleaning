"use client"

import { useState } from "react"
import { SearchForm } from "@/components/search-form"
import { InfoModal } from "@/components/info-modal"

export default function Home() {
  const [hasResults, setHasResults] = useState(false)
  const [resetSearch, setResetSearch] = useState(false)

  return (
    <main className="min-h-screen flex flex-col">
      <div
        className={`flex-1 flex flex-col items-center px-4 py-6 md:py-12 transition-all duration-500 ${
          hasResults ? "pt-24 md:pt-6 justify-start" : "justify-center"
        }`}
      >
        <div className="w-full max-w-2xl space-y-4 md:space-y-8">
          {/* Hero section with transition */}
          <div
            className={`text-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              hasResults
                ? "md:text-center md:space-y-4 md:space-y-6 fixed top-0 left-0 right-0 z-10 md:relative md:top-0 md:left-0 md:z-auto md:right-auto bg-white py-4 px-4"
                : "space-y-4 md:space-y-6"
            }`}
          >
            <div
              className={`flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                hasResults
                  ? "md:space-y-3 md:space-y-4 space-y-2 md:space-y-3 md:space-y-4"
                  : "space-y-3 md:space-y-4"
              }`}
            >
              <button
                onClick={() => {
                  setHasResults(false)
                  setResetSearch(true)
                }}
                className="transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <img
                  src="/sf.png"
                  alt="Street Cleaning"
                  className={`object-contain transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    hasResults
                      ? "w-[120px] h-auto md:w-48 md:w-80"
                      : "w-48 md:w-80"
                  }`}
                />
              </button>
            </div>
            <p
              className={`text-muted-foreground text-pretty transition-all duration-700 ease-in-out ${
                hasResults
                  ? "md:text-base md:text-lg md:px-2 text-[10px] px-1 md:px-2 leading-tight md:block hidden"
                  : "text-base md:text-lg px-2"
              }`}
            >
              Find out when your street is cleaned in San Francisco.
            </p>
          </div>

          <SearchForm
            onResultsChange={setHasResults}
            onReset={resetSearch}
            onResetComplete={() => setResetSearch(false)}
          />
        </div>
      </div>
      {/* 
      <footer className="py-1 md:py-6 px-4 text-center text-sm text-muted-foreground">
        <p>Data provided by DataSF</p>
      </footer> */}

      <InfoModal />
    </main>
  )
}
