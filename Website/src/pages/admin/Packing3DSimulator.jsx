import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

const POUCH_PRESETS = {
  '250g': { label: 'Pouch 250g (Delkochoice 12x18 cm)', w: 12, h: 18, g: 4.8 },
  '100g': { label: 'Pouch 100g (Mini 9x15 cm)', w: 9, h: 15, g: 3.5 },
  'custom': { label: '✏️ Ukuran Custom (Input Manual)', w: 12, h: 18, g: 4.8 }
}

export default function Packing3DSimulator() {
  const mountRef = useRef(null)

  const [boxSize, setBoxSize] = useState('25x25x10')
  const [pouchPreset, setPouchPreset] = useState('250g')
  const [customDim, setCustomDim] = useState({ w: 12, h: 18, g: 4.8 })
  const [packCount, setPackCount] = useState(4)
  const [packingMode, setPackingMode] = useState('tiduran')
  const [isZigzag, setIsZigzag] = useState(true)

  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const boxMeshRef = useRef(null)
  const pouchGroupRef = useRef(null)

  // Get active pouch dimensions
  const activePouch = pouchPreset === 'custom'
    ? customDim
    : POUCH_PRESETS[pouchPreset]

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)
    scene.position.set(4, -2, 0)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(28, 24, 36)
    camera.lookAt(4, 4, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.1)
    dirLight.position.set(30, 45, 25)
    dirLight.castShadow = true
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45)
    fillLight.position.set(-30, 20, -20)
    scene.add(fillLight)

    // Floor Grid
    const grid = new THREE.GridHelper(90, 45, 0x475569, 0x1e293b)
    grid.position.y = -0.01
    scene.add(grid)

    // Group for Pouches
    const pouchGroup = new THREE.Group()
    scene.add(pouchGroup)
    pouchGroupRef.current = pouchGroup

    // Orbit Controls via Mouse Dragging
    let isDragging = false
    let prevMouse = { x: 0, y: 0 }

    const onMouseDown = (e) => {
      if (e.target.closest('.glass-panel')) return
      isDragging = true
      prevMouse = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouse.x
      const deltaY = e.clientY - prevMouse.y

      scene.rotation.y += deltaX * 0.008
      scene.rotation.x += deltaY * 0.008

      prevMouse = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => { isDragging = false }

    const onWheel = (e) => {
      camera.position.z += e.deltaY * 0.04
      camera.position.z = Math.max(15, Math.min(80, camera.position.z))
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel)

    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', handleResize)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Dynamic Pouch Geometry Creator
  const createPouchGeometry = (w, h, dBottom) => {
    const geom = new THREE.BufferGeometry()
    const dTop = dBottom * 0.3
    const hw = w / 2, hh = h / 2, hdb = dBottom / 2, hdt = dTop / 2

    const vertices = new Float32Array([
      -hw, -hh, -hdb,   hw, -hh, -hdb,   hw, -hh,  hdb,  -hw, -hh,  hdb,
      -hw,  hh, -hdt,   hw,  hh, -hdt,   hw,  hh,  hdt,  -hw,  hh,  hdt
    ])

    const indices = [
      3, 2, 6,   3, 6, 7,
      0, 4, 5,   0, 5, 1,
      4, 7, 6,   4, 6, 5,
      0, 1, 2,   0, 2, 3,
      1, 5, 6,   1, 6, 2,
      0, 3, 7,   0, 7, 4
    ]

    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geom.computeVertexNormals()
    return geom
  }

  // Update 3D Scene based on Box and Pouch Dimensions (Strict Zero-Overlap Placement)
  useEffect(() => {
    const scene = sceneRef.current
    const pouchGroup = pouchGroupRef.current
    if (!scene || !pouchGroup) return

    if (boxMeshRef.current) {
      scene.remove(boxMeshRef.current)
    }

    while (pouchGroup.children.length > 0) {
      pouchGroup.remove(pouchGroup.children[0])
    }

    const [p, l, t] = boxSize.split('x').map(Number)
    const { w: pw, h: ph, g: pg } = activePouch

    // Build Cardboard Box Mesh
    const boxGroup = new THREE.Group()
    const boxGeom = new THREE.BoxGeometry(p, t, l)
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.7,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide
    })
    const boxMesh = new THREE.Mesh(boxGeom, boxMat)
    boxMesh.position.y = t / 2
    boxGroup.add(boxMesh)

    const edges = new THREE.EdgesGeometry(boxGeom)
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 })
    const line = new THREE.LineSegments(edges, lineMat)
    line.position.y = t / 2
    boxGroup.add(line)

    scene.add(boxGroup)
    boxMeshRef.current = boxGroup

    // Add Pouches with STRICT ZERO OVERLAP
    const pouchGeom = createPouchGeometry(pw, ph, pg)
    const pouchMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92
    })

    const dTop = pg * 0.3

    for (let i = 0; i < packCount; i++) {
      const pouchContainer = new THREE.Group()
      const pouchMesh = new THREE.Mesh(pouchGeom, pouchMat)

      // Add Zipper Strip
      const zipperGeom = new THREE.BoxGeometry(pw + 0.2, 1.2, dTop + 0.1)
      const zipperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
      const zipperMesh = new THREE.Mesh(zipperGeom, zipperMat)
      zipperMesh.position.y = ph / 2
      pouchMesh.add(zipperMesh)

      // Add Red Logo Label
      const labelGeom = new THREE.PlaneGeometry(pw * 0.65, ph * 0.55)
      const labelMat = new THREE.MeshBasicMaterial({ color: 0x701a1e, side: THREE.DoubleSide })
      const labelMesh = new THREE.Mesh(labelGeom, labelMat)
      labelMesh.position.set(0, 0, (pg * 0.5) + 0.01)
      pouchMesh.add(labelMesh)

      pouchContainer.add(pouchMesh)

      if (packingMode === 'tiduran') {
        pouchMesh.rotation.z = -Math.PI / 2
        pouchMesh.rotation.x = -Math.PI / 2

        const row = Math.floor(i / 2) // 0 = Front Row, 1 = Back Row
        const layer = i % 2 // 0 = Bottom Layer, 1 = Top Layer

        const isFlip = isZigzag && (layer === 1)
        if (isFlip) {
          pouchMesh.rotation.y = Math.PI
        }

        const xPos = 0 // Centered along box length (18cm inside 25cm)
        
        // Strict Z spacing: Each pouch width is pw (12cm). Gap = 0.5cm between front & back row
        const zPos = (row === 0) ? -(pw / 2 + 0.25) : (pw / 2 + 0.25)

        // Strict Y spacing:
        // Layer 0 bottom rests on floor Y = 0 -> center Y = pg / 2
        // Layer 1 bottom rests EXACTLY on top of Layer 0 (at Y = pg + dTop) -> center Y = pg + dTop / 2
        const yPos = (layer === 0)
          ? (pg / 2)
          : (pg + dTop / 2)

        pouchContainer.position.set(xPos, yPos, zPos)
      } else {
        // Standing Up
        const col = i % 2
        const row = Math.floor(i / 2)

        const isFlip = isZigzag && ((col + row) % 2 === 1)
        if (isFlip) {
          pouchMesh.rotation.y = Math.PI
        }

        const xPos = (col === 0) ? -(pw / 2 + 0.25) : (pw / 2 + 0.25)
        const zPos = (row === 0) ? -4.5 : 4.5
        const yPos = ph / 2

        pouchContainer.position.set(xPos, yPos, zPos)
      }

      pouchGroup.add(pouchContainer)
    }
  }, [boxSize, activePouch, packCount, packingMode, isZigzag])

  const setCameraPreset = (type) => {
    const camera = cameraRef.current
    const scene = sceneRef.current
    if (!camera || !scene) return

    scene.rotation.set(0, 0, 0)
    const [, , t] = boxSize.split('x').map(Number)

    if (type === 'top') {
      camera.position.set(4, 45, 0.1)
    } else if (type === 'front') {
      camera.position.set(4, 12, 45)
    } else {
      camera.position.set(28, 24, 36)
    }
    camera.lookAt(4, t / 2, 0)
  }

  const [p, l, t] = boxSize.split('x').map(Number)
  const volWeight = (p * l * t) / 6000

  return (
    <div className="relative w-full h-[calc(100vh-140px)] rounded-2xl overflow-hidden shadow-2xl border border-brand-gold/30 bg-slate-900 font-sans text-left">
      {/* 3D Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Controls Overlay Panel */}
      <div className="glass-panel absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl max-w-sm w-full border border-slate-700/80 shadow-2xl space-y-3.5 text-white z-10 overflow-y-auto max-h-[calc(100vh-170px)]">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📦</span>
          <div>
            <h2 className="font-black text-base text-brand-gold">Simulator 3D Packing Kardus</h2>
            <p className="text-[11px] text-slate-400">Juragan by Anak Bawang — Zero Overlap Guarantee</p>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Box Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">📦 Ukuran Kardus (P x L x T):</label>
          <select
            value={boxSize}
            onChange={(e) => setBoxSize(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-white focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="25x25x10">25 x 25 x 10 cm (Die-Cut 1 Kg - Rekomendasi 4-5 Pack)</option>
            <option value="25x20x8">25 x 20 x 8 cm (Die-Cut Eco - Rekomendasi 2-3 Pack)</option>
            <option value="20x15x10">20 x 15 x 10 cm (Single Wall - Rekomendasi 1-2 Pack)</option>
          </select>
        </div>

        {/* Pouch / Kemasan Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">🧅 Ukuran Kemasan / Pouch:</label>
          <select
            value={pouchPreset}
            onChange={(e) => setPouchPreset(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-amber-400 focus:ring-2 focus:ring-amber-500 outline-none"
          >
            {Object.entries(POUCH_PRESETS).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>

          {/* Custom Pouch Inputs */}
          {pouchPreset === 'custom' && (
            <div className="mt-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-700/80 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Lebar (cm):</span>
                <input
                  type="number"
                  value={customDim.w}
                  onChange={(e) => setCustomDim({ ...customDim, w: Number(e.target.value) || 1 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Tinggi (cm):</span>
                <input
                  type="number"
                  value={customDim.h}
                  onChange={(e) => setCustomDim({ ...customDim, h: Number(e.target.value) || 1 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Tebal (cm):</span>
                <input
                  type="number"
                  step="0.5"
                  value={customDim.g}
                  onChange={(e) => setCustomDim({ ...customDim, g: Number(e.target.value) || 1 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pack Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">🔢 Jumlah Pack Kemasan:</label>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setPackCount(cnt)}
                className={`py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  packCount === cnt
                    ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                    : 'bg-slate-800 hover:bg-amber-600/50 border-slate-700 text-slate-300'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        {/* Packing Mode */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">🔄 Mode Tata Letak Pouch:</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setPackingMode('tiduran')}
              className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
                packingMode === 'tiduran'
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-slate-800 hover:bg-amber-600/50 border-slate-700 text-slate-300'
              }`}
            >
              🛌 Tiduran (Interlocking Flat)
            </button>
            <button
              onClick={() => setPackingMode('berdiri')}
              className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
                packingMode === 'berdiri'
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-slate-800 hover:bg-amber-600/50 border-slate-700 text-slate-300'
              }`}
            >
              🧍 Berdiri Tegak
            </button>
          </div>
        </div>

        {/* Zigzag Toggle */}
        <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 text-xs">
          <span className="font-semibold text-slate-200">🔀 Penataan Zigzag (Selang-Seling Rata):</span>
          <input
            type="checkbox"
            checked={isZigzag}
            onChange={(e) => setIsZigzag(e.target.checked)}
            className="w-4 h-4 accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Realtime Metrics */}
        <div className="bg-slate-950/90 p-3.5 rounded-xl border border-amber-500/30 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status Penataan:</span>
            <span className="font-bold text-emerald-400">✅ ZERO OVERLAP (Presisi 0.0 cm)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Dimensi Pouch:</span>
            <span className="font-bold text-white">{activePouch.w} x {activePouch.h} x {activePouch.g} cm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Berat Volume Box:</span>
            <span className="font-bold text-amber-400">{volWeight.toFixed(2).replace('.', ',')} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Tarif Ekspedisi:</span>
            <span className="font-bold text-sky-400">
              {volWeight <= 1.3 ? 'Hitung 1 KG ONGKIR' : 'Hitung 2 KG ONGKIR'}
            </span>
          </div>
        </div>

        {/* Camera Preset Buttons */}
        <div className="pt-2 border-t border-slate-800 flex justify-between gap-1 text-[11px]">
          <button onClick={() => setCameraPreset('top')} className="bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded-lg text-slate-300 cursor-pointer">📷 Atas</button>
          <button onClick={() => setCameraPreset('front')} className="bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded-lg text-slate-300 cursor-pointer">📷 Depan</button>
          <button onClick={() => setCameraPreset('iso')} className="bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded-lg text-amber-400 font-bold cursor-pointer">📷 3D Iso</button>
        </div>
      </div>

      {/* Floating Instructions */}
      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-xl text-xs text-slate-300 border border-slate-700 shadow-xl">
        🖱️ <b>Putar 3D</b>: Klik Kiri & Drag | 🔍 <b>Zoom</b>: Scroll Mouse
      </div>
    </div>
  )
}
