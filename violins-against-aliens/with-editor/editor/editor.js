// @ts-check

class Editor {

  constructor(player, editCanvas) {
    // Data link (TODO listen for reloads etc)
    this.player = player;
    this.project = this.player.project;

    // Display/interaction target
    this.editCanvas = editCanvas;
    this.editCanvasContext = editCanvas.getContext("2d");

    // Data structure
    this.editNodeGraph = new EditorNodeGraph(editCanvas, '100%', 400); // TODO HACK magic numbers
    this.editNodeGraph.nodeWidth = 200;
    
    // Key commands - TODO load from settings file
    this.editKeyMappings = [
      { key: 'l', description: 'Reload edit canvas', handler: this.reloadEditCanvas },
      { key: 'escape', description: 'Reset modifiers', handler: this.resetEditModifiers },
      { key: 'r', description: 'Reset transform', handler: this.editNodeGraph.resetEditCanvasTransform }
    ];
    
    // Editor interaction state

    // track mouse
    this.editMousePos = { x: 0, y: 0 };
    this.editMouseMovedEnoughToNotBeClick = 5; // px
    this.editMouseMoveDistance = 0;
    
    // during dragging to connect
    this.dragStartNode = null;
    this.dragStartYOffset = 0;
    this.dragArrowColor = "white";
    
    // drag around
    this.dragMoveNode = null;
    this.dragMoveGroup = null;
    this.dragMouseOffsetInNode = null;

    // add group container
    this.dragGroupRect = null;

    this.initInteraction();
    
    this.reloadEditCanvas(); // (re)init from project.segments
    this.editNodeGraph.updateEditCanvas();
  }

  initInteraction()
  {
    this.editCanvas.onmousedown = (event) => { this.editCanvas_OnMouseDown(event); };
    this.editCanvas.onmousemove = (event) => { this.editCanvas_OnMouseMove(event); };
    this.editCanvas.onmouseup = (event) => { this.editCanvas_OnMouseUp(event); };
    this.editCanvas.ondblclick = (event) => { this.editCanvas_OnDoubleClick(event); };
    this.editCanvas.onwheel = (event) => { this.editCanvas_OnMouseWheel(event); };
    window.onkeydown = (event) => { this.editCanvas_OnKeyDown(event) }; // NOTE: listen in window, doesn't work on editCanvas!
  }

  // maybe only needed specifically in load function? (other modifications done on live graph)
  reloadEditCanvas()
  {
    this.editNodeGraph.clearNodes();
    
    for(let key in this.project.segments) {
      if(this.project.segments[key].type != 'layer') {
        this.editNodeGraph.addNode(this.project.segments[key]);
      }
    }
  }

  // TODO cache playState?
  updatePlayState(playState)
  {
    this.editNodeGraph.updateEditCanvas(null, playState);
  }

  editCanvas_OnMouseWheel(event)
  {
    // zoom factor depends only on sign of wheel
    let fac = (1 + 0.1 * Math.abs(event.deltaY)/event.deltaY);
    
    this.editNodeGraph.zoomBy(fac, event);

    event.preventDefault();
    return false; // prevent default;
  }

  editCanvas_OnKeyDown(event)
  {
    console.log(event.key);
    for(let keyMapping of this.editKeyMappings) {
      if(event.key === keyMapping.key) {
        keyMapping.handler();
      }
    }
  }

  editCanvas_OnMouseDown(event)
  {
    console.log("edit mouse down: "+event);

    this.editMouseMoveDistance = 0;

    let node = this.findNodeUnderMouse();
    let group = this.findGroupUnderMouse(this.editCanvasContext);
    if(node) {
      // first check if we drag/click from a widget in the node:
      if(node.widgets) {
        for(let widget of node.widgets) {
          if(this.isEditMouseOverRect(Util.localBounds(widget, node))) {
            if(widget.name == "next") {
              this.dragStartNode = node;
              this.dragStartYOffset = 0;
              this.dragArrowColor = (node.segment.type == "stinger" ? "yellow" : "white");
            } else if(widget.name == "outro") {
              this.dragStartNode = node;
              this.dragStartYOffset = 15
              this.dragArrowColor = "red";
            }
            // TODO handle other special drag from widgets? e.g. reverse-drag to stinger?
            return;
          }
        }
      }
      // else start dragging the node itself:
      this.dragMoveNode = node;

      this.editMousePos = this.editNodeGraph.getEditMousePos(event);
      this.dragMouseOffsetInNode = {
        x: this.editMousePos.x / this.editNodeGraph.editCanvasScale - node.x,
        y: this.editMousePos.y / this.editNodeGraph.editCanvasScale - node.y
      };
    }
    else if(group) {
      // start dragging group
      this.dragMoveGroup = group;

      this.editMousePos = this.editNodeGraph.getEditMousePos(event);
      this.dragMouseOffsetInNode = {
        x: this.editMousePos.x / this.editNodeGraph.editCanvasScale - group.x,
        y: this.editMousePos.y / this.editNodeGraph.editCanvasScale - group.y
      };
    }
    else if(event.ctrlKey) {
      // start drawing new group rect
      let startPoint = this.editNodeGraph.getEditMousePos(event);
      this.dragGroupRect = Util.scalePointBy(this.globalToLocal(startPoint), 1/this.editNodeGraph.editCanvasScale); // local
    }
  }

  editCanvas_OnMouseMove(event)
  {
    this.editMousePos = this.editNodeGraph.getEditMousePos(event);
    
    // update dangling connection arrow
    if(this.dragStartNode) {
      this.editMouseMoveDistance += (Math.abs(event.movementX) + Math.abs(event.movementY));
      // console.log("editMouseMoveDistance: " + this.editMouseMoveDistance);
    }
    // move node
    else if(this.dragMoveNode) {
      this.dragMoveNode.x = (this.editMousePos.x / this.editNodeGraph.editCanvasScale) - this.dragMouseOffsetInNode.x;
      this.dragMoveNode.y = (this.editMousePos.y / this.editNodeGraph.editCanvasScale) - this.dragMouseOffsetInNode.y;
    }
    // move group
    else if(this.dragMoveGroup) {
      let pre = { x: this.dragMoveGroup.x, y: this.dragMoveGroup.y };
      this.dragMoveGroup.x = (this.editMousePos.x / this.editNodeGraph.editCanvasScale) - this.dragMouseOffsetInNode.x;
      this.dragMoveGroup.y = (this.editMousePos.y / this.editNodeGraph.editCanvasScale) - this.dragMouseOffsetInNode.y;
      let diff = Util.subPoints({ x: this.dragMoveGroup.x, y: this.dragMoveGroup.y }, pre);
      
      // update contained node positions
      for(let node of this.dragMoveGroup.nodes) {
        node.x += diff.x;
        node.y += diff.y;
      }
    }
    else if(event.buttons > 0) {
      if(this.dragGroupRect) {
        // draw group rect
        let editCanvasLocal = this.globalToLocal(this.editMousePos);
        this.dragGroupRect.width = (editCanvasLocal.x / this.editNodeGraph.editCanvasScale) - this.dragGroupRect.x;
        this.dragGroupRect.height = (editCanvasLocal.y / this.editNodeGraph.editCanvasScale) - this.dragGroupRect.y;
      } else {
        // move canvas - TODO handle in editNodeGaph?
        this.editNodeGraph.editCanvasOffset.x += (event.movementX / this.editNodeGraph.editCanvasScale);
        this.editNodeGraph.editCanvasOffset.y += (event.movementY / this.editNodeGraph.editCanvasScale);
      }
    }

    this.editNodeGraph.updateEditCanvas(event, null, {
      dragStartNode: this.dragStartNode,
      dragGroupRect: this.dragGroupRect,
      dragStartYOffset: this.dragStartYOffset,
      dragArrowColor: this.dragArrowColor
    });
  }

  editCanvas_OnMouseUp(event)
  {
    console.log("edit mouse up");
    
    if(this.dragGroupRect) {
      this.createNodeGroup(Util.normalizeRect(this.dragGroupRect));
    }
    else if(!this.dragMoveNode) {
      if(this.editMouseMoveDistance < this.editMouseMovedEnoughToNotBeClick) {
        this.handleClick(event); // can be outside?
      } else {
        this.handleConnectDragEnd(event); // requires dragStartNode (checked in handler)
      }
    }
    
    this.resetEditModifiers();
  }

  editCanvas_OnDoubleClick(event)
  {
    let group = this.findGroupUnderMouse(this.editCanvasContext);
    if(group) {
      this.editNodeGraph.removeNodeGroup(group.name);
      this.editNodeGraph.updateEditCanvas(event);
    }
  }

  createNodeGroup(rect)
  {
    let overlappingNodes = this.editNodeGraph.nodes.filter(
      node => Util.doRectsOverlap(this.editNodeGraph.getNodeBounds(node), rect)
    );
    console.log("Group nodes: "+overlappingNodes.map(node => node.segment.name).join(","));
    this.editNodeGraph.addNodeGroup('', overlappingNodes, rect.x, rect.y, rect.width, rect.height);
  }

  handleConnectDragEnd(event)
  {
    if(!this.dragStartNode || !this.dragStartNode.segment) {
      return; // deleted
    }
    
    // find target
    let targetNode = this.findNodeUnderMouse(this.editCanvasContext);
    if(targetNode) {
      console.log("targetNode: "+targetNode.segment.name)
      let changed = false;
      
      // connect - TODO simplify allow-connection matrix?
      if(this.dragStartNode.segment.type == "stinger") {
        if(targetNode.segment.type != "stinger") {
          targetNode.segment.stinger = this.dragStartNode.segment.name;
          changed = true;
        }
      } else if(targetNode.segment.type == "outro") {
        if(this.dragStartNode.segment.type != "outro") {
          this.dragStartNode.segment.outro = targetNode.segment.name;
          changed = true;
        }
      } else if(this.dragStartNode.segment.type != "outro" && targetNode.segment.type != "stinger") {
        this.dragStartNode.segment.next = targetNode.segment.name;
        changed = true;
      }

      // update
      this.editNodeGraph.updateEditCanvas(event);
    }
  }

  handleClick(event)
  {
    console.log("edit mouse click");

    let node = this.findNodeUnderMouse(this.editCanvasContext);
    if(node) {
      if(node.widgets) {
        for(let widget of node.widgets) {
          if(this.isEditMouseOverRect(Util.localBounds(widget, node))) {
            this.handleNodeWidgetClick(node, widget.name);
            return;
          }
        }
      }
      // else:
      // TODO anything on node click? show details? (better on doubleclick?)
    }
  }

  handleNodeWidgetClick(node, widgetName)
  {
    console.log("handle node widget click: "+node.segment.name+"."+widgetName);

    switch(widgetName) {
      case "delete":
        console.log("Delete segment node "+node.segment.name+"!");
        this.deleteNode(node);
        break;
      case "stinger":
        console.log("Remove stinger link from "+node.segment.name+"!");
        this.removeLink(node, "stinger");
        break;
      case "next":
        console.log("Remove next link from "+node.segment.name+"!");
        this.removeLink(node, "next");
        break;
      case "outro":
        console.log("Remove outro link from "+node.segment.name+"!");
        this.removeLink(node, "outro");
        break;
      default:
        break;
    }
  }

  deleteNode(node)
  {
    this.editNodeGraph.removeNodeWithName(node.segment.name);
    delete this.project.segments[node.segment.name];

    // remove links in other nodes
    for(let other of this.editNodeGraph.nodes)
    {
      if(other.segment.next == node.segment.name) {
        other.segment.next = '';
      }
      if(other.segment.stinger == node.segment.name) {
        other.segment.stinger = '';
      }
      if(other.segment.outro == node.segment.name) {
        other.segment.outro = '';
      }
    }

    this.editNodeGraph.updateEditCanvas();
  }

  removeLink(node, type)
  {
    if(["next", "stinger", "outro"].indexOf(type) == -1) return; // invalid param

    node.segment[type] = '';

    this.editNodeGraph.updateEditCanvas();
  }

  resetEditModifiers()
  {
    this.dragStartNode = null;

    this.dragMoveNode = null;
    this.dragMoveGroup = null;
    
    this.dragGroupRect = null;
  }


  // Editor interaction utility
  // TODO move all this to editNodeGraph? Much use of local properties

  isEditMouseOver(editMousePos, x, y, w, h)
  {
    if((editMousePos.x / this.editNodeGraph.editCanvasScale) - this.editNodeGraph.editCanvasOffset.x > x
      && (editMousePos.x / this.editNodeGraph.editCanvasScale - this.editNodeGraph.editCanvasOffset.x) < x + w
      && (editMousePos.y / this.editNodeGraph.editCanvasScale - this.editNodeGraph.editCanvasOffset.y) > y
      && (editMousePos.y / this.editNodeGraph.editCanvasScale - this.editNodeGraph.editCanvasOffset.y) < y + h)
    {
      return true;
    } else {
      return false;
    }
  }

  isEditMouseOverRect(rect)
  {
    return this.isEditMouseOver(this.editMousePos, rect.x, rect.y, rect.width, rect.height);
  }

  // TODO generalize findObjectUnderMouse?
  findNodeUnderMouse()
  {
    for(let node of this.editNodeGraph.nodes) {
      if(this.isEditMouseOver(this.editMousePos, node.x, node.y, node.width ?? this.editNodeGraph.nodeWidth, node.height ?? this.editNodeGraph.nodeHeight)) {
        return node;
      }
    }

    return null;
  }

  findGroupUnderMouse()
  {
    for(let group of this.editNodeGraph.nodeGroups) {
      if(this.isEditMouseOver(this.editMousePos, group.x, group.y, group.width, group.height)) {
        return group;
      }
    }

    return null;
  }

  // apply editNodeGraph canvas transform
  globalToLocal(rect)
  {
    return Util.moveRectBy(rect, Util.scalePointBy(this.editNodeGraph.editCanvasOffset, -1 * this.editNodeGraph.editCanvasScale));
  }
}