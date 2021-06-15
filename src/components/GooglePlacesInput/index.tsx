import React, { ReactElement } from 'react'
import parse from 'autosuggest-highlight/parse'
import debounce from 'lodash/debounce'

import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import LocationOnIcon from '@material-ui/icons/LocationOn'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

import { makeStyles } from '@material-ui/core/styles'

import geocodeByPlaceId from '../../utils/geocodeByPlaceId'

let autoCompleteService: google.maps.places.AutocompleteService

function loadScript(src: string, position: HTMLHeadElement | null, id: string) {
  if (!position) {
    return
  }

  const script = document.createElement('script')
  script.setAttribute('async', '')
  script.setAttribute('id', id)
  script.src = src
  position.appendChild(script)
}

const useStyles = makeStyles((theme) => ({
  icon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(2),
  },
}))

interface IGooglePlacesInput {
  setSelectedPlace: (place: google.maps.GeocoderResult | null) => void
}

export default function GooglePlacesInput(
  props: IGooglePlacesInput
): ReactElement {
  const classes = useStyles()

  const [value, setValue] =
    React.useState<google.maps.places.AutocompletePrediction | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [options, setOptions] = React.useState<
    google.maps.places.AutocompletePrediction[]
  >([])

  const loaded = React.useRef(false)

  if (typeof window !== 'undefined' && !loaded.current) {
    if (!document.querySelector('#google-maps')) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`,
        document.querySelector('head'),
        'google-maps'
      )
    }

    loaded.current = true
  }

  const getPlacePredictions = React.useMemo(
    () =>
      debounce((request, callback) => {
        if (window.google) {
          if (!autoCompleteService) {
            autoCompleteService = new google.maps.places.AutocompleteService()
          }

          autoCompleteService.getPlacePredictions(request, callback)
        }
      }, 500),
    []
  )

  const setSelectedPlaceDetails = async (
    selectedPlace: google.maps.places.AutocompletePrediction | null
  ) => {
    if (selectedPlace && selectedPlace.place_id) {
      const [placeDetails] = await geocodeByPlaceId(selectedPlace.place_id)

      props.setSelectedPlace(placeDetails || null)
    }
  }

  React.useEffect(() => {
    setSelectedPlaceDetails(value)
  }, [value])

  React.useEffect(() => {
    let active = true

    if (inputValue === '') {
      setOptions(value ? [value] : [])
      return undefined
    }

    getPlacePredictions(
      { input: inputValue },
      (results: google.maps.places.AutocompletePrediction[]) => {
        if (active) {
          let newOptions: google.maps.places.AutocompletePrediction[] = []

          if (value) {
            newOptions = [value]
          }

          if (results) {
            newOptions = [...newOptions, ...results]
          }

          setOptions(newOptions)
        }
      }
    )

    return () => {
      active = false
    }
  }, [value, inputValue, fetch])

  return (
    <Autocomplete
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.description
      }
      noOptionsText='Nenhuma opção encontrada...'
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      onChange={(event, newValue) => {
        setOptions(newValue ? [newValue, ...options] : options)
        setValue(newValue)
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue)
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label='Digite para procurar um endereço'
          variant='outlined'
          fullWidth
        />
      )}
      renderOption={(option) => {
        const matches =
          option.structured_formatting.main_text_matched_substrings
        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length])
        )

        return (
          <Grid container alignItems='center'>
            <Grid item>
              <LocationOnIcon className={classes.icon} />
            </Grid>
            <Grid item xs>
              {parts.map((part, index) => (
                <span
                  key={index}
                  style={{ fontWeight: part.highlight ? 700 : 400 }}
                >
                  {part.text}
                </span>
              ))}

              <Typography variant='body2' color='textSecondary'>
                {option.structured_formatting.secondary_text}
              </Typography>
            </Grid>
          </Grid>
        )
      }}
    />
  )
}
