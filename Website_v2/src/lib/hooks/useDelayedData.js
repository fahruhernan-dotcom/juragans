import { useState, useEffect } from 'react'

/**
 * Hook to delay data updates to prevent flickering during search/refetching.
 * @param {any} data - The data to track.
 * @param {number} delay - Delay in ms.
 * @returns {any} - The delayed data.
 */
export const useDelayedData = (data, delay = 500) => {
  const [delayedData, setDelayedData] = useState(data)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDelayedData(data)
    }, delay)

    return () => clearTimeout(handler)
  }, [data, delay])

  return delayedData
}
