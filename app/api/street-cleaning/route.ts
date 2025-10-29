import { type NextRequest, NextResponse } from "next/server"

type CleaningItem = {
  cnn?: string
  corridor?: string
  limits?: string
  cnnrightleft?: string // "L" or "R"
  blockside?: string
  fullname?: string
  weekday?: string
  fromhour?: string
  tohour?: string
  week1?: string
  week2?: string
  week3?: string
  week4?: string
  week5?: string
  line?: { type: string; coordinates: Array<[number, number]> }
  [k: string]: any
}

const weekdayMap: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
}

function formatHour(hour?: string): string {
  if (!hour) return "—"
  const h = parseInt(hour, 10)
  if (isNaN(h)) return hour
  const ampm = h >= 12 ? "PM" : "AM"
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display} ${ampm}`
}

function getSideFromCoordinates(
  line: Array<[number, number]>,
  lon: number,
  lat: number
): "left" | "right" | null {
  if (!line || line.length < 2) return null
  let best = { dist2: Infinity, segDx: 0, segDy: 0, closestX: 0, closestY: 0 }

  for (let i = 0; i < line.length - 1; i++) {
    const [ax, ay] = line[i]
    const [bx, by] = line[i + 1]
    const dx = bx - ax
    const dy = by - ay
    const px = lon - ax
    const py = lat - ay
    const segLen2 = dx * dx + dy * dy
    let t = segLen2 > 0 ? (px * dx + py * dy) / segLen2 : 0
    t = Math.max(0, Math.min(1, t))
    const cx = ax + dx * t
    const cy = ay + dy * t
    const vx = lon - cx
    const vy = lat - cy
    const d2 = vx * vx + vy * vy
    if (d2 < best.dist2)
      best = { dist2: d2, segDx: dx, segDy: dy, closestX: cx, closestY: cy }
  }

  const vx = lon - best.closestX
  const vy = lat - best.closestY
  const cross = best.segDx * vy - best.segDy * vx
  if (cross > 0) return "left"
  if (cross < 0) return "right"
  return null
}

function parseLimits(limitsStr?: string): {
  startStr: string
  endStr: string
  start: number
  end: number
  valid: boolean
} {
  if (!limitsStr)
    return { startStr: "", endStr: "", start: 0, end: 0, valid: false }

  const parts = limitsStr.split(" - ")
  if (parts.length !== 2)
    return { startStr: "", endStr: "", start: 0, end: 0, valid: false }

  const startStr = parts[0].trim()
  const endStr = parts[1].trim()

  const start = parseInt(startStr.replace(/\D/g, ""), 10)
  const end = parseInt(endStr.replace(/\D/g, ""), 10)

  // If we can parse numbers, use them; otherwise keep strings for cross-street matching
  const hasNumbers = !isNaN(start) && !isNaN(end)

  return {
    startStr,
    endStr,
    start,
    end,
    valid: hasNumbers || (!!startStr && !!endStr),
  }
}

function getBlockDistance(addrNum: number, start: number, end: number): number {
  const min = Math.min(start, end)
  const max = Math.max(start, end)

  if (addrNum >= min && addrNum <= max) return 0 // exact match
  if (addrNum < min) return min - addrNum // before block
  return addrNum - max // after block
}

async function lookupStreetLocation(
  streetName: string
): Promise<number | null> {
  try {
    // Look up a representative address on this cross street (e.g., "1 LARKIN ST")
    const queryUrl = `https://data.sfgov.org/resource/3mea-di5p.json?street_name=${encodeURIComponent(
      streetName.toUpperCase()
    )}&$limit=1`
    const resp = await fetch(queryUrl)
    if (resp.ok) {
      const data = await resp.json()
      if (data && data.length > 0) {
        // Use the first address number we find as a reference
        return parseInt(data[0].address_number, 10)
      }
    }
  } catch (err) {
    console.error("Error looking up street:", err)
  }
  return null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")
  if (!address)
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    )

  try {
    console.log("[v0] Looking up address:", address)
    const addrUrl = `https://data.sfgov.org/resource/3mea-di5p.json?$q=${encodeURIComponent(
      address
    )}&$limit=1`
    const addrResp = await fetch(addrUrl)
    if (!addrResp.ok) throw new Error("Failed to lookup address")
    const addrData = await addrResp.json()
    if (!addrData || addrData.length === 0)
      return NextResponse.json({ error: "Address not found." }, { status: 404 })

    const addrRec = addrData[0]
    const addrNumber = parseInt(addrRec.address_number, 10)
    const [addrLon, addrLat] = addrRec.point.coordinates
    const streetName = addrRec.street_name || ""
    const streetType = addrRec.street_type || ""
    const cnn = addrRec.cnn

    // Strategy 1: Try CNN first if available
    let cleaningData: CleaningItem[] = []
    if (cnn) {
      const cnnUrl = `https://data.sfgov.org/resource/yhqp-riqs.json?cnn=${cnn}&$limit=100`
      const cnnResp = await fetch(cnnUrl)
      if (cnnResp.ok) {
        cleaningData = await cnnResp.json()
      }
    }

    // Strategy 2: If no CNN results or CNN missing, search by corridor name
    if (!cleaningData || cleaningData.length === 0) {
      // Try multiple corridor name variations
      const variations = [
        streetName, // e.g., "25TH"
        `${streetName} ${streetType}`, // e.g., "25TH AVE"
        streetName.replace(/TH/, "th"), // e.g., "25th"
        streetName.replace(/TH/, "th") + " " + streetType, // e.g., "25th Ave"
      ]

      for (const variant of variations) {
        const corridorUrl = `https://data.sfgov.org/resource/yhqp-riqs.json?corridor=${encodeURIComponent(
          variant
        )}&$limit=300`
        const corridorResp = await fetch(corridorUrl)
        if (corridorResp.ok) {
          const data: CleaningItem[] = await corridorResp.json()
          if (data && data.length > 0) {
            cleaningData = data
            break
          }
        }
      }
    }

    // Strategy 3: Fallback to text search
    if (!cleaningData || cleaningData.length === 0) {
      const searchTerm = `${streetName} ${streetType}`.trim()
      const searchUrl = `https://data.sfgov.org/resource/yhqp-riqs.json?$q=${encodeURIComponent(
        searchTerm
      )}&$limit=300`
      const searchResp = await fetch(searchUrl)
      if (searchResp.ok) {
        cleaningData = await searchResp.json()
      }
    }

    if (!cleaningData || cleaningData.length === 0) {
      return NextResponse.json({
        error: "No street cleaning data found.",
        status: 404,
      })
    }

    // Enrich each item with parsed data
    const enrichedItems = await Promise.all(
      cleaningData.map(async item => {
        // Parse limits
        const limits = parseLimits(item.limits)

        // Determine side using coordinates
        const addrSide = getSideFromCoordinates(
          item.line?.coordinates || [],
          addrLon,
          addrLat
        )

        // Determine week(s)
        const weeks: string[] = []
        if (item.week1 === "1") weeks.push("1st")
        if (item.week2 === "1") weeks.push("2nd")
        if (item.week3 === "1") weeks.push("3rd")
        if (item.week4 === "1") weeks.push("4th")
        if (item.week5 === "1") weeks.push("5th")

        // Check if limits have numeric values (address ranges)
        const hasNumericLimits =
          !isNaN(limits.start) &&
          !isNaN(limits.end) &&
          limits.start > 0 &&
          limits.end > 0

        // For cross-street limits, try to look up their locations
        let crossStreetInRange = false
        if (!hasNumericLimits && limits.startStr && limits.endStr) {
          // Look up the cross-streets to find their approximate locations
          const startLoc = await lookupStreetLocation(limits.startStr)
          const endLoc = await lookupStreetLocation(limits.endStr)

          if (startLoc !== null && endLoc !== null) {
            // Determine if address is between these cross streets
            // We need to check which direction the street goes
            // For simplicity, assume if both locations are available, check if addr is between them
            const min = Math.min(startLoc, endLoc)
            const max = Math.max(startLoc, endLoc)

            // Heuristic: if the address number is reasonably close to the cross-street locations,
            // consider it in range (within 500 block range as a reasonable assumption)
            if (
              Math.abs(addrNumber - min) < 500 &&
              Math.abs(addrNumber - max) < 500
            ) {
              crossStreetInRange = true
            }
          }
        }

        // Calculate if address is in range (only if we have numeric limits)
        const inRange =
          hasNumericLimits &&
          limits.valid &&
          addrNumber >= Math.min(limits.start, limits.end) &&
          addrNumber <= Math.max(limits.start, limits.end)

        // Calculate distance to block (only if numeric)
        const blockDistance = hasNumericLimits
          ? getBlockDistance(addrNumber, limits.start, limits.end)
          : Infinity

        // Check if side matches
        const sideMatches =
          addrSide &&
          ((addrSide === "left" && item.cnnrightleft === "L") ||
            (addrSide === "right" && item.cnnrightleft === "R"))

        // If no coordinates, accept both sides
        const hasLineData =
          item.line?.coordinates && item.line.coordinates.length > 0
        const sideIsCompatible = !hasLineData || sideMatches || !addrSide

        return {
          ...item,
          addrSide,
          start: limits.start,
          end: limits.end,
          startStr: limits.startStr,
          endStr: limits.endStr,
          weeks,
          inRange: inRange || crossStreetInRange,
          sideMatches,
          sideIsCompatible,
          blockDistance,
          hasLineData,
          hasNumericLimits,
          isCrossStreet: !hasNumericLimits,
        }
      })
    )

    // Filtering strategy:
    // 1. Prefer exact matches (in range AND compatible side AND side matches)
    let matchedSchedules = enrichedItems.filter(
      item => item.inRange && item.sideIsCompatible && item.sideMatches
    )

    // 2. If no perfect matches, try exact range but any compatible side
    if (matchedSchedules.length === 0) {
      matchedSchedules = enrichedItems.filter(
        item => item.inRange && item.sideIsCompatible
      )
    }

    // 3. If still no matches, find the single closest block
    if (matchedSchedules.length === 0) {
      const sortedByDistance = enrichedItems
        .filter(item => item.sideIsCompatible && item.blockDistance < Infinity)
        .sort((a, b) => a.blockDistance - b.blockDistance)

      // Take only the closest one, or if there are ties, prefer those with exact side match
      if (sortedByDistance.length > 0) {
        const closestDistance = sortedByDistance[0].blockDistance
        matchedSchedules = sortedByDistance.filter(
          item => item.blockDistance === closestDistance
        )

        // If multiple at same distance, prefer side matches
        const withSideMatch = matchedSchedules.filter(item => item.sideMatches)
        if (withSideMatch.length > 0) {
          matchedSchedules = withSideMatch
        }

        // Take just the first one
        matchedSchedules = matchedSchedules.slice(0, 1)
      }
    }

    // 4. Final fallback: show one segment with cross-street that's close
    if (matchedSchedules.length === 0) {
      matchedSchedules = enrichedItems
        .filter(item => item.sideIsCompatible)
        .slice(0, 1) // Just one
    }

    // Format the results
    matchedSchedules = matchedSchedules.map(item => ({
      ...item,
      weekday:
        weekdayMap[item.weekday as keyof typeof weekdayMap] ||
        item.weekday ||
        "",
      fromhour: formatHour(item.fromhour),
      tohour: formatHour(item.tohour),
    }))

    if (matchedSchedules.length === 0) {
      return NextResponse.json(
        {
          error:
            "Street cleaning data does not cover this exact address number.",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      address: addrRec.address,
      schedules: matchedSchedules,
      addrCoords: [addrLon, addrLat],
    })
  } catch (err) {
    console.error("[v0] Error:", err)
    return NextResponse.json(
      { error: "Failed to fetch street cleaning data." },
      { status: 500 }
    )
  }
}
