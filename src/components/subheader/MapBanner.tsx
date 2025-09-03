import React from 'react'
import Image from 'next/image'

const MapBanner = () => {
  return (
     <div
                className="flex-1 overflow-hidden relative"
                style={{
                  background:
                    "linear-gradient(90deg, var(--color-huelva-primary) 0%, var(--color-huelva-secondary) 100%)",
                  boxShadow:
                    "0 8px 24px -8px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                {/* Contenedor fijo en altura */}
                <div className="h-[160px] w-full relative">
                  <Image
                    src="/condado-banner.png"
                    alt="Condado de Huelva - Mancomunidad de Desarrollo"
                    fill
                    priority
                    className="object-cover object-bottom"
                  />
                </div>
              </div>
  )
}

export default MapBanner
