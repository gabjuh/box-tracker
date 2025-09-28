import { EntrancePoint, PathSegment, Room } from '@/types/map';

export class MapAnimationEngine {
  private static createSmoothPath(
    completePath: { x: number; y: number }[],
    cornerRadius = 20
  ): PathSegment[] {
    const smoothPath: PathSegment[] = [];

    for (let i = 0; i < completePath.length; i++) {
      const curr = completePath[i];
      const prev = completePath[i - 1];
      const next = completePath[i + 1];

      if (i === 0) {
        // First point - start normally
        smoothPath.push({ type: 'move', x: curr.x, y: curr.y });
      } else if (i === completePath.length - 1) {
        // Last point - end normally
        smoothPath.push({ type: 'line', x: curr.x, y: curr.y });
      } else {
        // Middle point - create curved corner
        const prevVec = { x: curr.x - prev.x, y: curr.y - prev.y };
        const nextVec = { x: next.x - curr.x, y: next.y - curr.y };

        const prevLen = Math.sqrt(prevVec.x * prevVec.x + prevVec.y * prevVec.y);
        const nextLen = Math.sqrt(nextVec.x * nextVec.x + nextVec.y * nextVec.y);

        // Normalize vectors
        prevVec.x /= prevLen;
        prevVec.y /= prevLen;
        nextVec.x /= nextLen;
        nextVec.y /= nextLen;

        // Calculate corner points
        const radius = Math.min(cornerRadius, prevLen / 2, nextLen / 2);
        const cornerStart = {
          x: curr.x - prevVec.x * radius,
          y: curr.y - prevVec.y * radius
        };
        const cornerEnd = {
          x: curr.x + nextVec.x * radius,
          y: curr.y + nextVec.y * radius
        };

        // Add line to corner start, then curve to corner end
        smoothPath.push({ type: 'line', x: cornerStart.x, y: cornerStart.y });
        smoothPath.push({
          type: 'curve',
          cpx: curr.x,
          cpy: curr.y,
          x: cornerEnd.x,
          y: cornerEnd.y
        });
      }
    }

    return smoothPath;
  }

  private static calculatePathLengths(smoothPath: PathSegment[]): number[] {
    const segmentLengths: number[] = [];

    for (let i = 1; i < smoothPath.length; i++) {
      const prev = smoothPath[i - 1];
      const curr = smoothPath[i];

      let distance = 0;
      if (curr.type === 'line') {
        distance = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        );
      } else if (curr.type === 'curve' && curr.cpx !== undefined && curr.cpy !== undefined) {
        // Approximate curve length using multiple points
        const steps = 10;
        let curveDistance = 0;
        for (let step = 0; step < steps; step++) {
          const t1 = step / steps;
          const t2 = (step + 1) / steps;

          const p1x = Math.pow(1 - t1, 2) * prev.x + 2 * (1 - t1) * t1 * curr.cpx + Math.pow(t1, 2) * curr.x;
          const p1y = Math.pow(1 - t1, 2) * prev.y + 2 * (1 - t1) * t1 * curr.cpy + Math.pow(t1, 2) * curr.y;
          const p2x = Math.pow(1 - t2, 2) * prev.x + 2 * (1 - t2) * t2 * curr.cpx + Math.pow(t2, 2) * curr.x;
          const p2y = Math.pow(1 - t2, 2) * prev.y + 2 * (1 - t2) * t2 * curr.cpy + Math.pow(t2, 2) * curr.y;

          curveDistance += Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
        }
        distance = curveDistance;
      }

      segmentLengths.push(distance);
    }

    return segmentLengths;
  }

  private static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static createPathAnimation(
    room: Room,
    entrancePoint: EntrancePoint,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mapImage: HTMLImageElement,
    animationRef: { current: { shouldStop: boolean } },
    repeatAnimation: boolean,
    onComplete: () => void
  ) {
    // Build complete path including entrance point
    const completePath = [entrancePoint, ...room.path];

    // Create smooth path with curved corners
    const smoothPath = this.createSmoothPath(completePath);

    // Calculate total path length for consistent speed
    const segmentLengths = this.calculatePathLengths(smoothPath);
    const totalDistance = segmentLengths.reduce((sum, length) => sum + length, 0);

    // Animation parameters
    const animationDuration = 2000; // 2 seconds total
    let startTime = Date.now();

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = this.easeInOut(rawProgress);
      const currentDistance = totalDistance * easedProgress;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

      // Draw the path progressively
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(entrancePoint.x, entrancePoint.y);

      // Draw the smooth path progressively
      let accumulatedDistance = 0;

      for (let i = 0; i < segmentLengths.length; i++) {
        const segmentStart = accumulatedDistance;
        const segmentEnd = accumulatedDistance + segmentLengths[i];
        const pathSegment = smoothPath[i + 1]; // +1 because smoothPath[0] is 'move'

        if (currentDistance >= segmentEnd) {
          // Complete this segment
          if (pathSegment.type === 'line') {
            ctx.lineTo(pathSegment.x, pathSegment.y);
          } else if (pathSegment.type === 'curve' && pathSegment.cpx !== undefined && pathSegment.cpy !== undefined) {
            ctx.quadraticCurveTo(pathSegment.cpx, pathSegment.cpy, pathSegment.x, pathSegment.y);
          }
        } else if (currentDistance > segmentStart) {
          // Partial segment
          const segmentProgress = (currentDistance - segmentStart) / segmentLengths[i];
          const prevSegment = smoothPath[i];

          if (pathSegment.type === 'line') {
            const currentX = prevSegment.x + (pathSegment.x - prevSegment.x) * segmentProgress;
            const currentY = prevSegment.y + (pathSegment.y - prevSegment.y) * segmentProgress;
            ctx.lineTo(currentX, currentY);
          } else if (pathSegment.type === 'curve' && pathSegment.cpx !== undefined && pathSegment.cpy !== undefined) {
            // Draw partial quadratic curve by subdividing the curve
            const t = segmentProgress;

            // Use De Casteljau's algorithm to subdivide the curve at parameter t
            const p0 = { x: prevSegment.x, y: prevSegment.y };
            const p1 = { x: pathSegment.cpx, y: pathSegment.cpy };
            const p2 = { x: pathSegment.x, y: pathSegment.y };

            // First subdivision level
            const p01 = { x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) };
            const p12 = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };

            // Second subdivision level (final point)
            const p012 = { x: p01.x + t * (p12.x - p01.x), y: p01.y + t * (p12.y - p01.y) };

            // Draw the partial curve using the subdivided control point
            ctx.quadraticCurveTo(p01.x, p01.y, p012.x, p012.y);
          }
          break;
        } else {
          break;
        }

        accumulatedDistance += segmentLengths[i];
      }

      ctx.stroke();

      // Draw entrance point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(entrancePoint.x, entrancePoint.y, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Du bist hier', entrancePoint.x, entrancePoint.y - 15);

      // Only draw the destination room point and name when animation is complete
      if (rawProgress >= 1) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(room.center.x, room.center.y, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';

        // Measure text for background sizing
        const textMetrics = ctx.measureText(room.name);
        const textWidth = textMetrics.width;
        const textHeight = 20;
        const padding = 8;

        // Draw background rectangle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
          room.center.x - textWidth / 2 - padding,
          room.center.y - 30 - textHeight / 2 - padding,
          textWidth + padding * 2,
          textHeight + padding * 2
        );

        // Draw text
        ctx.fillStyle = '#ef4444';
        ctx.fillText(room.name, room.center.x, room.center.y - 24);
      }

      if (rawProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (repeatAnimation && !animationRef.current.shouldStop) {
          // Restart animation if repeat is enabled and not stopped
          setTimeout(() => {
            if (!animationRef.current.shouldStop) {
              startTime = Date.now(); // Reset start time for new animation
              animate();
            } else {
              onComplete();
            }
          }, 500); // Brief pause before repeating
        } else {
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      }
    };

    return animate;
  }
}