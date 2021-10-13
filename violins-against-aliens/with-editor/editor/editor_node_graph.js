// NOTE: currently, connections (next, stinger, outro) between nodes
//       are implicitly derived from segments
class EditorNodeGraph {
  constructor(editCanvas, width, height, backgroundColor) {
    this.editCanvas = editCanvas;
    this.editCanvasContext = this.editCanvas.getContext("2d");

    this.width = width;
    if(width == -1) {
      this.fitWidth = true;
    } else {
      this.fitWidth = false;
    }
    
    this.height = height; // -1: fit contents;
    if(height == -1) {
      this.fitHeight = true;
    } else {
      this.fitHeight = false;
    }

    // some default values
    this.margin = 30;
    this.nodeWidth = 300;
    this.nodeHeight = 50;
    this.nodeOffset = 50;

    this.backgroundColor = backgroundColor ?? "#000000"

    // default state
    this.nodes = [];
    this.nodeGroups = [];

    this.editCanvasScale = 1;
    this.editCanvasOffset = { x: 0, y: 0 };

    // callbacks
    window.onresize = () => { this.updateEditCanvas(); };
  }

  // Data structure

  clearNodes()
  {
    this.nodes = [];
    this.nodeGroups = [];
  }

  addNode(segment, x, y)
  {
    // TODO should name be unique? or use a unique id to allow multiple nodes/segments with same name?
    if(!this.getNodeByName(segment.name)) {
      let node = new EditorNode(segment, x ?? this.getXForNewSegmentType(segment.type), y ?? this.getYForNewSegmentType(segment.type));
      this.nodes.push(node);
      console.log("Added node for segment "+segment.name+" at ("+node.x+","+node.y+")");

      return node;
    }
  }

  removeNodeWithName(name)
  {
    let node = this.getNodeByName(name);
    if(node) {
      this.nodes.splice(this.nodes.indexOf(node), 1);
      console.log("Removed node for segment: "+name);
    }
  }

  
  getNodeByName(name)
  {
    for(let node of this.nodes) {
      if(node.segment.name == name) {
        return node;
      }
    }
    
    return null;
  }
  
  getXForNewSegmentType(type)
  {
    let maxX = this.margin;
    for(let node of this.nodes) {
      if(node.segment.type == type && (node.x + this.nodeWidth > maxX)) {
        maxX = node.x + (node.width ?? this.nodeWidth) + this.nodeOffset;
      }
    }
  
    return maxX;
  }
  
  getYForNewSegmentType(type)
  {
    switch(type) {
      case 'stinger':
        return this.margin;
        break;
      case 'outro':
        return this.margin + 2*(this.nodeHeight + this.nodeOffset);
        break;
      default:
        return this.margin + 1*(this.nodeHeight + this.nodeOffset);
        break;
    }
  }

  getNodeBounds(node)
  {
    return {
      x: node.x,
      y: node.y,
      width: node.width ?? this.nodeWidth,
      height: node.height ?? this.nodeHeight
    }
  }

  // Groups
  
  // TODO prevent overlap? nest?
  addNodeGroup(name, nodes, x, y, width, height)
  {
    if(!name || name == "") {
      name = this.getUniqueName("group");
    }

    let newGroup = new EditorNodeGroup(name, nodes, x, y, width, height);
    this.nodeGroups.push(newGroup);

    return newGroup;
  }
    
  getNodeGroupByName(name)
  {
    for(let nodeGroup of this.nodeGroups) {
      if(nodeGroup.name == name) {
        return nodeGroup;
      }
    }
    
    return null;
  }
  
  removeNodeGroup(name)
  {
    let nodeGroup = this.getNodeGroupByName(name);
    if(nodeGroup) {
      this.nodeGroups.splice(this.nodeGroups.indexOf(nodeGroup), 1);
    }
  }

  // Display

  // TODO move canvas into nodegraph? or separate visualization graph class?
  updateEditCanvas(evt=null, playingState=null, editState=null)
  {
    CanvasUtil.setCanvasSize(this.editCanvas, '100%', 400); // TODO HACK magic numbers, make resizeable
    CanvasUtil.clearCanvas(this.editCanvasContext, this.backgroundColor);

    let editMousePos = this.getEditMousePos(evt);

    this.editCanvasContext.scale(this.editCanvasScale, this.editCanvasScale);
    this.editCanvasContext.translate(this.editCanvasOffset.x, this.editCanvasOffset.y);

    // TODO HACK - just see if this works to separate the lines. More intelligent resolution solution needed later
    let lineLanes = {
      stinger: this.nodeHeight - 6,
      segment: this.nodeHeight - 6,
      outro: this.nodeHeight + 3
    }

    // groups // TODO make draggable etc.
    for(let nodeGroup of this.nodeGroups)
    {
      this.drawGroupRect(nodeGroup, true);
    }

    // draw nodes and connections
    for(let node of this.nodes) {
      // default state
      let percentage = -1;
      let active = this.isEditMouseOver(editMousePos, node.x, node.y, node.width ?? this.nodeWidth, node.height ?? this.nodeHeight);
      let flashing = false;

      // inject play state
      if(playingState && playingState.isPlaying) {
        let index = playingState.currentSegments.indexOf(node.segment);
        if(index > -1) {
          active = true;
          percentage = playingState.percentages[index];
        } else if(node.segment === playingState.nextQueuedSegment) {
          active = true;
          flashing = true;
        }
      }

      // segment node
      let nodeWidth = node.width ?? this.nodeWidth;
      let nodeHeight = node.height ?? this.nodeHeight;
      CanvasUtil.drawSegment(this.editCanvasContext, node.segment, percentage, node.x, node.y, nodeWidth, nodeHeight, true, active, flashing);
      
      // TODO Init on node create?
      // TODO lots of magic numbers
      if(!node.widgets) {
        node.widgets = [];
        node.widgets.push({ name: "delete", label: "x", bounds: { x: nodeWidth - 15, y: 3, width: 12, height: 12 } });
        if(node.segment.type != "stinger") {
          node.widgets.push({ name: "stinger", label: "s", bounds: { x: 1, y: 5, width: 12, height: 12, left: true } });
        }
        if(node.segment.type != "outro") {
          node.widgets.push({ name: "next", label: "n", bounds: { x: nodeWidth - 13, y: -6 + 0.5*nodeHeight, width: 12, height: 12, right: true } });
        }
        if(["stinger", "outro"].indexOf(node.segment.type) == -1) {
          node.widgets.push({ name: "outro", label: "o", bounds: { x: nodeWidth - 13, y: -15 + nodeHeight, width: 12, height: 12, right: true } });
        }
      }

      for(let widget of node.widgets) {
        let globalWidgetBounds = Util.localBounds(widget, node);
        let mouseOverWidget = this.isEditMouseOver(editMousePos, globalWidgetBounds.x, globalWidgetBounds.y, globalWidgetBounds.width, globalWidgetBounds.height);
        let fontColor = mouseOverWidget ? "#ffffff" : "#cccccc";
        this.drawButton(this.editCanvasContext, globalWidgetBounds, widget.label, 10, fontColor);
      }

      // connections
      if(node.segment.stinger) {
        let stingerNode = this.getNodeByName(node.segment.stinger);
        if(stingerNode) {
          this.drawNodeConnection(this.editCanvasContext, stingerNode, node, "yellow", lineLanes.stinger);
          lineLanes.stinger += 3;
        }
      }
      
      if(node.segment.next) {
        let nextNode = this.getNodeByName(node.segment.next);
        if(nextNode) {
          this.drawNodeConnection(this.editCanvasContext, node, nextNode, "white", lineLanes.segment);
          lineLanes.segment += 3;
        }
      }
      
      if(node.segment.outro) {
        let outroNode = this.getNodeByName(node.segment.outro);
        if(outroNode) {
          this.drawNodeConnection(this.editCanvasContext, node, outroNode, "red", lineLanes.outro);
          lineLanes.outro += 3;
        }
      }
    }

    // draw current dragging interaction
    if(editState && editState.dragStartNode) {
      let startX = (editState.dragStartNode.x + this.nodeWidth);
      let startY = editState.dragStartNode.y + (0.5*(editState.dragStartNode.height ?? this.nodeHeight)) + editState.dragStartYOffset;
      let endX = editMousePos.x;
      let endY = editMousePos.y;
      
      this.editCanvasContext.globalAlpha = 0.5;
      CanvasUtil.drawArrow(this.editCanvasContext, startX, startY, endX, endY, editState.dragArrowColor, false, 10, this.nodeHeight);
      this.editCanvasContext.globalAlpha = 1;
    }

    // draw current group rect, if in process
    if(editState && editState.dragGroupRect) {
      this.drawGroupRect(editState.dragGroupRect, true);
    }
  }

  drawGroupRect(bounds, active)
  {
    let normalizedRect = Util.normalizeRect(bounds);
    
    this.editCanvasContext.fillStyle = "#003f7f";
    this.editCanvasContext.strokeStyle = "#007fff";
    this.editCanvasContext.globalAlpha = 0.5;
    CanvasUtil.roundRect(this.editCanvasContext, normalizedRect.x, normalizedRect.y, normalizedRect.width, normalizedRect.height, 10, active);
    this.editCanvasContext.globalAlpha = 1;
  }

  drawNodeConnection(ctx, node1, node2, color, dodgeDistance)
  {
    let startX = (node1.x + this.nodeWidth);
    let startY = node1.y + (0.5*(node1.height ?? this.nodeHeight)) + (node2.segment.type == "outro" ? 15 : 0); // TODO centralize type offsets
    let endX = node2.x;
    let endY = node2.y + (0.5*(node2.height ?? this.nodeHeight)) + (node1.segment.type == "stinger" ? -15 : 0); // TODO same
    
    // TODO dodge nodes in the middle?
    CanvasUtil.drawArrow(ctx, startX, startY, endX, endY, color ?? "white", false, 10, dodgeDistance ?? this.nodeHeight);
  }

  drawButton(ctx, bounds, text, fontSize, fontColor)
  {
    let color_bg = "#99bb00";
    let color_foreground = "#bbff00";
    fontColor = fontColor ?? "#ffffff";
    fontSize = fontSize ?? 12;

    // background
    ctx.fillStyle = color_bg;
    ctx.strokeStyle = color_foreground;
    CanvasUtil.roundRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 5, true, bounds.left, bounds.right);
    
    // text
    ctx.strokeStyle = fontColor;
    ctx.fillStyle = fontColor;
    ctx.font = fontSize + "px Orbitron";
    ctx.fillText(text, bounds.x + fontSize/4, bounds.y + fontSize*0.9);
  }

  zoomBy(factor, mouseEvent)
  {
    // update scale
    this.editCanvasScale *= factor;
    
    // keep zoom centered on mouse
    let mousePosition = mouseEvent ? this.getEditMousePos(mouseEvent) : { x: 0, y: 0 };
    let mousePosDiff = Util.scalePointBy(mousePosition, (1 - factor)/this.editCanvasScale);
    this.editCanvasOffset = Util.addPoints(this.editCanvasOffset, mousePosDiff);

    // console.log(editCanvasScale);
    this.updateEditCanvas(mouseEvent);
  }

  resetEditCanvasTransform()
  {
    this.editCanvasScale = 1;
    this.editCanvasOffset = { x: 0, y: 0 };
    this.updateEditCanvas();
  }

  // Util

  getUniqueName(prefix)
  {
    let count = 1;
    if(prefix == "group") {
      while(this.getNodeGroupByName(prefix + count)) {
        count++;
      }
      return prefix + count;
    }
  }

  getEditMousePos(event)
  {
    if(!event) return { x: 0, y: 0 };

    let rect = this.editCanvas.getBoundingClientRect();
    return { x: event.clientX - rect.x, y: event.clientY - rect.y };
  }

  // TODO duplicate from editor.js, can one be removed? (needed here for highlighting)
  isEditMouseOver(editMousePos, x, y, w, h)
  {
    if(!editMousePos) return false;

    if((editMousePos.x / this.editCanvasScale) - this.editCanvasOffset.x > x
      && (editMousePos.x / this.editCanvasScale - this.editCanvasOffset.x) < x + w
      && (editMousePos.y / this.editCanvasScale - this.editCanvasOffset.y) > y
      && (editMousePos.y / this.editCanvasScale - this.editCanvasOffset.y) < y + h)
    {
      return true;
    } else {
      return false;
    }
  }
}
  
class EditorNode {
  constructor(segment, x, y)
  {
    this.segment = segment;

    this.x = x ?? 0;
    this.y = y ?? 0;
  }
}

class EditorNodeGroup {
  constructor(name, nodes, x, y, width, height)
  {
    this.name = name;
    this.nodes = nodes ?? [];
    
    // TODO should be initialized/updated with bounds of contained nodes?
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.width = width ?? 0;
    this.height = height ?? 0;
  }

  addNode(node)
  {
    if(this.nodes.indexOf(node) == -1)
    {
      this.nodes.push(node);
    }
  }
  
  removeNode(node)
  {
    if(this.nodes.indexOf(node) > -1)
    {
      this.nodes.splice(this.nodes.indexOf(node), 1);
    }
  }
}