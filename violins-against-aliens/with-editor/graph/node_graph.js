// NOTE: currently, connections (next, stinger, outro) between nodes
//       are implicitly derived from segments
class NodeGraph {
  constructor(width, height, backgroundColor) {
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

    // some defaults
    this.margin = 30;
    this.nodeWidth = 300;
    this.nodeHeight = 50;
    this.nodeOffset = 50;

    this.backgroundColor = backgroundColor ?? "#000000"

    // default state
    this.nodes = [];
  }

  clearNodes()
  {
    this.nodes = [];
  }

  addNode(segment, x, y)
  {
    // TODO should name be unique? or use a unique id to allow multiple nodes/segments with same name?
    if(!this.getNodeByName(segment.name)) {
      let node = new Node(segment, x ?? this.getXForNewSegmentType(segment.type), y ?? this.getYForNewSegmentType(segment.type));
      this.nodes.push(node);
      console.log("Added node for segment "+segment.name+" at ("+node.x+","+node.y+")");
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
}

class Node {
  constructor(segment, x, y)
  {
    this.segment = segment;

    this.x = x ?? 0;
    this.y = y ?? 0;
  }
}