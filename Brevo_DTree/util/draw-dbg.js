sap.ui.define([
		"Brevo/BrevoDtree/util/Formatter"
	],
	function (Formatter) {
		"use strict";
		return {
			drawMeasureTree: function (view) {
				var driverTree = view;
				var id = "#" + view.getView().byId("chartArea").sId;
				if (driverTree.OmeasureModel != undefined) {
					view.treeData = driverTree.OmeasureModel.oData;
				}
				try {
					if (view.variantObject.MeasureTree.length > 0)
						view.treeData = JSON.parse(view.variantObject.MeasureTree);
				} catch (e) {}
				var radius = 40;
				var width = $(id).width();
				var height = window.innerHeight;
				var i = 0,
					duration = 450,
					root, startTime;
				var tree = d3.layout.tree()
					.size([height, width])
					.separation(function (a, b) {
						return (a.parent == b.parent ? 1 : 2);
					});
				var slider = d3.scale.linear()
					.domain([1, 100])
					.range([1, 100])
					.clamp(true);

				var color1 = d3.scale.ordinal();
				var diagonal = d3.svg.diagonal()
					.projection(function (d) {
						return [d.y, d.x];
					});
				var pie = d3.layout.pie()
					.value(function (d) {

						if (isNaN(parseFloat(d)))
							return 0;
						else
							return parseFloat(d);

					})
					.sort(null);
				// arc object
				var arc = d3.svg.arc()
					.outerRadius(40)
					.innerRadius(20);
				// var id = "#" + chartArea.sId;
				d3.select(id).select("svg").remove();
				driverTree.zoomListener = d3.behavior.zoom()
					.scaleExtent([0.1, 3])
					.on("zoom", function (d) {
						zoomed(d);
					});
				var svgGroup = d3.select(id).append("svg")
					.attr("width", width)
					.attr("height", height)
					.attr("class", "tooltip")
					.call(driverTree.zoomListener);

				function zoomed(d) {
					if (driverTree.hMode)
						svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")rotate(90,50,50)");
					else
						svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
				}
				var svg = svgGroup.append("g")
					.attr("transform", function () {
						if (driverTree.hMode)
							return "translate(" + width / 2 + "," + (height / 2) / 2 + ") rotate(90,50,50)";
						else
							return "translate(" + height / 2 + "," + -width / 2 + ")";
					});

				root = view.treeData;
				root.x0 = height / 2;
				root.y0 = 0;
				var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", "0");

				function collapse(d) {
					if (d.children) {
						d._children = d.children;
						d._children.forEach(collapse);
						d.children = null;
					}
				}

				function expand(d) {
					var children = (d.children) ? d.children : d._children;
					if (d._children) {
						d.children = d._children;
						d._children = null;
					}
					if (children)
						children.forEach(expand);
				}
				view.expandTree ? expand(root) : (root.children ? root.children.forEach(collapse) : root._children.forEach(collapse));
				update(root);
				centerNode(root);
				// d3.select(self.frameElement).style("height", "800px");
				var circumference_r = 35;
				var defs = svgGroup.append('svg:defs');
				defs.append("svg:pattern")
					.attr("id", "image")
					.attr("width", "15")
					.attr("height", "15")
					.append("svg:image")
					.attr("xlink:href", jQuery.sap.getModulePath("Brevo.BrevoDtree") + '/images/Settings.png')
					.attr("width", "15")
					.attr("height", "15")
					.attr("x", 0)
					.attr("y", 0);
				var edit = svgGroup.append('svg:defs');
				edit.append("svg:pattern")
					.attr("id", "editImage")
					.attr("width", "15")
					.attr("height", "15")
					.append("svg:image")
					.attr("xlink:href", jQuery.sap.getModulePath("Brevo.BrevoDtree") + '/images/edit.png')
					.attr("width", "15")
					.attr("height", "15")
					.attr("x", 0)
					.attr("y", 0);
				var comment = svgGroup.append('svg:defs');
				comment.append("svg:pattern")
					.attr("id", "commentImage")
					.attr("width", "15")
					.attr("height", "15")
					.append("svg:image")
					.attr("xlink:href", jQuery.sap.getModulePath("Brevo.BrevoDtree") + '/images/Comment.png')
					.attr("width", "15")
					.attr("height", "15")
					.attr("x", 0)
					.attr("y", 0);

				var commentnum = svgGroup.append('svg:defs');
				commentnum.append("svg:text")
					.attr("id", "commentnum")
					.attr("width", "15")
					.attr("height", "15")
					.attr("x", 10)
					// .text("2")
					.attr("y", 0);

				function update(source) {

					var levelWidth = [1];
					var childCount = function (level, n) {

						if (n.children && n.children.length > 0) {
							if (levelWidth.length <= level + 1) levelWidth.push(0);

							levelWidth[level + 1] += n.children.length;
							n.children.forEach(function (d) {
								childCount(level + 1, d);
							});
						}
					};
					childCount(0, root);
					var newHeight = driverTree.hMode ? d3.max(levelWidth) * 25 : d3.max(levelWidth) * 163.6; // 25
					// pixels
					// per
					// line
					tree = tree.nodeSize([250, window.innerHeight]);
					driverTree.hx = (levelWidth[2]) ? ((levelWidth[1] == levelWidth[2]) ? newHeight / 1.75 : newHeight / 1.5) : (levelWidth[1] > 20 ?
						newHeight / 1.75 : newHeight / 1.5);
					// Compute the new tree layout.
					var nodes = tree.nodes(root).reverse(),
						links = tree.links(nodes);
					// Normalize for fixed-depth.
					nodes.forEach(function (d) {
						driverTree.hMode ? d.y = d.depth * 180 : d.y = d.depth * 280;
					});

					// Update the nodesâ€¦
					var node = svg.selectAll("g.node")
						.data(nodes, function (d) {
							return d.id || (d.id = ++i);
						});
					// Enter any new nodes at the parent's previous position.
					var nodeEnter = node.enter().append("g")
						.attr("id", function (d) {

							return "id" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.value_org);
						})
						.attr("class", "node")
						.attr("transform", function (d) {
							if (driverTree.hMode)
								return "translate(" + source.y0 + "," + source.x0 + ") rotate(-90)";
							else
								return "translate(" + source.y0 + "," + source.x0 + ") rotate(0)";
						})
						.on("mouseover", function (d) {
							mouseover(d);
						})
						.on("mousemove", function (d) {
							mousemove(d);
						})
						.on("mouseout", function (d) {
							mouseout(d);
						})
						.on('mousedown', function () {
							startTime = new Date();
						})
						.on('mouseup', function (d) {
							var endTime = new Date();
							driverTree.duration = endTime - startTime;
							if ((endTime - startTime) > 2000) {

							}
						});
					nodeEnter.append("rect")
						.attr("id", function (d) {
							return "rt" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.value_org);
						})
						.attr("width", "130px")
						.attr("transform", "translate(48,-37)")
						.attr("height", "75px")
						.attr("rx", "15")
						.attr("ry", "15")

					.style("fill", function (d) {
							var green = "rgba(77, 166, 77, 0.5)";
							var red = "rgba(221, 58, 66, 0.53)";
							var defaultColor = "rgba(255, 255, 255, 0.22)";
							var value = parseFloat(d.value) - parseFloat(d.value_org);
							if (value > 0 || value < 0) {
								driverTree.dragged = true;
								return value > 0 ? green : red;
							}
							/*
							 * if (value > 0) return "green"; else if (value <
							 * 0) return red;
							 */
							else return defaultColor;
						})
						.style("opacity", "0.9")
						.style("stroke",
							function (d) {
								var value = parseFloat(d.value) - parseFloat(d.value_org);
								if (value > 0 || value < 0) {
									driverTree.dragged = true;
									return value > 0 ? "green" : "red";
								}
								/*
								 * if (value > 0) return "green"; else if (value <
								 * 0) return "red";
								 */
								else return "white";
							})
						.style("stroke-width", "0");
					nodeEnter.append("rect")
						.attr("id", "settingsButton")
						.attr("width", "15px")
						.attr("transform", "translate(180,-35)")
						.attr("rx", "5")
						.attr("ry", "5")
						.attr("height", "15px")
						.style("fill", "url(#image)")
						.on("click", function (d) {
							// d.isHidden = false; // temp to acces settings
							// functionality , BCZ CONSTRUCT TREE JSON is NOt done
							if (d.isHidden === false) {
								var router = sap.ui.core.UIComponent.getRouterFor(driverTree);
								router.navTo("nodeSettings");
								var bus = sap.ui.getCore().getEventBus();
								bus.publish("treeData", "settings", {
									node: d,
									scenario: driverTree.scenarioInfo,
									varianceInfo: driverTree.varianceInfo,
									variant: driverTree.variantObject

								});
							}
						});
					nodeEnter.append("text")
						.attr("id", "addButton")
						.attr("width", "15px")
						.attr("transform", "translate(180,0)")
						.style("font", "25px sans-serif")
						.attr("height", "15px")
						.text("+")
						.on("click", function (d) {
							// d.isHidden = false; // temp to acces settings
							// functionality , BCZ CONSTRUCT TREE JSON is NOt done
							if (d.isHidden === false) {
								driverTree.addNode(d);
							}
						});
					nodeEnter.append("rect")
						.attr("id", "editButton")
						.attr("width", "15px")
						.attr("transform", "translate(180,2)")
						.attr("rx", "5")
						.attr("ry", "5")
						.attr("height", "18px")
						.style("fill", "url(#editImage)")
						.on("click", function (d) {
							// d.isHidden = false; // temp to acces settings
							// functionality , BCZ CONSTRUCT TREE JSON is NOt done
							if (d.isHidden === false) {
								driverTree.onDeletePress();
								$("svg")[0].style.width = parseInt((window.innerWidth / 100) * 73);
								driverTree.getView().byId("nodeSettings").setVisible(true);
								// driverTree.getView().byId("actionButtons").setVisible(false);
								driverTree.getView().byId("vdt").setWidth("75%");
								driverTree.nodeSettings(d);
								driverTree.setImpactMeasuresValues(d);
							}
						});
					nodeEnter.append("rect")
						.attr("id", function (d) {
							return "cmt" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.value_org);
						})
						.attr("width", "25px")
						.attr("transform", "translate(180,20)")
						.attr("rx", "5")
						.attr("ry", "5")
						.style("font", "35px sans-serif")
						.attr("height", "15px")
						.style("fill", "url(#commentImage)")
						.on("click", function (d) {
							// buttonClick(d)
							// d.isHidden = false; // temp to acces settings
							// functionality , BCZ CONSTRUCT TREE JSON is NOt done
							if (d.isHidden === false) {
								$("svg")[0].style.width = parseInt((window.innerWidth / 100) * 73);
								driverTree.getView().byId("nodeSettings").setVisible(true);
								// driverTree.getView().byId("actionButtons").setVisible(false);
								driverTree.getView().byId("vdt").setWidth("100%");
								driverTree.addComment(d);
							}
						});
					nodeEnter.append("text")
						.attr("id", function (d) {
							return "Mc" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.value_org);
						})
						// .attr("width", "25px")
						.attr("transform", "translate(195,25)")
						.attr("rx", "55")
						.attr("ry", "5")
						.text(function (d) {
							if (d.nodecomments.length) {
								return d.nodecomments.length - 1;
							}
						})
						.style("font", "10px sans-serif");
					nodeEnter.append("circle")
						.attr("r", "40")
						.on("click", click);
					nodeEnter.append("text")
						.attr("id", function (d) {
							return "ct" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.value);
						})
						.attr("x", "-8")
						.text(function (d) {

							return Formatter.amountToMillions(d.value);
						})
						.on("click", click);
					nodeEnter.append("text")
						.attr("id", "nodeSettings")
						.attr("transform", "translate(60,-25)")
						.text(function (d) {
							var title = d.title;
							if (d.title.toString().length > 15) title = d.title.slice(0, 15) + "...";
							if (d.id == "NODE1") return d.name.toString().length > 15 ? d.name.toString().slice(0, 15) + "..." : d.name;

							else return title;
						})
						.style("fill", "rgb(0, 0, 0)");
					nodeEnter.append("text")
						.attr("transform", "translate(55,-10)")
						.text(function (d) {
							return "Org Value : " + Formatter.amountToMillions(d.value_org);
						})
						.style("fill", "ligtgrey")
					nodeEnter.append("text")
						.style("fill", "ligtgrey")
						.attr("id", function (d) {
							return "cv" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.value_org);
						})
						.attr("transform", "translate(55,5)")
						.text(function (d) {
							return "Current Value : " + Formatter.amountToMillions(d.value);
						})
					nodeEnter.append("text")
						.attr("id", function (d) {
							return "dv" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.value_org);
						})
						.attr("transform", "translate(55,20)")
						.text(function (d) {
							return "Difference  " + Formatter.amountToMillions(parseFloat(d.difference));
						})
						.style("fill", function (d) {
							var value = parseFloat(d.value) - parseFloat(d.value_org);
							if (value > 0) return "green";
							else if (value < 0) return "red";
							else return "lightgrey";
						})

					nodeEnter.append("g").attr("class", "slicers");
					nodeEnter.append("g").attr("class", "lines");
					var pieNodes = nodeEnter.select(".slicers").selectAll("path")
						.data(function (d, i) {

							if (d.id == "NODE1" || (d.value == d.parent.value)) {
								var value = 0;
							} else {
								var value = d.parent.value;
							}
							value = value == 0 ? 1 : value;
							return pie([d.value, d.value_org, d.difference]);
						})

					.enter()
						.append("svg:path")
						.attr("class", "slice")
						.attr("fill", function (d, i) {
							if (i == 1) {
								if (d.data < 0) {
									var tempColor = ['#427cac', '#a1bed6', 'red'];
									return tempColor[i];
								} else {
									var tempColor = ['#427cac', '#a1bed6', 'green'];
									return tempColor[i];

								}
							} else {
								if (d.data < 0) {
									var tempColor = ['#427cac', '#a1bed6', 'red'];

									return tempColor[i];
								} else {
									var tempColor = ['#427cac', '#a1bed6', 'green'];
									return tempColor[i];

								}

							}

						})
						.each(function (d) {
							d;
						})
						.attr('d', arc);

					function mouseover(d) {
						div.transition()
							.duration(500)
							.style("opacity", 0.9)
							.style("display", "block");
					}

					function mousemove(d) {
						var name = d.name.length > 13 ? d.name.slice("0", "13") : d.name;
						div.html("<b>" + d.title + "</b><table>" +
							"<tr><td>" + name + ":</td><td>" + parseFloat(d.value).toFixed(1) + "</td></tr></table>")

						.style("left", (d3.event.pageX + 50) + "px")
							.style("top", (d3.event.pageY + 0) + "px");
					}

					function mouseout(d) {
						div.transition()
							.duration(500)
							.style("display", "none");

					}
					// Transition nodes to their new position.
					var nodeUpdate = node.transition()
						.duration(duration)
						.attr("transform", function (d) {
							if (driverTree.hMode)
								return "translate(" + d.y + "," + d.x + ") rotate(-90)";
							else
								return "translate(" + d.y + "," + d.x + ") rotate(0)";
						});
					nodeUpdate.select("circle");
					nodeUpdate.select("text");
					nodeUpdate.select("rect");
					nodeUpdate.select("foreignObject");
					// Transition exiting nodes to the parent's new position.
					var nodeExit = node.exit().transition()
						.duration(duration)
						.attr("transform", function (d) {
							if (driverTree.hMode)
								return "translate(" + source.y + "," + source.x + ") rotate(-90)";
							else
								return "translate(" + source.y + "," + source.x + ") rotate(0)";
						})
						.remove();
					nodeExit.select("circle");
					nodeExit.select("text");
					nodeExit.select("rect");
					nodeExit.select("foreignObject");
					// Update the linksâ€¦
					var link = svg.selectAll("path.link")
						.data(links, function (d) {
							return d.target.id;
						});
					// Enter any new links at the parent's previous position.
					link.enter().insert("path", "g")
						.attr("class", "link")
						.attr("stroke", function (d) {
							var value_org = parseFloat(d.target.value_org);
							var value = parseFloat(d.target.value);
							var difference = value - value_org;
							return (driverTree.simulate) ? (difference == 0 ? "#e4e0e0" : (difference < 0 ? "#e22d2d" : "#1de01d")) : "#e4e0e0";
						})
						.style("stroke", function (d) {
							var value_org = parseFloat(d.target.value_org);
							var value = parseFloat(d.target.value);
							var difference = value - value_org;
							return (driverTree.simulate) ? (difference == 0 ? "#e4e0e0" : (difference < 0 ? "#e22d2d" : "#1de01d")) : "#e4e0e0";
						})
						.attr("d", function (d) {
							var o = {
								x: source.x0,
								y: source.y0
							};
							return diagonal({
								source: o,
								target: o
							});
						});
					// Transition links to their new position.
					link.transition()
						.duration(duration)
						.attr("d", diagonal);
					// Transition exiting nodes to the parent's new position.
					link.exit().transition()
						.duration(duration)
						.attr("d", function (d) {
							var o = {
								x: source.x,
								y: source.y + 100
							};
							return diagonal({
								source: o,
								target: o
							});
						})
						.remove();
					// Stash the old positions for transition.
					nodes.forEach(function (d) {
						d.x0 = d.x;
						d.y0 = d.y;
					});
				}
				// Function to center node when clicked/dropped so node doesn't get
				// lost when collapsing/moving with large amount of children.
				function centerNode(source) {
					var scale = driverTree.zoomListener.scale();
					var x = -source.y0;
					var y = -source.x0;
					if (driverTree.hMode) {
						d3.select("g").transition()
							.duration(1)
							.attr("transform", "translate(" + driverTree.hx + "," + (height / 2) / 2 + ")scale(" + scale + ")rotate(90,50,50)");
						driverTree.zoomListener.translate([driverTree.hx, (height / 2) / 2]);
					} else {
						d3.select("g").transition()
							.duration(1)
							.attr("transform", "translate(" + height / 2 + "," + -driverTree.hx / 2 + ")scale(" + scale + ")");
						driverTree.zoomListener.translate([height / 2, -driverTree.hx / 2]);
					}
					driverTree.zoomListener.scale(scale);

				}

				// Toggle children on click.
				function click(d) {

					if (d.children) {
						d._children = d.children;
						d.children = null;
						centerNode(d)
					} else {
						d.children = d._children;
						d._children = null;
					}
					update(d);

				}
				driverTree.ValueHelpForService.close();
				$("svg")[0].style.width = window.innerWidth;
				driverTree.getView().byId("vdt").setWidth("100%");
				driverTree.getView().byId("nodeSettings").setVisible(false);
			},
			drawSegmentTree: function (view) {
				view.getView().byId("floaterSettingsVisibility").setVisible(false)
				view.getView().byId("vdtVisualise").setVisible(true);
				var driverTree = view;
				var id = "#" + view.getView().byId("chartArea").sId;
				if (view.Existing) view.segmentTreeData = view.OsegmentModel.oData;
				else view.segmentTreeData = view.segmentTreeData;
				try {
					if (view.variantObject.SegmentTree.length > 0) {
						view.segmentTreeData = JSON.parse(view.variantObject.SegmentTree);
					}
				} catch (e) {};

				var width = $(id).width();
				var height = window.innerHeight;
				var i = 0,
					duration = 450,
					root;

				var tree = d3.layout.tree()
					.size([height, width])
					.separation(function (a, b) {
						return (a.parent == b.parent ? 1 : 2);
					});
				var diagonal = d3.svg.diagonal()
					.projection(function (d) {
						return [d.y, d.x];
					});

				d3.select(id).select("svg").remove();
				driverTree.zoomListener = d3.behavior.zoom()
					.scaleExtent([0.1, 3])
					.on("zoom", function (d) {
						zoomed(d);
					});
				var svgGroup = d3.select(id).append("svg")
					.attr("width", width)
					.attr("height", height)
					.attr("class", "tooltip")
					.call(driverTree.zoomListener);

				function zoomed(d) {
					if (driverTree.hMode)
						svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")rotate(90,50,50)");
					else
						svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
				}
				var svg = svgGroup.append("g")
					.attr("transform", function () {
						if (driverTree.hMode)
							return "translate(" + width / 2 + "," + (height / 2) / 2 + ") rotate(90,50,50)";
						else
							return "translate(" + height / 2 + "," + -width / 2 + ")";
					});

				root = view.segmentTreeData;
				root.x0 = height / 2;
				root.y0 = 0;

				var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", "0");

				function collapse(d) {
					if (d.children) {
						d._children = d.children;
						d._children.forEach(collapse);
						d.children = null;
					}
				}

				function expand(d) {
					var children = (d.children) ? d.children : d._children;
					if (d._children) {
						d.children = d._children;
						d._children = null;
					}
					if (children)
						children.forEach(expand);
				}
				// this.expandTree = true;
				view.expandTree ? expand(root) : (root.children ? root.children.forEach(collapse) : root._children.forEach(collapse));
				update(root);
				centerNode(root);

				function update(source) {

					var levelWidth = [1];
					var childCount = function (level, n) {

						if (n.children && n.children.length > 0) {
							if (levelWidth.length <= level + 1) levelWidth.push(0);

							levelWidth[level + 1] += n.children.length;
							n.children.forEach(function (d) {
								childCount(level + 1, d);
							});
						}
					};
					childCount(0, root);
					var newHeight = driverTree.hMode ? d3.max(levelWidth) * 25 : d3.max(levelWidth) * 163.6; // 25
					// pixels
					// per
					// line
					tree = tree.nodeSize([200, window.innerHeight]);
					driverTree.hx = (levelWidth[2]) ? ((levelWidth[1] == levelWidth[2]) ? newHeight / 1.75 : newHeight / 1.5) : (levelWidth[1] > 20 ?
						newHeight / 1.75 : newHeight / 1.5);
					// Compute the new tree layout.
					var nodes = tree.nodes(root).reverse(),
						links = tree.links(nodes);
					// Normalize for fixed-depth.
					nodes.forEach(function (d) {
						driverTree.hMode ? d.y = d.depth * 180 : d.y = d.depth * 280;
					});

					// Update the nodesâ€¦
					var node = svg.selectAll("g.node")
						.data(nodes, function (d) {
							return d.id || (d.id = ++i);
						});
					// Enter any new nodes at the parent's previous position.
					var nodeEnter = node.enter().append("g")
						.attr("id", function (d) {
							return "id" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.Value);
						})
						.attr("class", "node")
						.attr("transform", function (d) {
							if (driverTree.hMode)
								return "translate(" + source.y0 + "," + source.x0 + ") rotate(-90)";
							else
								return "translate(" + source.y0 + "," + source.x0 + ") rotate(0)";
						});
					nodeEnter.append("rect")
						.attr("id", function (d) {
							return "st" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.id);
						})
						.attr("width", "195px")
						.attr("transform", "translate(-87,-37)")
						.attr("height", "70px")
						.attr("rx", "15")
						.attr("ry", "15")
						.style("fill", function (d) {
							if (d.selected) return "darkorange";
							else if (d.impact != undefined) {
								return Formatter.setRectanglecolor(d.impact);
							}

							return "bisque";
						})
						.style("opacity", "0.9")
						.style("stroke", function (d) {
							if (d.selected) {
								var itemPosition = "No Item";
								if (driverTree.segmentsSelected.indexOf(d.id) == -1)
									driverTree.segmentsSelected.push(d.id);
								for (var i = 0; i < driverTree.segmentItems.length; i++) {
									if (d.dtitle === driverTree.segmentItems[i].title) {
										itemPosition = i;
										break;
									}
								}
								if (d.id != "NODE1") {
									if (itemPosition === "No Item")
										driverTree.segmentItems.unshift({
											"title": d.dtitle,
											"items": [d.title]
										});
									else {
										if (driverTree.segmentItems[itemPosition].items.indexOf(d.title) === -1) driverTree.segmentItems[itemPosition].items
											.push(d.title);
									}
								}
								return "darkslateblue";
							} else return "darkslateblue";
						})
						.style("stroke-width", "2")
						.on("click", function (evt) {
							if (this.style.fill != "darkorange") {
								this.style.fill = "darkorange";
								this.style.stroke = "#ea8326";
								evt.selected = true;
								var parentNode = evt.parent;
								while (parentNode != null) {
									var itemPosition = "No Item";
									var title = "st" + parentNode.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(parentNode.id);
									$("#" + title).css("fill", "darkorange");
									$("#" + title).css("stroke", "darkslateblue");
									if (driverTree.segmentsSelected.indexOf(parentNode.id) == -1)
										driverTree.segmentsSelected.push(parentNode.id);
									for (var i = 0; i < driverTree.segmentItems.length; i++) {
										if (parentNode.dtitle === driverTree.segmentItems[i].title) {
											itemPosition = i;
											break;
										}
									}
									if (parentNode.id != "NODE1") {
										if (itemPosition === "No Item")
											driverTree.segmentItems.push({
												"title": parentNode.dtitle,
												"items": [parentNode.title],

											});
										else {
											if (driverTree.segmentItems[itemPosition].items.indexOf(parentNode.title) === -1)
												driverTree.segmentItems[itemPosition].items.push(parentNode.title);
										}
									}
									parentNode.selected = true;
									parentNode = parentNode.parent;
								}
								driverTree.segmentsSelected.push(evt.id);
								var itemPosition = "No Item";
								for (var i = 0; i < driverTree.segmentItems.length; i++) {
									if (evt.dtitle === driverTree.segmentItems[i].title) {
										itemPosition = i;
										break;
									}
								}
								if (itemPosition === "No Item")
									driverTree.segmentItems.push({
										"title": evt.dtitle,
										"items": [evt.title],

									});
								else {
									if (driverTree.segmentItems[itemPosition].items.indexOf(evt.title) === -1) driverTree.segmentItems[itemPosition].items.push(
										evt.title);
								}
								driverTree.getView().byId("vdtVisualise").setVisible(true);
							} else {
								var that = this;
								parseObject(evt);

								function parseObject(obj) {
									if (obj.hasOwnProperty("id")) {
										// driverTree.previousObjName
										// =obj.name1;
										var keyarr = [obj["id"]];
										if (driverTree.segmentsSelected.includes(keyarr[0])) {
											var title = "st" + obj.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(obj.id);
											if (obj.impact != undefined) {
												$("#" + title).css("fill", Formatter.setRectanglecolor(obj.impact));
											} else {
												$("#" + title).css("fill", "bisque");
											}

											$("#" + title).css("stroke", "darkslateblue");
											for (var b = (driverTree.segmentItems.length - 1); b >= 0; b--) {
												if (driverTree.segmentItems[b].title == obj.dtitle) {
													for (var c = (driverTree.segmentItems[b].items.length - 1); c >= 0; c--) {
														if (driverTree.segmentItems[b].items[c] == obj.title) {
															driverTree.segmentItems[b].items.splice(c, 1);
														}
													}
													if (driverTree.segmentItems[b].items.length == 0)
														driverTree.segmentItems.splice(b, 1);
												}

											}
											obj.selected = false;
										}
									}
									if (obj.hasOwnProperty("children")) {
										if (obj["children"].length > 0) {
											for (var i = 0; i < obj["children"].length; i++) {
												parseObject(obj["children"][i]);
											}
										} else {
											return;
										}
									} else {
										return;
									}
								}
								if (driverTree.segmentsSelected.length == 0)
									driverTree.getView().byId("vdtVisualise").setVisible(false);

							}
						});
					nodeEnter.append("text")
						.attr("id", function (d) {
							return "st" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.id);
						})
						.attr("transform", "translate(15,-20)")
						.on("click", onmeasureselect)
						.text(function (d) {
							return d.dtitle;
						})
						.attr("class", "textAlign")
						.style("fill", function (d) {
							if (d.selected) return "orange";
							else return "lightsteelblue";
						})
						.style("opacity", "0.9")

					.style("stroke-width", "2")

					nodeEnter.append("text")
						.attr("id", function (d) {
							return "st" + d.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(d.id);
						})
						.on("click", onmeasureselect)
						.attr("transform", "translate(-12,-5)")
						.text(function (d) {
							return d.title.toString().length > 20 ? d.title.toString().slice(0, 15) + ".." : d.title;
						})

					nodeEnter.append("text")
						.attr("transform", "translate(10,12)")
						.text(function (d) {
							if (d.percentvalue != undefined) {
								return d.percentvalue.toFixed(2) + "%";
							} else {
								return Formatter.amountToMillions(d.Value);
							}

						})
						.style("font", "13px sans-serif")
						.style("text-anchor", "middle");

					nodeEnter.append("g").attr("class", "lines");

					// Transition nodes to their new position.
					var nodeUpdate = node.transition()
						.duration(duration)
						.attr("transform", function (d) {
							if (driverTree.hMode)
								return "translate(" + d.y + "," + d.x + ") rotate(-90)";
							else
								return "translate(" + d.y + "," + d.x + ") rotate(0)";
						});
					nodeUpdate.select("text");
					nodeUpdate.select("rect");
					nodeUpdate.select("foreignObject");
					// Transition exiting nodes to the parent's new
					// position.
					var nodeExit = node.exit().transition()
						.duration(duration)
						.attr("transform", function (d) {
							if (driverTree.hMode)
								return "translate(" + source.y + "," + source.x + ") rotate(-90)";
							else
								return "translate(" + source.y + "," + source.x + ") rotate(0)";
						})
						.remove();
					nodeExit.select("text");
					nodeExit.select("rect");
					nodeExit.select("foreignObject");
					// Update the linksâ€¦
					var link = svg.selectAll("path.link")
						.data(links, function (d) {
							return d.target.id;
						});
					// Enter any new links at the parent's previous
					// position.
					link.enter().insert("path", "g")
						.attr("class", "link")
						.attr("stroke", "#e4e0e0")
						.style("stroke", "#e4e0e0")
						.attr("d", function (d) {
							var o = {
								x: source.x0,
								y: source.y0
							};
							return diagonal({
								source: o,
								target: o
							});
						});
					// Transition links to their new position.
					link.transition()
						.duration(duration)
						.attr("d", diagonal);
					// Transition exiting nodes to the parent's new
					// position.
					link.exit().transition()
						.duration(duration)
						.attr("d", function (d) {
							var o = {
								x: source.x,
								y: source.y + 100
							};
							return diagonal({
								source: o,
								target: o
							});
						})
						.remove();
					// Stash the old positions for transition.
					nodes.forEach(function (d) {
						d.x0 = d.x;
						d.y0 = d.y;
					});
				}
				// Function to center node when clicked/dropped so node doesn't
				// get lost when collapsing/moving with large amount of
				// children.
				function centerNode(source) {
					var scale = driverTree.zoomListener.scale();
					var x = -source.y0;
					var y = -source.x0;
					if (driverTree.hMode) {
						d3.select("g").transition()
							.duration(1)
							.attr("transform", "translate(" + driverTree.hx + "," + (height / 2) / 2 + ")scale(" + scale + ")rotate(90,50,50)");
						driverTree.zoomListener.translate([driverTree.hx, (height / 2) / 2]);
					} else {
						d3.select("g").transition()
							.duration(1)
							.attr("transform", "translate(" + height / 2 + "," + -driverTree.hx / 2 + ")scale(" + scale + ")");
						driverTree.zoomListener.translate([height / 2, -driverTree.hx / 2]);
					}
					driverTree.zoomListener.scale(scale);

				}

				function onmeasureselect(evt) {
					if (this.textLength !== undefined) {
						var txtid = this.id;
						var getrectId = document.getElementsByTagName("rect");
						for (var i = 0; i < getrectId.length; i++) {
							if (txtid == getrectId[i].id) {
								var a = getrectId[i];
								if (a.style.fill != "darkorange") {
									a.style.fill = "darkorange";
									a.style.stroke = "#ea8326";
									evt.selected = true;
									var parentNode = evt.parent;
									while (parentNode != null) {
										var itemPosition = "No Item";
										var title = "st" + parentNode.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(parentNode.id);
										$("#" + title).css("fill", "darkorange");
										$("#" + title).css("stroke", "darkslateblue");
										if (driverTree.segmentsSelected.indexOf(parentNode.id) == -1)
											driverTree.segmentsSelected.push(parentNode.id);
										for (var i = 0; i < driverTree.segmentItems.length; i++) {
											if (parentNode.dtitle === driverTree.segmentItems[i].title) {
												itemPosition = i;
												break;
											}
										}
										if (parentNode.id != "NODE1") {
											if (itemPosition === "No Item")
												driverTree.segmentItems.push({
													"title": parentNode.dtitle,
													"items": [parentNode.title]
												});
											else {
												if (driverTree.segmentItems[itemPosition].items.indexOf(parentNode.title) === -1) driverTree.segmentItems[itemPosition].items
													.push(parentNode.title);
											}
										}
										parentNode.selected = true;
										parentNode = parentNode.parent;
									}
									driverTree.segmentsSelected.push(evt.id);
									var itemPosition = "No Item";
									for (var i = 0; i < driverTree.segmentItems.length; i++) {
										if (evt.dtitle === driverTree.segmentItems[i].title) {
											itemPosition = i;
											break;
										}
									}
									if (itemPosition === "No Item")
										driverTree.segmentItems.push({
											"title": evt.dtitle,
											"items": [evt.title]

										});
									else {
										if (driverTree.segmentItems[itemPosition].items.indexOf(evt.title) === -1) driverTree.segmentItems[itemPosition].items.push(
											evt.title);
									}
									driverTree.getView().byId("vdtVisualise").setVisible(true);
								} else {
									var that = this;
									parseObject(evt);

									function parseObject(obj) {
										if (obj.hasOwnProperty("id")) {
											// driverTree.previousObjName
											// =obj.name1;
											var keyarr = [obj["id"]];
											if (driverTree.segmentsSelected.includes(keyarr[0])) {
												var title = "st" + obj.title.toString().replace(/[^A-Z0-9]+/ig, "") + parseInt(obj.id);
												/*$("#" + title).css("fill", "lightsteelblue");*/
												if (obj.impact != undefined) {
													$("#" + title).css("fill", Formatter.setRectanglecolor(obj.impact));
												} else {
													$("#" + title).css("fill", "bisque");
												}
												$("#" + title).css("stroke", "darkslateblue");
												for (var b = (driverTree.segmentItems.length - 1); b >= 0; b--) {
													if (driverTree.segmentItems[b].title == obj.dtitle) {
														for (var c = (driverTree.segmentItems[b].items.length - 1); c >= 0; c--) {
															if (driverTree.segmentItems[b].items[c] == obj.title) {
																driverTree.segmentItems[b].items.splice(c, 1);
															}
														}
														if (driverTree.segmentItems[b].items.length == 0)
															driverTree.segmentItems.splice(b, 1)
													}

												}

												obj.selected = false;
											}
										}
										if (obj.hasOwnProperty("children")) {
											if (obj["children"].length > 0) {
												for (var i = 0; i < obj["children"].length; i++) {
													parseObject(obj["children"][i]);
												}
											} else {
												return;
											}
										} else {
											return;
										}
									}
									if (driverTree.segmentsSelected.length == 0)
										driverTree.getView().byId("vdtVisualise").setVisible(false);
								}
								break;
							}
						}

					}

				}

				driverTree.ValueHelpForService.close();
			}
		};
	});