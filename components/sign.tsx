"use client"

export interface ParkingSignProps {
  header: string // e.g., "NO PARKING"
  time: string // e.g., "12:01 A.M. TO 2 A.M."
  days: string[] // e.g., ["TUE","THUR"] or ["TUE"]
  footer?: string
  className?: string
}

const ParkingSign: React.FC<ParkingSignProps> = ({
  header,
  time,
  days,
  footer,
  className,
}) => {
  const [firstWord, ...restWords] = header.toUpperCase().split(/\s+/)

  return (
    <div
      className={`relative w-72 bg-white rounded-2xl text-center p-4 ${className}`}
      style={{ boxShadow: "inset 0 0 0 8px #dc2626" }}
    >
      {/* Header */}
      <div className="flex items-stretch justify-center mb-1">
        <span
          className="bg-red-600 text-white font-bold leading-none px-2 rounded-ms flex items-center justify-center"
          style={{ fontSize: 43, lineHeight: "1", minWidth: 74 }}
        >
          {firstWord}
        </span>
        <span
          className="text-red-600 font-extrabold leading-none tracking-tight ml-2 flex items-center"
          style={{ fontSize: 42, lineHeight: "1.05" }}
        >
          {restWords.join(" ")}
        </span>
      </div>

      {/* Time */}
      <div className="mb-1 flex items-baseline justify-center flex-wrap text-red-600">
        <span
          className="font-extrabold mr-1"
          style={{ fontSize: 48, lineHeight: "1.2" }}
        >
          {
            time
              .split(/A\.M\.|P\.M\./i)[0]
              ?.trim()
              .split(/\s+/)[0]
          }
        </span>
        <span
          className="font-medium mr-2"
          style={{ fontSize: 16, letterSpacing: "0.02em" }}
        >
          {time.toUpperCase().includes("AM") ? "A.M." : "P.M."}
        </span>
        <span className="font-medium mx-1" style={{ fontSize: 20 }}>
          TO
        </span>
        <span
          className="font-extrabold ml-1"
          style={{ fontSize: 48, lineHeight: "1" }}
        >
          {time.toUpperCase().match(/TO\s+([0-9:]+)/)?.[1] || ""}
        </span>
        <span
          className="font-medium ml-1"
          style={{ fontSize: 16, letterSpacing: "0.02em" }}
        >
          {time.toUpperCase().includes("PM") ? "P.M." : "A.M."}
        </span>
      </div>

      {/* Days */}
      {days.length > 0 && (
        <div className="mb-2 flex items-baseline justify-center text-red-600">
          <span
            className="font-semibold"
            style={{ fontSize: 35, lineHeight: "1" }}
          >
            {days.toUpperCase()}
          </span>
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="text-red-600 font-extrabold" style={{ fontSize: 27 }}>
          {footer.toUpperCase()}
        </div>
      )}
    </div>
  )
}

export default ParkingSign
