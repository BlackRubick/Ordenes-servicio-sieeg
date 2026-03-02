import React, { useRef, useImperativeHandle, forwardRef } from 'react';

const SignaturePadCanvas = forwardRef(({ width = 320, height = 100, onEnd, ...props }, ref) => {
  const canvasRef = useRef();
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    clear: () => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, width, height);
    },
    isEmpty: () => {
      const ctx = canvasRef.current.getContext('2d');
      const pixels = ctx.getImageData(0, 0, width, height).data;
      return !Array.from(pixels).some((v, i) => v !== 0 && (i % 4 !== 3));
    },
    getTrimmedCanvas: () => {
      return canvasRef.current;
    }
  }));

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    };
  };

  const handleStart = (e) => {
    drawing.current = true;
    const pos = getPos(e);
    last.current = pos;
  };
  const handleEnd = (e) => {
    drawing.current = false;
    if (onEnd) onEnd();
  };
  const handleMove = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#1976F3';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ background: 'white', borderRadius: 8, boxShadow: '0 1px 4px #0001' }}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseOut={handleEnd}
      onMouseMove={handleMove}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onTouchMove={handleMove}
      {...props}
    />
  );
});

export default SignaturePadCanvas;
