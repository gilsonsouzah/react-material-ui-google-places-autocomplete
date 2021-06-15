import React, { ReactElement } from 'react'

import GooglePlacesInput from './components/GooglePlacesInput'

export default function App(): ReactElement {
  const [selectedPlace, setSelectedPlace] =
    React.useState<google.maps.GeocoderResult | null>(null)

  return (
    <div className='App'>
      <GooglePlacesInput setSelectedPlace={setSelectedPlace} />

      <p>{JSON.stringify(selectedPlace)}</p>
    </div>
  )
}
