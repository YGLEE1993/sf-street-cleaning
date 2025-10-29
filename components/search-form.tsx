"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CleaningResults } from "@/components/cleaning-results"

interface AddressSuggestion {
  full_address: string
  street_number: string
  street_name: string
  street_type: string
}

interface SearchFormProps {
  onResultsChange?: (hasResults: boolean) => void
  onReset?: boolean
  onResetComplete?: () => void
}

export function SearchForm({
  onResultsChange,
  onReset,
  onResetComplete,
}: SearchFormProps) {
  const [address, setAddress] = useState("")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [hasEverHadResults, setHasEverHadResults] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Cache functions
  const getCachedResult = (address: string) => {
    try {
      const cached = localStorage.getItem(
        `sf-street-cleaning-${address.toLowerCase()}`
      )
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        // Cache valid for 1 hour (3600000 ms)
        if (Date.now() - timestamp < 3600000) {
          return data
        }
      }
    } catch (error) {
      console.warn("Failed to read cache:", error)
    }
    return null
  }

  const setCachedResult = (address: string, data: any) => {
    try {
      localStorage.setItem(
        `sf-street-cleaning-${address.toLowerCase()}`,
        JSON.stringify({ data, timestamp: Date.now() })
      )
    } catch (error) {
      console.warn("Failed to cache result:", error)
    }
  }

  useEffect(() => {
    if (onReset) {
      setAddress("")
      setResults(null)
      setError(null)
      setSuggestions([])
      setShowSuggestions(false)
      setFocusedIndex(-1)
      setHasEverHadResults(false)
      onResultsChange?.(false)
      onResetComplete?.()
    }
  }, [onReset, onResultsChange, onResetComplete])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (address.length < 3) {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch(
          `https://data.sfgov.org/resource/3mea-di5p.json?$limit=8&$q=${encodeURIComponent(
            address
          )}`
        )
        const data = await response.json()
        if (!Array.isArray(data)) {
          setSuggestions([])
          return
        }
        const formatted = data
          .map((item: any) => ({
            full_address: `${item.address_number || ""} ${
              item.street_name || ""
            } ${item.street_type || ""}`.trim(),
            street_number: item.address_number || "",
            street_name: item.street_name || "",
            street_type: item.street_type || "",
          }))
          .filter((item: AddressSuggestion) => item.full_address)
        setSuggestions(formatted)
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [address])

  // Hide suggestions when loading starts
  useEffect(() => {
    if (loading) {
      setShowSuggestions(false)
      setSuggestions([])
      setFocusedIndex(-1)
    }
  }, [loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    // Check cache first
    const cachedResult = getCachedResult(address.trim())
    if (cachedResult) {
      // Show brief loading state for cached results
      setLoading(true)
      setShowSuggestions(false)
      setSuggestions([])
      setFocusedIndex(-1)

      // Brief delay to show loading state, then show cached result
      setTimeout(() => {
        setResults(cachedResult)
        setHasEverHadResults(true)
        setLoading(false)

        // Prevent auto-scroll when results load
        window.scrollTo(0, 0)

        if (!hasEverHadResults) {
          onResultsChange?.(true)
        }
      }, 300) // 300ms loading state
      return
    }

    setIsSearching(true)
    setShowSuggestions(false)
    setSuggestions([])
    setFocusedIndex(-1)
    setLoading(true)
    setError(null)
    setResults(null)

    // Only move logo to top if this is the first search
    if (!hasEverHadResults) {
      onResultsChange?.(true)
    }

    try {
      const response = await fetch(
        `/api/street-cleaning?address=${encodeURIComponent(address)}`
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to fetch")

      // Cache the result
      setCachedResult(address.trim(), data)

      setResults(data)
      setHasEverHadResults(true)

      // Prevent auto-scroll when results load
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const handleSelectSuggestion = (
    suggestion: AddressSuggestion,
    shouldSearch = false
  ) => {
    setAddress(suggestion.full_address)
    setShowSuggestions(false)
    setSuggestions([])
    setFocusedIndex(-1)

    if (shouldSearch) {
      // Check cache first
      const cachedResult = getCachedResult(suggestion.full_address)
      if (cachedResult) {
        // Show brief loading state for cached results
        setLoading(true)

        // Brief delay to show loading state, then show cached result
        setTimeout(() => {
          setResults(cachedResult)
          setHasEverHadResults(true)
          setLoading(false)
          if (!hasEverHadResults) {
            onResultsChange?.(true)
          }
        }, 300) // 300ms loading state
        return
      }

      // Trigger search automatically
      setIsSearching(true)
      setLoading(true)
      setError(null)
      setResults(null)

      // Only move logo to top if this is the first search
      if (!hasEverHadResults) {
        onResultsChange?.(true)
      }

      fetch(
        `/api/street-cleaning?address=${encodeURIComponent(
          suggestion.full_address
        )}`
      )
        .then(response => {
          if (!response.ok) throw new Error("Failed to fetch")
          return response.json()
        })
        .then(data => {
          // Cache the result
          setCachedResult(suggestion.full_address, data)

          setResults(data)
          setHasEverHadResults(true)
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : "An error occurred")
        })
        .finally(() => {
          setLoading(false)
          setIsSearching(false)
        })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[focusedIndex], true)
        } else {
          handleSubmit(e as any)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setFocusedIndex(-1)
        break
    }
  }

  return (
    <div className="space-y-8">
      <div ref={wrapperRef}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter your address"
              value={address}
              onChange={e => {
                setAddress(e.target.value)
                // Clear results when user starts typing a new address
                if (results) {
                  setResults(null)
                  // Don't reset logo position - keep user in results view
                }
              }}
              onFocus={() => {
                if (!loading && suggestions.length > 0 && !results) {
                  setShowSuggestions(true)
                }
              }}
              onKeyDown={handleKeyDown}
              className={`${
                results ? "h-10" : "h-14"
              } pl-6 pr-32 text-base rounded-xl bg-card shadow-sm border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus:outline-none focus:ring-0 focus:border-primary/50 transition-all duration-300`}
              style={{
                WebkitAppearance: "none",
                WebkitTapHighlightColor: "transparent",
                outline: "none",
              }}
              autoComplete="off"
            />
            <Button
              type={results ? "button" : "submit"}
              disabled={loading || (!address.trim() && !results)}
              onClick={
                results
                  ? () => {
                      setAddress("")
                      setResults(null)
                      setError(null)
                      // Focus the input after clearing
                      setTimeout(() => {
                        if (inputRef.current) {
                          inputRef.current.focus()
                          // Force keyboard to show on mobile
                          inputRef.current.click()
                        }
                      }, 200)
                    }
                  : undefined
              }
              className={`absolute right-2 ${
                results ? "top-1 h-8" : "top-2 h-10"
              } px-6 rounded-lg transition-all duration-300 cursor-pointer`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : results ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>

            {showSuggestions &&
              suggestions.length > 0 &&
              !loading &&
              !results && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 backdrop-blur-xl">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion, true)}
                      className={`w-full px-6 py-3 text-left transition-all duration-200 text-sm border-b border-gray-100 last:border-b-0 ${
                        focusedIndex === index
                          ? "bg-blue-100 text-blue-900"
                          : "hover:bg-blue-50 active:bg-blue-100"
                      }`}
                      onMouseEnter={() => setFocusedIndex(index)}
                      onMouseLeave={() => setFocusedIndex(-1)}
                    >
                      <div className="font-semibold">
                        {suggestion.full_address}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        San Francisco, CA
                      </div>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-2xl p-6 bg-red-50 border border-red-200">
          <p className="text-red-600 font-medium text-center">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="relative w-8 h-8">
            <div className="absolute top-0 left-0 w-full h-full border-2 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      )}

      {results && !loading && (
        <CleaningResults data={results} address={results.address || address} />
      )}
    </div>
  )
}
