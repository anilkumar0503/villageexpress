export async function getGoogleMapsDistance(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  apiKey: string,
): Promise<number> {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLon}&destinations=${destLat},${destLon}&key=${apiKey}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== 'OK') {
    throw new Error(`Google Maps API error: ${data.status}`)
  }

  const element = data.rows[0]?.elements[0]
  if (element?.status !== 'OK') {
    throw new Error(`Google Maps distance error: ${element?.status}`)
  }

  // Distance is returned in meters, convert to km
  return element.distance.value / 1000
}
