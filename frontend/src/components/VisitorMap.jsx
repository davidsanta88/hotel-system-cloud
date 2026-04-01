import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const VisitorMap = ({ markers = [] }) => {
  // Filtrar marcadores que tienen latitud y longitud válidas
  const validMarkers = markers.filter(m => m.lat !== undefined && m.lon !== undefined);

  return (
    <div className="w-full h-full min-h-[300px] bg-slate-50 rounded-xl overflow-hidden border border-gray-100 shadow-inner relative group">
      <div className="absolute top-3 left-3 z-10 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-gray-500 uppercase border border-gray-100 shadow-sm">
        Mapa de Tráfico Global
      </div>
      
      <ComposableMap
        projectionConfig={{
          scale: 200,
          center: [0, 0]
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} maxZoom={5}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#EAEAEC"
                  stroke="#D6D6DA"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#d1d5db", outline: "none" },
                    pressed: { fill: "#9ca3af", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          
          {validMarkers.map(({ nombre, valor, lat, lon }, index) => (
            <Marker key={index} coordinates={[lon, lat]}>
              <circle 
                r={Math.min(10, Math.max(3, 4 + Math.log2(valor || 1)))} 
                fill="#3b82f6" 
                stroke="#fff" 
                strokeWidth={1.5}
                className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer bubble-marker"
              />
              <title>{`${nombre}: ${valor} visitas`}</title>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Estilo para animación simple de los marcadores */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-marker {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .bubble-marker {
          transform-origin: center;
          animation: pulse-marker 3s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

export default VisitorMap;
