class CanvasUtil {
  
  static setCanvasSize(canvas, width, height)
  {
    canvas.style.width = width;
    canvas.style.height = height;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  static clearCanvas(ctx, clearColor="#003F00")
  {
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  }

  // TODO make only as wide/high as name/contents require?
  static drawSegment(ctx, segment, percentage, x, y, w, h, enabled, active, flashing)
  {
    if(!segment) {
      console.log("ERROR: Can't draw undefined segment!");
      return;
    }

    // defaults
    if(!x) x = 0;
    if(!y) y = 0;
    if(!w) w = 400;
    if(!h) h = 50;

    // colors
    let color_bg = "#AAAAAA"
    let color_foreground = "#007F00"
    
    if(active) { // active?
      color_bg = "#FFFFFF";
      color_foreground = "#009F00";
    }
    
    // background
    ctx.fillStyle = color_bg;
    ctx.strokeStyle = color_foreground;
    this.roundRect(ctx, x, y, w, h, 10, true);
    
    if(flashing) {
      let flashValue = 127*(Math.sin(new Date().getMilliseconds() * 0.005) + 1);
      flashValue = parseInt(flashValue.toFixed(0)).toString(16);
      while(flashValue.length < 2) flashValue = "0" + flashValue;
      let color_flashing = "#00FF00" + flashValue;
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = color_flashing;
      this.roundRect(ctx, x, y, w, h, 10, false);
    }

    // foreground
    ctx.strokeStyle = color_foreground;
    ctx.fillStyle = color_foreground;

    // TODO draw bars? (position cached)

    // cursor
    if(percentage != -1) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + percentage * w, y);
      ctx.lineTo(x + percentage * w, y + h);
      ctx.stroke();
    }
    
    // show name
    ctx.font = "12pt Orbitron";
    ctx.fillText(segment.name.replace("_master", ""), x + 10, y + (h * 0.4));
  }

  static drawArrow(ctx, x1, y1, x2, y2, color, nohead, minDistForStraight=0, dodgeHeight=0)
  {
    ctx.strokeStyle = color;
    ctx.fillStyle = color; // for head
    
    // line
    ctx.lineWidth = 2;
    if(x2-x1 > minDistForStraight) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      let middleX = x1 + (x2-x1)/2;
      ctx.bezierCurveTo(middleX, y1, middleX, y2, x2 - (nohead ? 0 : 10), y2);
      // ctx.lineTo(x2 - 10, y2);
      ctx.stroke();
    } else { // wrap around
      let dodgeDirection = y2 >= y1 ? 1 : -1;
      let c1 = { x: x1 + dodgeHeight/2, y: y1 };
      let c2 = { x: x1 + dodgeHeight/2, y: y1 + dodgeHeight*dodgeDirection };
      let aux1 = { x: x1, y: y1 + dodgeHeight*dodgeDirection };
      let aux2 = { x: x2, y: y1 + dodgeHeight*dodgeDirection };
      let c3 = { x: x2 - Math.abs(y2 - aux2.y)/2, y: y1 + dodgeHeight*dodgeDirection };
      let c4 = { x: x2 - Math.abs(y2 - aux2.y)/2, y: y2 };

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, aux1.x, aux1.y);
      ctx.lineTo(aux2.x, aux2.y);
      ctx.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, x2 - (nohead ? 0 : 10), y2);
      ctx.stroke();
    }
    
    // head?
    if(!nohead) {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10, y2 - 5);
      ctx.lineTo(x2 - 10, y2 + 5);
      ctx.lineTo(x2, y2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Util
  static roundRect(ctx, x, y, w, h, r, filled, left, right) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    
    let rl = left ? 0 : r;
    let rr = right ? 0 : r;

    ctx.beginPath();
    ctx.moveTo(x+rl, y);
    ctx.arcTo(x+w, y,   x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x,   y+h, rr);
    ctx.arcTo(x,   y+h, x,   y,   rl);
    ctx.arcTo(x,   y,   x+w, y,   rl);
    ctx.closePath();
    if(filled) ctx.fill();
    ctx.stroke();
    return ctx;
  }
}