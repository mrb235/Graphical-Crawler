
var width = 960,
    height = 500;

//set radius of initial circle
var circleRadius = 30;

var color = d3.scale.category20();

var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

// var force = d3.layout.force()
//     .charge(-200)
//     .linkDistance(circleRadius)
//     .size([width, height]);

//get data from json file and figure out depth and associated children for each node
var jsonData = document.getElementById('graph');
var graph = JSON.parse(jsonData.getAttribute('data-json-data'));
setDepthInfo(graph);
setTotalWeight(graph);

//attach the data to each node
var nodes = svg.append('svg:g').selectAll(".node")
    .data(graph.nodes)
    // .call(force.drag);
    ;

//attach the data to each link
var links = svg.append("svg:g").selectAll("path")
    .data(graph.links)
    ;

//calculate the positions of all the links and nodes
setChildren(graph, nodes, links);

// links.enter()
//     .append("line")
//     .attr("class", "graph-link")
//     .style("stroke-width", 1.5)
//     .attr("x1", function(link) {return link.x1})
//     .attr("y1", function(link) {return link.y1})
//     .attr("x2", function(link) {return link.x2})
//     .attr("y2", function(link) {return link.y2})
//     ;

nodes.enter()
    .append("circle")
    .attr("class", "graph-node")
    .attr("r", 6)
    .attr("cx", function(node) {return node.x;})
    .attr("cy", function(node) {return node.y;})
    .style("fill", function(node) { return color(node.depth); });

//http://bl.ocks.org/d3noob/5141278
//Create the arrows
svg.append("svg:defs").selectAll("marker")
    .data(["end"])      
  .enter().append("svg:marker")    // This section adds in the arrows
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

//http://bl.ocks.org/d3noob/5141278
//attach the arrows to the links, and make the links curve
links.enter()
    .append('svg:path')
    .attr('class', 'graph-link')
    .attr('marker-end', 'url(#end)')
    .attr("d", function(link) {
        var dx = link.x2 - link.x1,
            dy = link.y2 - link.y1,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + 
            link.x1 + "," + 
            link.y1 + "A" + 
            dr + "," + dr + " 0 0,1 " + 
            link.x2 + "," + 
            link.y2;
    });

console.log(graph);
console.log(nodes);
console.log(links);

// createInitialGraph(graph);

setMouseover(nodes);

// force
//     .nodes(graph.nodes)
//     .links(graph.links)
//     .start();

// force.on("tick", function() {
//   link.attr("x1", function(node) { return node.source.x; })
//       .attr("y1", function(node) { return node.source.y; })
//       .attr("x2", function(node) { return node.target.x; })
//       .attr("y2", function(node) { return node.target.y; });

//   node.attr("cx", function(node) { return node.x; })
//       .attr("cy", function(node) { return node.y; });
// });

// function setcx(node) {
//     if()
// }

function setChildren(graph,nodes,links) {
    graph.links.forEach(function(link, linkIndex) {
        addChildNodes(graph.nodes, graph.nodes[link.source], link, linkIndex);
    });
    graph.nodes.forEach(function(node) {
        assignParentToChildren(node);
    });
    graph.nodes.forEach(function(node) {
        setWeight(node);
    });

    setInitialLocationWrapper(graph);

    graph.links.forEach(function(link) {
        setupLinks(link, graph.nodes);
    });
}

function setupLinks(link, nodes) {
    link.x1 = nodes[link.source].x;
    link.y1 = nodes[link.source].y;
    link.x2 = nodes[link.target].x;
    link.y2 = nodes[link.target].y;
}

function assignParentToChildren(node) {
    if(node.childNodes !== undefined && node.childNodes.length > 0) {
        node.childNodes.forEach(function(child) {
            if(child.depth == node.depth + 1 && child.parentNode === undefined) {
                child.parentNode = node;
                addDirectChild(node, child);
            }
        });
    }
}

function addDirectChild(parent, child) {
    if(parent.directChildren === undefined) {
        parent.directChildren = [];
    }
    parent.directChildren.push(child);
}

function setWeight(node) {
    //Only nodes at the edge with no children require this
    //All others will be hit later
    if(node.childNodes === undefined) {
        node.weight = 1;
    }
    //2 because this counts the parent itself and the node
    if(node.parentNode !== undefined){
        if( node.parentNode.weight === undefined) {
            node.parentNode.weight = 2;
        } else {
            node.parentNode.weight += 1;
        }
        setWeight(node.parentNode);
    }
}

function setInitialLocationWrapper(graph) {
    graph.depthInfo.forEach(function(value, depth) {
        graph.nodes.forEach(function(node, nodeIndex) {
            if(node.depth == depth) {
                setInitialLocation(node, nodeIndex, graph);
            }
        });
    });
}

function setInitialLocation(node, nodeIndex, graph) {
    if(node.depth == 1) {
        setRootVars(node);
    } else {
        setLocation(node, graph);
    }
    if(node.directChildren !== undefined) {
        setChildCircle(node, graph);
    }
}

function setChildCircle(node, graph) {
    var numKids = node.directChildren.length;
    var step = (node.endAngle - node.startAngle) / (node.weight - 1);
    var tempAngle = node.startAngle;

    node.directChildren.forEach(function(child) {
        child.startAngle = tempAngle;
        child.endAngle = tempAngle + (step * child.weight);
        child.angle = (child.startAngle + child.endAngle) / 2;
        tempAngle = child.endAngle;
        child.radius = (node.radius * 1.25) + circleRadius;
    });
}

function setRootVars(node) {
    node.x = width / 2;
    node.y = height / 2;
    node.startAngle = 0;
    node.endAngle = 2*Math.PI;
    node.radius = circleRadius;
}

function setLocation(node, graph) {
    //ref: http://jsfiddle.net/ThiefMaster/LPh33/4/
    node.x = Math.round(graph.root.x + node.radius * Math.cos(node.angle));
    node.y = Math.round(graph.root.y + node.radius * Math.sin(node.angle));
}

function addChildNodes(nodes, node, link, linkIndex){
    if(typeof(node.childNodes) == "undefined" || node.childNodes === null) {
        node.childNodes = [];
    }
    if(typeof(node.childLinks) == "undefined" || node.childLinks === null) {
        node.childLinks = [];
    }
    nodes[link.target].index = link.target;
    node.childNodes.push(nodes[link.target]);
    link.index = linkIndex;
    node.childLinks.push(link);
}

function setMouseover(nodes) {
    var tooltip = d3.select('body').append('div')
        .attr('class', 'graph-tooltip')
        .style('opacity',0);

    nodes.on('mouseover', function(node) {
        tooltip.transition() 
            .duration(100)
            .style('opacity', .9);
        tooltip.html(node.URL)
            .style('left', ( d3.event.pageX - 35) + 'px')
            .style('top', (d3.event.pageY - 35) + 'px')
        })
        .on('mouseout', function(node) {
            tooltip.transition()
            .duration(400)
            .style('opacity', 0)
    });
}

function setDepthInfo(graph) {
    graph.depthInfo = [];
    graph.nodes.forEach(function(node) {
        if(graph.depthInfo[node.depth] === undefined){
            graph.depthInfo[node.depth] = 1;
        } else {
            graph.depthInfo[node.depth] += 1;
        }
        if(node.depth == 1) {
            graph.root = node;
        }
    });
}

function setTotalWeight(graph) {
    graph.totalWeight = [];
    for (var i = 1; i < graph.depthInfo.length; i++) {
        graph.totalWeight[i] = 0;
        for (var j = i; j < graph.depthInfo.length; j++) {
            graph.totalWeight[i] += graph.depthInfo[j];
        }
    }
}