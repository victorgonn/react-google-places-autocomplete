import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { OptionsType, OptionTypeBase } from 'react-select';
import { useDebouncedCallback } from 'use-debounce';
import GooglePlacesAutocompleteProps, {
  AutocompletionRequest,
  GooglePlacesAutocompleteHandle,
} from './GooglePlacesAutocomplete.types';
import autocompletionRequestBuilder from './helpers/autocompletionRequestBuilder';
import { Loader } from '@googlemaps/js-api-loader';

const SelectStyles = {
  control: (base: any, state: any) => ({
      ...base,
      border: '0 !important',
      borderBottom: state.isFocused ? '1px solid #3f51b5 !important' : '1px solid !important',
      borderRadius: 0,
      boxShadow: 'none'
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  valueContainer: (base: any) => ({
      ...base,
      padding: '2px 0px'
  })
};

const GooglePlacesAutocomplete: React.ForwardRefRenderFunction<GooglePlacesAutocompleteHandle, GooglePlacesAutocompleteProps> = ({
  apiKey = '',
  apiOptions = {},
  autocompletionRequest = {},
  debounce = 300,
  minLengthAutocomplete = 0,
  selectProps = {},
  onLoadFailed = console.error,
  withSessionToken = false,
} : GooglePlacesAutocompleteProps, ref) : React.ReactElement => {
  //const [isFocused, setIsFocused] = useState(false);
  const [placesService, setPlacesService] = useState<google.maps.places.AutocompleteService | undefined>(undefined);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | undefined>(undefined);
  const [fetchSuggestions] = useDebouncedCallback((value: string, cb: (options: OptionsType<OptionTypeBase>) => void): void => {
    if (!placesService) return cb([]);
    if (value.length < minLengthAutocomplete) return cb([]);

    const autocompletionReq: AutocompletionRequest = { ...autocompletionRequest };

    placesService.getPlacePredictions(
      autocompletionRequestBuilder(
        autocompletionReq,
        value,
        withSessionToken && sessionToken,
      ), (suggestions) => {
        cb((suggestions || []).map(suggestion => ({ label: suggestion.description, value: suggestion })));
      },
    );
  }, debounce);

  const initializeService = () => {
    if (!window.google) throw new Error('[react-google-places-autocomplete]: Google script not loaded');
    if (!window.google.maps) throw new Error('[react-google-places-autocomplete]: Google maps script not loaded');
    if (!window.google.maps.places) throw new Error('[react-google-places-autocomplete]: Google maps places script not loaded');

    setPlacesService(new window.google.maps.places.AutocompleteService());
    setSessionToken(new google.maps.places.AutocompleteSessionToken());
  }

  useImperativeHandle(ref, () => ({
    getSessionToken: () => {
      return sessionToken;
    },
    refreshSessionToken: () => {
      setSessionToken(new google.maps.places.AutocompleteSessionToken());
    }
  }), [sessionToken]);

  useEffect(() => {
    const init = async () => {
      try {
        if ( !window.google || !window.google.maps || !window.google.maps.places ) {
          await new Loader({ apiKey, ...{ libraries: ['places'], ...apiOptions }}).load();
        }
        initializeService();
      } catch (error) {
        onLoadFailed(error);
      }
    }

    if (apiKey) init();
    else initializeService();
  }, []);

  const handleFocus = () => {
    //setIsFocused(true);
    console.log("focused")
  }

  const handleBlur = () => {
    //setIsFocused(false);
    console.log("not! focused")
  }

  return (
    <AsyncSelect
      {...selectProps}
      styles={SelectStyles}
      onFocus={handleFocus}
      onBlur={handleBlur}
      menuPortalTarget={document.body}
      loadOptions={fetchSuggestions}
      getOptionValue={({ value }) => value.place_id}
    />
  );
};

export default forwardRef(GooglePlacesAutocomplete);
