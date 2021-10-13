// Geometry utility
class Util {
  static addPoints(p1, p2)
  {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
  }

  static subPoints(p1, p2)
  {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
  }

  static scalePointBy(p, fac)
  {
    return { x: p.x * fac, y: p.y * fac }
  }

  static moveRectBy(rect, vector)
  {
    return {
      x: rect.x + vector.x,
      y: rect.y + vector.y,
      width: rect.width,
      height: rect.height,
      // additional values for widgets
      left: rect.left,
      right: rect.right
    };
  }

  static normalizeRect(rect)
  {
    return {
      x: rect.width > 0 ? rect.x : rect.x + rect.width,
      y: rect.height > 0? rect.y : rect.y + rect.height,
      width: Math.abs(rect.width),
      height: Math.abs(rect.height)
    };
  }

  static doRectsOverlap(rect1, rect2)
  {
    if(rect2.x < (rect1.x + rect1.width)
      && rect1.x < (rect2.x + rect2.width)
      && rect2.y < (rect1.y + rect1.height)
      && rect1.y < (rect2.y + rect2.height))
    {
      return true;
    } else {
      return false;
    }
  }

  static localBounds(widget, relativeTo)
  {
    return this.moveRectBy(widget.bounds, { x: relativeTo.x, y: relativeTo.y });
  }
}