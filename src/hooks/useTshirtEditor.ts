import { useCallback, useEffect, useRef, useState } from 'react'
import { TshirtEditor } from '../core'
import type { EditorSelection, PrintAreaPct } from '../core'

export function useTshirtEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<TshirtEditor | null>(null)

  const [isEditorReady, setIsEditorReady] = useState(false)
  const [hasProduct, setHasProduct] = useState(false)
  const [hasDesign, setHasDesign] = useState(false)
  const [selection, setSelection] = useState<EditorSelection>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    const containerEl = containerRef.current
    if (!canvasEl || !containerEl) {
      return
    }

    const editor = new TshirtEditor(canvasEl, {
      onProductLoaded: () => {
        setHasProduct(true)
        setErrorMessage(null)
      },
      onProductCleared: () => setHasProduct(false),
      onSelectionChange: setSelection,
      onCanvasChanged: () => {
        setStatusMessage(null)
        if (editorRef.current) {
          setHasDesign(editorRef.current.hasCustomDesign())
        }
      },
      onError: (message) => setErrorMessage(message),
    })

    editor.attachContainer(containerEl)
    editorRef.current = editor
    setIsEditorReady(true)

    const onKeyDown = (event: KeyboardEvent) => {
      editor.handleKeyDown(event)
    }
    canvasEl.addEventListener('keydown', onKeyDown)

    return () => {
      canvasEl.removeEventListener('keydown', onKeyDown)
      editor.dispose()
      editorRef.current = null
      setIsEditorReady(false)
    }
  }, [])

  const getEditor = useCallback((): TshirtEditor | null => editorRef.current, [])

  const showError = useCallback((message: string) => {
    setErrorMessage(message)
  }, [])

  const clearMessages = useCallback(() => {
    setErrorMessage(null)
    setStatusMessage(null)
  }, [])

  /** Load garment background without clearing the customer's design. */
  const loadGarment = useCallback(async (dataUrl: string): Promise<void> => {
    const editor = editorRef.current
    if (!editor) return
    try {
      await editor.setGarmentImage(dataUrl)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load garment.')
    }
  }, [])

  /** Update the active print area; repositions design automatically. */
  const updatePrintArea = useCallback((area: PrintAreaPct) => {
    editorRef.current?.setPrintArea(area)
  }, [])

  /** Toggle the dashed print area boundary guide. */
  const togglePrintBoundary = useCallback((visible: boolean) => {
    editorRef.current?.showPrintBoundary(visible)
  }, [])

  /** Scale the custom design image by a relative factor. */
  const scaleDesign = useCallback((factor: number) => {
    editorRef.current?.scaleDesignBy(factor)
  }, [])

  /** Center the design within the current print area. */
  const centerDesign = useCallback(() => {
    editorRef.current?.moveDesignToCenter()
  }, [])

  /** Remove the custom image layer (keeps text layers). */
  const removeDesign = useCallback(() => {
    editorRef.current?.removeCustomImage()
    setHasDesign(false)
  }, [])

  return {
    canvasRef,
    containerRef,
    getEditor,
    isEditorReady,
    hasProduct,
    hasDesign,
    selection,
    statusMessage,
    setStatusMessage,
    errorMessage,
    showError,
    clearMessages,
    loadGarment,
    updatePrintArea,
    togglePrintBoundary,
    scaleDesign,
    centerDesign,
    removeDesign,
  }
}
