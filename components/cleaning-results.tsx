"use client"

import dynamic from "next/dynamic"
import { Calendar, Clock, MapPin, ArrowRight, CalendarDays } from "lucide-react"
import { Card } from "@/components/ui/card"
import ParkingSign from "./sign"

const StreetMap = dynamic(() => import("./map").then(mod => mod.StreetMap), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-muted rounded-xl" />,
})

interface CleaningResultsProps {
  data: { address: string; schedules: any[]; addrCoords: [number, number] }
  address: string
}

export function CleaningResults({ data, address }: CleaningResultsProps) {
  if (!data?.schedules || data.schedules.length === 0) {
    return (
      <Card className="p-8 text-center rounded-xl shadow-sm">
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            No results found
          </p>
          <p className="text-sm text-muted-foreground">
            We couldn’t find street cleaning data for this address.
          </p>
        </div>
      </Card>
    )
  }

  const shownData = data.schedules

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{data.address || address}</span>
      </div>

      {shownData.map((schedule, index) => {
        const sideLabel =
          schedule.addrSide === "left"
            ? "Left side of street"
            : "Right side of street"

        return (
          <Card
            key={index}
            className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-border/50"
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <ParkingSign
                  header="NO PARKING"
                  time={`${schedule.fromhour} TO ${schedule.tohour}`}
                  days={schedule.weekday}
                  footer="STREET CLEANING"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    {schedule.corridor || "Street Cleaning"}
                  </h3>
                  {schedule.limits && (
                    <p className="text-sm text-muted-foreground">
                      Between {schedule.limits}
                    </p>
                  )}
                  {/* {schedule.cnn && (
                    <p className="text-sm text-muted-foreground">
                      CNN: {schedule.cnn}
                    </p>
                  )} */}
                  {/* {schedule.weeks && schedule.weeks.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Week: {schedule.weeks.join(", ")}
                    </p>
                  )} */}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {schedule.weekday && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Day</p>
                      <p className="text-muted-foreground">
                        {schedule.weekday}
                      </p>
                    </div>
                  </div>
                )}

                {(schedule.fromhour || schedule.tohour) && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Time</p>
                      <p className="text-muted-foreground">
                        {schedule.fromhour} to {schedule.tohour}
                      </p>
                    </div>
                  </div>
                )}

                {schedule.weeks && schedule.weeks.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Week</p>
                      <p className="text-muted-foreground">
                        {schedule.weeks.length >= 5 &&
                        ["1st", "2nd", "3rd", "4th", "5th"].every(ordinalWeek =>
                          schedule.weeks.includes(ordinalWeek)
                        )
                          ? "Everyweek"
                          : schedule.weeks.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <ArrowRight className="h-3 w-3 text-primary" />
                <span className="font-medium text-foreground">{sideLabel}</span>
              </div> */}

              {schedule.line && (
                <div className="mt-6">
                  <StreetMap
                    key={`map-${index}-${
                      schedule.cnn || schedule.corridor || ""
                    }`}
                    line={schedule.line.coordinates}
                    addressCoords={data.addrCoords}
                    side={schedule.addrSide}
                    address={data.address || address}
                  />
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
