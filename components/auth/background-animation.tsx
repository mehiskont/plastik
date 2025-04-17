"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Float, Environment } from "@react-three/drei"
import * as THREE from "three"
import { useTheme } from "next-themes"
import React from "react"

export const Background: React.FC = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // This effect runs only on the client after initial render
    setIsClient(true)
  }, [])

  return (
    <div className="w-full h-full pointer-events-none"> 
      {/* Only render Canvas on the client side after mount */}
      {isClient && (
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <Environment preset="sunset" />
          <ambientLight intensity={0.8} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          <SingleVinylRecord />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
        </Canvas>
      )}
    </div>
  )
}

const SingleVinylRecord: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null) // Added type annotation

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Add a gentle swaying motion to the entire record
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.1
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <VinylRecord position={[0, 0, 0]} labelColor="#f06292" />
      </Float>
    </group>
  )
}

// Added type for props
interface VinylRecordProps {
  position: [number, number, number];
  labelColor: string;
}

const VinylRecord: React.FC<VinylRecordProps> = ({ position, labelColor }) => { // Added React.FC type
  const recordRef = useRef<THREE.Group>(null) // Added type annotation
  const { resolvedTheme } = useTheme() // Get the resolved theme

  const RECORD_DIAMETER = 3.5
  const LABEL_DIAMETER = 1.2
  const THICKNESS = 0.08

  // Determine record color based on theme
  const recordColor = resolvedTheme === 'dark' ? '#ffffff' : '#111111'

  // Create a canvas texture for the label with the logo
  const labelTexture = useMemo(() => {
    // Only run this code on the client-side
    if (typeof window === 'undefined') {
      return null
    }

    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")

    if (ctx) {
      // Fill with the label color
      ctx.fillStyle = labelColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the logo in white
      ctx.fillStyle = "#ffffff"
      ctx.save()

      // Center and scale the logo
      ctx.translate(canvas.width / 2, canvas.height / 2)
      const scale = 1.5 
      ctx.scale(scale, scale)

      // Draw the SVG path
      ctx.beginPath()
      // This is the SVG path data from the provided SVG
      const path = new Path2D(
        "M360.1,61.17c5.81-10.33-13.24-13.02-15.88,7.54c-0.42,3.23-0.34,6.79,1.83,7.93c3.2,1.69,3.82-1.74,5.35-3.94C354.08,68.86,357.65,65.52,360.1,61.17 M130.19,102.16c-9.03,18.85-21.42,45.92-12.09,51.5c7.05,1.72,25.79-20.48,28.09-24.18c1.96,1.97,0.87,0.77,1.87,3.73c5.08,15.01,15.87,2.01,20.35-2.26c4.25-4.05,16.25-18.22,21.74-19.75c-0.71,6.9-9.24,18.34-0.65,22.86c9.49,5,31.89-16.51,38.33-22.07c3.61-3.11,11.17-13.79,16.56-13.26c4.29,17.08-10.69,16.31-16.37,23.09c-9.55,11.38-0.14,22.01,11.58,14.2c4.07-2.71,6.19-6.55,9.24-11.12c2.41-3.61,9.57-4.04,13.91-5.82c14.16-5.79,14.83-11.45,22.58-16.71c-2.31,8.28-11.48,25.86-2.39,32.43c14.95,2.84,31.58-25.75,39.51-29.04c0.22,6.1-8.63,18.16-1.63,22.97c6.4,4.4,17.73-4.82,20.99-7.4c9.57-7.59,27.53-27.53,30.32-29.38c-2.1,9.05-15.25,34.58-5.47,40.85c8.49-0.42,12.49-19.02,19.04-23.08c1.92,24.12,2.34,40.67,25.53,21.61c5.81-4.78,11.11-9.88,16.2-15.5c3.55-3.92,13.8-10.55,12.1-17.78c-5.83-1.05-7.83,3.02-10.67,5.79c-2.94,2.87-5.79,5.17-8.6,8.02c-10.63,10.79-24.91,22.97-24.71-1.84c6.81-3.04,15.79-8.48,20.3-12.83c3.49-3.37,12.71-16.21,2.9-20.58c-14.09-6.28-34.12,22.48-39.56,24.86c3-14.79,21.6-45.71,29.45-53.57c25.13-25.14,20.57-38.4,8.01-32.36c-10.66,5.12-20.75,25.57-26.01,36.45c-10.89,22.55-5.53,10.58-16.45,24.93c-5.18,6.81-33.32,39.63-44.8,39.14c-0.54-8.36,14.62-23.84,11.01-29.76c-8.56-10.76-37.21,34.87-50.35,34.31c-2.85-10.99,16.41-44.32,21.55-50.74c4.31-0.21,13.54-0.3,17.32-1.29c4.96-1.29,5.6-8.54,1.65-11.24c-2.25-1.66-6.7-0.07-10.16,0.42c1.01-4.18,5.57-9.83,1.24-14.29c-7.51-4.02-14.45,11.29-17.57,16.1c-8.51,1.16-16.96,1.73-25.39,2.96c-6.47,0.94-19.73,1.67-14.24,11.54c3.33,2.17,12.26-1.22,16.67-1.89c5.73-0.87,11.57-1.34,17.41-1.73c-3.77,10.63-12.18,20-18.1,25.62c-9.08,8.63-9.44,12.07-25.5,17.1c0.92-7.31,6.69-20.29,0.49-25.79c-7.69-6.82-16.58,2.72-20.38,6.36c-4.29,4.11-26.95,29.48-35.62,27.03c-4.38-5.93,7.95-12.61,1.67-22.34c-15.45-3.4-33.27,24.72-40.45,24.83c0.07-6.6,12.83-17.84,16.97-21.25c15.34-12.62,15.74-9.22,23.72-13.97c1.24-11.79-14.76-4.74-20.2-1.91c-19.85,10.31-41.37,43.49-49.95,43.76c-3.22-8.92,27.21-63.15,34.52-75.02c3.59-5.82,14.84-16.93,8.22-23.56c-6.17-1.02-9.51,6.31-12.56,10.44c-12.43,16.87-63.55,84.63-78.32,81.8c-0.97-9.14,19.58-26.43,8.24-34.16c-11.32-3.46-22.32,12.55-27.77,15.44c0.77-6.42,7.39-15.1,1.88-18.36c-6-4.34-17.86,6.57-20.85,9.26C40.92,99,30.13,106.8,32.06,113.39c8.26,2.69,12.82-10.02,19.92-12.89c1.56,9.91-27.3,47.14-34.73,65.35c-7.49,18.35,2.29,20.76,6.92,17.13c3.16-2.48,18.9-37.38,22.63-44.23c4.48-8.24,23.43-36.49,32.09-33.85c1.9,6.17-14.03,18.44-9.41,28.88c4.66,10.54,23-3.59,27.24-6.83c20.29-15.51,34.17-37.02,41.23-42.02C137.22,87.71,134,94.21,130.19,102.16 M391.1,102.16c1.67-3.35,12.52-15,19.84-16.59C409.5,92.97,396.24,101.05,391.1,102.16z",
      )
      ctx.fill(path)

      ctx.restore()
    }

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [labelColor])

  // Spin the record continuously like it's playing
  useFrame(({ clock }) => {
    if (recordRef.current) {
      // Rotate around the Y axis (like a record spinning on a turntable)
      recordRef.current.rotation.y = clock.getElapsedTime() * 1.2
    }
  })

  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <group ref={recordRef}>
        {/* The main vinyl record (use dynamic color) */}
        <mesh>
          <cylinderGeometry args={[RECORD_DIAMETER, RECORD_DIAMETER, THICKNESS, 64]} />
          <meshStandardMaterial 
            color={recordColor} // Use the dynamic recordColor
            roughness={0.2} // Decreased for more gloss
            metalness={0.6} // Increased for more reflection
          />
        </mesh>

        {/* The center label - Top Side */}
        {labelTexture && (
          <mesh position={[0, THICKNESS / 2 + 0.001, 0]}> {/* Position slightly above top face */}
            <cylinderGeometry args={[LABEL_DIAMETER, LABEL_DIAMETER, 0.01, 32]} />
            <meshStandardMaterial 
              color={labelColor} 
              roughness={0.5} 
              map={labelTexture} 
              transparent={true} 
              side={THREE.FrontSide} // Explicitly render front side
            />
          </mesh>
        )}

        {/* The center label - Bottom Side */}
        {labelTexture && (
          <mesh 
            position={[0, -THICKNESS / 2 - 0.001, 0]}
            rotation={[Math.PI, 0, 0]} // Rotate 180 degrees on X-axis to flip texture
          >
            <cylinderGeometry args={[LABEL_DIAMETER, LABEL_DIAMETER, 0.01, 32]} />
            <meshStandardMaterial 
              color={labelColor} 
              roughness={0.5} 
              map={labelTexture} 
              transparent={true} 
              side={THREE.FrontSide} // Render front side (which is now facing down due to rotation)
            />
          </mesh>
        )}

        {/* The center hole */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, THICKNESS + 0.02, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
    </group>
  )
}

// Add default export at the end if needed by the calling pages
export default Background; 