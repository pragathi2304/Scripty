import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import styled from "styled-components";

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 430;

const PEN_WIDTH = 6;
const ERASER_WIDTH = 36;

const DrawingCanvas = forwardRef(function DrawingCanvas(
  {
    character = "",
    tool = "pen",
    onDrawingChange,
  },
  ref
) {
  const canvasRef = useRef(null);

  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);

  // ----------------------------------------------------------
  // INITIALIZE CANVAS
  // ----------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // ----------------------------------------------------------
  // GET CANVAS POSITION
  // ----------------------------------------------------------

  const getPoint = (event) => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) / rect.width) *
        CANVAS_WIDTH,

      y:
        ((event.clientY - rect.top) / rect.height) *
        CANVAS_HEIGHT,
    };
  };

  // ----------------------------------------------------------
  // NOTIFY PARENT
  // ----------------------------------------------------------

  const notifyParent = () => {
    if (typeof onDrawingChange === "function") {
      onDrawingChange(strokesRef.current);
    }
  };

  // ----------------------------------------------------------
  // DRAW DOT
  // ----------------------------------------------------------

  const drawDot = (point) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.save();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#b994ff";

    ctx.beginPath();

    ctx.arc(
      point.x,
      point.y,
      PEN_WIDTH / 2,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  };

  // ----------------------------------------------------------
  // DRAW LINE
  // ----------------------------------------------------------

  const drawLine = (from, to) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.save();

    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "#b994ff";
    ctx.lineWidth = PEN_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();

    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);

    ctx.stroke();

    ctx.restore();
  };

  // ----------------------------------------------------------
  // START PEN
  // ----------------------------------------------------------

  const startPen = (point) => {
    const stroke = {
      points: [point],
      width: PEN_WIDTH,
      createdAt: Date.now(),
    };

    strokesRef.current.push(stroke);

    currentStrokeRef.current = stroke;

    drawDot(point);

    notifyParent();
  };

  // ----------------------------------------------------------
  // MOVE PEN
  // ----------------------------------------------------------

  const movePen = (point) => {
    const previous = lastPointRef.current;

    if (!previous) {
      drawDot(point);
      return;
    }

    drawLine(previous, point);

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push(point);
    }
  };

  // ----------------------------------------------------------
  // ERASE
  // ----------------------------------------------------------

  const eraseAt = (point) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.save();

    /*
      destination-out physically removes the
      user's drawing.

      The guide character is NOT on this canvas,
      therefore the eraser cannot erase the guide.
    */

    ctx.globalCompositeOperation = "destination-out";

    ctx.beginPath();

    ctx.arc(
      point.x,
      point.y,
      ERASER_WIDTH / 2,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  };

  // ----------------------------------------------------------
  // SMOOTH ERASER
  // ----------------------------------------------------------

  const eraseBetween = (from, to) => {
    const distance = Math.hypot(
      to.x - from.x,
      to.y - from.y
    );

    const steps = Math.max(
      1,
      Math.ceil(distance / 5)
    );

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;

      eraseAt({
        x:
          from.x +
          (to.x - from.x) * t,

        y:
          from.y +
          (to.y - from.y) * t,
      });
    }
  };

  // ----------------------------------------------------------
  // POINTER DOWN
  // ----------------------------------------------------------

  const handlePointerDown = (event) => {
    event.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) return;

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Ignore pointer capture errors.
    }

    const point = getPoint(event);

    if (!point) return;

    isDrawingRef.current = true;

    lastPointRef.current = point;

    if (tool === "eraser") {
      eraseAt(point);
      notifyParent();
      return;
    }

    startPen(point);
  };

  // ----------------------------------------------------------
  // POINTER MOVE
  // ----------------------------------------------------------

  const handlePointerMove = (event) => {
    event.preventDefault();

    if (!isDrawingRef.current) return;

    const point = getPoint(event);

    if (!point) return;

    const previous = lastPointRef.current;

    if (tool === "eraser") {
      if (previous) {
        eraseBetween(previous, point);
      } else {
        eraseAt(point);
      }

      lastPointRef.current = point;

      notifyParent();

      return;
    }

    movePen(point);

    lastPointRef.current = point;
  };

  // ----------------------------------------------------------
  // POINTER UP
  // ----------------------------------------------------------

  const handlePointerUp = (event) => {
    event.preventDefault();

    isDrawingRef.current = false;

    lastPointRef.current = null;

    currentStrokeRef.current = null;

    notifyParent();
  };

  // ----------------------------------------------------------
  // CLEAR
  // ----------------------------------------------------------

  const clear = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    strokesRef.current = [];

    currentStrokeRef.current = null;
    lastPointRef.current = null;
    isDrawingRef.current = false;

    notifyParent();
  };

  // ----------------------------------------------------------
  // GET IMAGE
  // ----------------------------------------------------------

  const getImage = () => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    return canvas.toDataURL("image/png");
  };

  // ----------------------------------------------------------
  // HAS DRAWING
  // ----------------------------------------------------------

  const hasDrawing = () => {
    return strokesRef.current.length > 0;
  };

  // ----------------------------------------------------------
  // EXPOSE FUNCTIONS TO PRACTICE.JSX
  // ----------------------------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      clear,
      getImage,
      hasDrawing,
    }),
    []
  );

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <CanvasWrapper>

      {/* ====================================================
          FAINT TARGET GUIDE
          
          IMPORTANT:
          This is NOT drawn onto the actual canvas.
          Therefore it will NOT be sent to the model.
      ==================================================== */}

      <GuideCharacter>
        {character}
      </GuideCharacter>

      {/* ====================================================
          REAL DRAWING CANVAS
      ==================================================== */}

      <Canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        $eraser={tool === "eraser"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* ====================================================
          CLEAR BUTTON
      ==================================================== */}

      <CanvasClear
        type="button"
        onClick={clear}
      >
        Clear
      </CanvasClear>

      {/* ====================================================
          HINT
      ==================================================== */}

      <CanvasHint>
        {tool === "eraser"
          ? "Erase unwanted strokes"
          : "Write over the guide"}
      </CanvasHint>

    </CanvasWrapper>
  );
});


// ============================================================
// CANVAS WRAPPER
// ============================================================

const CanvasWrapper = styled.div`
  position: relative;

  width: 100%;

  max-width: 700px;

  height: 430px;

  margin: 0 auto;

  overflow: hidden;

  border-radius: 14px;

  background-color: #0c0820;

  background-image:
    linear-gradient(
      rgba(112, 93, 150, 0.10) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(112, 93, 150, 0.10) 1px,
      transparent 1px
    );

  background-size:
    33.333% 25%;

  border:
    1px solid
    rgba(153, 126, 203, 0.14);

  box-sizing: border-box;

  touch-action: none;

  @media (max-width: 750px) {
    height: 400px;
  }

  @media (max-width: 600px) {
    height: 340px;
  }
`;


// ============================================================
// GUIDE CHARACTER
// ============================================================

const GuideCharacter = styled.div`
  position: absolute;

  inset: 0;

  z-index: 1;

  display: flex;

  align-items: center;

  justify-content: center;

  pointer-events: none;

  user-select: none;

  color:
    rgba(
      180,
      165,
      210,
      0.17
    );

  font-size: 250px;

  font-weight: 400;

  line-height: 1;

  font-family:
    "Noto Sans CJK JP",
    "Noto Sans JP",
    "Noto Sans KR",
    "Malgun Gothic",
    "Noto Sans Devanagari",
    "Mangal",
    "Noto Sans",
    sans-serif;
`;


// ============================================================
// REAL CANVAS
// ============================================================

const Canvas = styled.canvas`
  position: absolute;

  inset: 0;

  width: 100%;

  height: 100%;

  display: block;

  z-index: 2;

  touch-action: none;

  cursor:
    ${(props) =>
      props.$eraser
        ? "cell"
        : "crosshair"};
`;


// ============================================================
// CLEAR BUTTON
// ============================================================

const CanvasClear = styled.button`
  position: absolute;

  top: 18px;

  right: 18px;

  z-index: 5;

  min-width: 78px;

  height: 42px;

  padding: 0 16px;

  border-radius: 11px;

  border:
    1px solid
    rgba(164, 135, 220, 0.25);

  background:
    rgba(18, 13, 38, 0.88);

  color: #c5bbd4;

  font-size: 13px;

  cursor: pointer;

  backdrop-filter: blur(6px);

  transition: all 0.2s ease;

  &:hover {
    color: white;

    border-color:
      rgba(164, 135, 220, 0.6);

    background:
      rgba(35, 25, 65, 0.95);
  }
`;


// ============================================================
// HINT
// ============================================================

const CanvasHint = styled.div`
  position: absolute;

  left: 14px;

  bottom: 12px;

  z-index: 5;

  padding: 7px 10px;

  border-radius: 7px;

  background:
    rgba(20, 15, 38, 0.78);

  color:
    rgba(188, 177, 204, 0.65);

  font-size: 10px;

  pointer-events: none;
`;

export default DrawingCanvas;