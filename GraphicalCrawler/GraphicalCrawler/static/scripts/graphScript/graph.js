
var width = 960,
    height = 500;

var color = d3.scale.category20();

var force = d3.layout.force()
    .charge(-200)
    .linkDistance(60)
    .size([width, height]);

var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

d3.json("/static/scripts/graphScript/fakeSiteData.json", function(error, graph) {
  if (error) throw error;

  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

  var link = svg.selectAll(".link")
      .data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", 1.5);

  var node = svg.selectAll(".node")
      .data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 6)
      .style("fill", function(d) { return color(d.depth); })
      .call(force.drag);
  

  // node.append("svg:title")
  //     .text(function(d) { return d.URL; });

  //add tooltip variable
  var tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity',0);

  //make tooltip showup upon mouseover of 
  node.on('mouseover', function(d) {
    tooltip.transition() 
      .duration(100)
      .style('opacity', .9);
    tooltip.html(d.URL)
      .style('left', ( d3.event.pageX - 35) + 'px')
      .style('top', (d3.event.pageY - 35) + 'px')
    })
    .on('mouseout', function(d) {
      tooltip.transition()
        .duration(400)
        .style('opacity', 0)
    });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });

});
