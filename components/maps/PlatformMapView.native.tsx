// Platform-specific MapView for NATIVE (iOS/Android)
// This file is used on native platforms

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export const PlatformMapView = MapView;
export const PlatformMarker = Marker;
export const PlatformPolyline = Polyline;
export const PlatformProviderGoogle = PROVIDER_GOOGLE;
