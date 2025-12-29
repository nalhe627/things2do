import React from "react";
import { View } from "react-native";
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  height: number;
  accentColor?: string;
}

export default function MapPreview({
  latitude,
  longitude,
  height,
  accentColor = "#2563EB",
}: MapPreviewProps) {
  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  return (
    <View style={{ height, width: "100%" }}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1, width: "100%", height }}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }} pinColor={accentColor} />
      </MapView>
    </View>
  );
}
