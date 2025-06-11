"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"

interface RouteCount {
  floorId: number
  routeCount: number
}

export function useRouteStatistics() {
  const [routeCounts, setRouteCounts] = useState<RouteCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRouteStatistics() {
      try {
        setIsLoading(true)
        setError(null)

        const floorsRes = await axios.get(`${process.env.REACT_APP_INDOOR_URL}/floors`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("accessToken")}`,
          },
        })

        const floors = floorsRes.data || []

        const results = await Promise.allSettled(
          floors.map(async (floor: any) => {
            const nodesRes = await axios.get(`${process.env.REACT_APP_INDOOR_URL}/floors/${floor.id}/nodes`, {
              headers: {
                Authorization: `Bearer ${Cookies.get("accessToken")}`,
              },
            })

            const nodes = nodesRes.data || []
            const routeNodeCount = nodes.filter((n: any) => n.type === "ROUTE_NODE").length

            return {
              floorId: floor.id,
              routeCount: routeNodeCount,
            }
          }),
        )

        const successfulResults = results
          .filter((result): result is PromiseFulfilledResult<RouteCount> => result.status === "fulfilled")
          .map((result) => result.value)

        setRouteCounts(successfulResults)
      } catch (err) {
        console.error("Error fetching route statistics:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRouteStatistics()
  }, [])

  const totalRoutes = routeCounts.reduce((sum, r) => sum + r.routeCount, 0)

  return {
    routeCounts,
    totalRoutes,
    isLoading,
    error,
  }
}
