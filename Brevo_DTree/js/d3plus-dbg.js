var d3plus = {};

d3plus.textwrap = function() {
    
    var _resize = false;            // Should the text be resized in the container?
    var _wrap = false;              // Should the text be wrapped in the container?
    var _textElement;               // Represents the text element that will have the wrapping applied

    var _x;                         // The offset x-position
    var _y;                         // The offset y-position
    var _width;                     // The maximum width that should be afforded for text rendering
    var _height;                    // The maximum height that should be afforded for text rendering
    


    var _alignment = "center";
    
    
    var _rotate = 0;
    
    var _size;
    
    var _valign = null;
    
    var _innerHeight;
    var _innerWidth;
    
    var _padding = null;
    
    

    // Calculates the sizes of the words that we need to render when put into SVG
    function fontSizes(vars, maxSize) {

        var sizes = [];
        var svg = d3.select("body").append("svg");

        // Create some spans such that we can work out the length of the various words
        var tspans = svg.append("text")
            .selectAll("tspan")
            .data(vars.words)
            .enter()
            .append("tspan")
            .attr("left", "0px")
            .attr("position", "absolute")
            .attr("top", "0px")
            .attr("x", 0)
            .attr("y", 0)
            .style("font-size", maxSize + "px")
            .text(function(d) {
                return d;
            })
            .each(function(d) {
              
                var width = this.getComputedTextLength();   
                var height = this.offsetHeight || this.getBoundingClientRect().height || this.parentNode.getBBox().height;
                          
                var children = d3.select(this).selectAll("tspan");
                if (children.size()) {
                    alert("didn't expect to get here");
                } 
                
                return sizes.push({
                    height: height,
                    width: width,
                    text: d
                });
            });

        tspans.remove();
        svg.remove();
        return sizes;
    }

    /// Parse some basic sizing properties from the elements that we are dealing with
    /// @params {Object} vars - An object that contains all the settings that we've determined so far
    function parse(vars) {
      
        // Determine the position of the element
        vars.container.x = _x || parseFloat(vars.element.attr("x"), 10) || 0;
        vars.container.y = _y || parseFloat(vars.element.attr("y"), 10) || 0;

        if (vars.shape === "rect") {

            var x = parseFloat(vars.container.attr("x"), 10) || 0;
            var y = parseFloat(vars.container.attr("y"), 10) || 0;
            var width = parseFloat(vars.container.attr("width") || vars.container.style("width"), 10);
            var height = parseFloat(vars.container.attr("height") || vars.container.style("height"), 10);
            var diff = Math.abs(x - vars.container.x);

        } else if (vars.shape === "circle") {

            var x = parseFloat(vars.container.attr("cx"), 10) || 0;
            var y = parseFloat(vars.container.attr("cy"), 10) || 0;
            var diff = Math.abs(x - vars.container.x);
            var r = parseFloat(vars.container.attr("r"), 10) || 0;
            var width = r * 2;
            var height = width;
            x -= r;
            y -= r;

        }

        vars.x = _x || x;
        vars.y = _y || y;
        vars.padding = _padding || diff;
        vars.height = _height || height;
        vars.width = _width || width;
        vars.innerHeight = vars.height - (2 * _padding);
        vars.innerWidth = vars.width - (2 * _padding);
        vars.rotate = _rotate;

        // Work out the initial font size
        vars.fontSize = parseFloat(vars.element.attr("font-size") || vars.element.style("font-size"), 10);
        vars.container.dy = parseFloat(vars.element.attr("dy"), 10);
        vars.size = _size || _resize ? [4, 80] : [vars.fontSize / 2, vars.fontSize]; // Use a really small size if resizing, or the font-size if only wrapping

        // Apply any required padding
        if (_padding) {
            vars.container.x = x + _padding;
            vars.container.y = y + _padding;
        }
    }

    function resize(vars) {
      
        // Add some additional padding onto the strings
        for (var i = 0; i < vars.words.length - 1; i++) {
            vars.words[i] = vars.words[i] + " ";
        }

        var sizeMax = Math.floor(vars.size[1]);
        var lineWidth = vars.shape === "circle" ? vars.width * 0.75 : vars.width;
        var sizes = fontSizes(vars, sizeMax);
        var maxWidth = d3.max(sizes, function(d) {
            return d.width;
        });

        // Calculate the required area for rendering text
        var areaMod = 1.165 + (vars.width / vars.height * 0.11);
        var textArea = d3.sum(sizes, function(d) {
            h = vars.dy || sizeMax * 1.2;
            return d.width * h;
        }) * areaMod;

        // Calculate the avaliable area
        if (vars.shape === "circle") {
            var boxArea = Math.PI * Math.pow(vars.width / 2, 2);
        } else {
            var boxArea = lineWidth * vars.height;
        }

        // Calculate re-sizing ratios
        if (maxWidth > lineWidth || textArea > boxArea) {
            var areaRatio = Math.sqrt(boxArea / textArea);
            var widthRatio = lineWidth / maxWidth;
            var sizeRatio = d3.min([areaRatio, widthRatio]);
            var sizeMax = d3.max([vars.size[0], Math.floor(sizeMax * sizeRatio)]);
        }

        // Calculate max heights
        var heightMax = Math.floor(vars.height * 0.8);
        if (sizeMax > heightMax) {
            sizeMax = heightMax;
        }

        if (maxWidth * (sizeMax / vars.size[1]) <= lineWidth) {
            if (sizeMax !== vars.size[1]) {
                vars.size = [vars.size[0], sizeMax];
            }
            flow(vars);
        } else {
            //wrap(vars);
        }
    }

    function flow(vars) {
        var dx;
        var vAlign = _valign || "top";
        var anchor;
        var yOffset = 0;
        var fontSize = _resize ? vars.size[1] : vars.fontSize || vars.size[0];
        var dy = vars.container.dy || fontSize * 1.1;
        var x = vars.container.x;
        var dx = vars.container.dx || 0;
        var height = vars.innerHeight;
        var width = vars.innerWidth;
        var textBox;
        var reverse = false;

        var newLine = function(word, first) {
            if (!word) {
                word = "";
            }

            return vars.element
                .append("tspan")
                .attr("x", x + "px")
                .attr("dx", dx + "px")
                .attr("dy", dy + "px")
                .style("baseline-shift", "0%")
                .attr("dominant-baseline", "alphabetic")
                .text(word);
        };



        // Determine the text alignment
        if (vars.shape === "circle") {
            anchor = "middle";
            if (vAlign === "middle") {
                yOffset = ((height / dy % 1) * dy) / 2;
            } else if(vAlign === "end") {
                yOffset = (height / dy % 1) * dy;
            }
        } else {
            anchor = vars.align || vars.container.align || "start";
        }

        // Set up the text anchoring
        vars.element.attr("text-anchor", anchor)
                      .attr("font-size", fontSize + "px")
                      .style("font-size", fontSize + "px")
                      .attr("x", vars.container.x)
                      .attr("y", vars.container.y);

        // Define the dx attribute
        switch (anchor) {
            case "middle":
                dx = vars.width / 2;
                break;
            case "end":
                dx = vars.width;
                break;
            default:
                dx = 0;
                break;
        }


        vars.container.attr("text-anchor", anchor)
            .attr("font-size", fontSize + "px")
            .attr("x", vars.container.x)
            .attr("y", vars.container.y);

        truncate = function() {
            textBox.remove();
            if (reverse) {
                line++;
                textBox = vars.container.select("tspan");
            } else {
                line--;
                textBox = d3.select(vars.container.node().lastChild);
            }
            if (!textBox.empty()) {
                words = textBox.text().match(/[^\s-]+-?/g);
                return ellipsis();
            }
        };

        lineWidth = function() {
            var b;
            if (vars.shape === "circle") {
                b = ((line - 1) * dy) + yOffset;
                if (b > height / 2) {
                    b += dy;
                }
                return 2 * Math.sqrt(b * ((2 * (width / 2)) - b));
            } else {
                return width;
            }
        };

        ellipsis = function() {
            var lastChar, lastWord;
            if (words && words.length) {
                lastWord = words.pop();
                lastChar = lastWord.charAt(lastWord.length - 1);
                if (lastWord.length === 1 && vars.text.split.value.indexOf(lastWord) >= 0) {
                    return ellipsis();
                } else {
                    if (vars.text.split.value.indexOf(lastChar) >= 0) {
                        lastWord = lastWord.substr(0, lastWord.length - 1);
                    }
                    textBox.text(words.join(" ") + " " + lastWord + "...");
                    if (textBox.node().getComputedTextLength() > lineWidth()) {
                        return ellipsis();
                    }
                }
            } else {
                return truncate();
            }
        };

        placeWord = function(word) {
            var current, joiner, next_char;
            current = textBox.text();
            if (reverse) {
                next_char = vars.text.charAt(vars.text.length - progress.length - 1);
                joiner = next_char === " " ? " " : "";
                progress = word + joiner + progress;
                textBox.text(word + joiner + current);
            } else {
                next_char = vars.text.charAt(progress.length);
                joiner = next_char === " " ? " " : "";
                progress += joiner + word;
                textBox.text(current + joiner + word);
            }
            if (textBox.node().getComputedTextLength() > lineWidth()) {
                textBox.text(current);
                textBox = newLine(word);
                if (reverse) {
                    return line--;
                } else {
                    return line++;
                }
            }
        };

        var start = 1;
        var line = null;
        var lines = null;
        var wrap = function() {
            // Remove any content
            vars.container.selectAll("tspan").remove();
            vars.container.html("");

            var word = null;
            var words = vars.words.slice(0);

            progress = words[0];
            textBox = newLine(words.shift(), true);
            line = start;
            var len = words.length;
            for (var i = 0; i < len; i++) {

                word = words[i];
                if (line * dy > height) {
                    truncate();
                    break;
                }
                placeWord(word);
                var unsafe = true;
                while (unsafe) {
                    var next_char = vars.text.charAt(progress.length + 1);
                    unsafe = ["-", "/", ";", ":", "&"].indexOf(next_char) >= 0;
                    if (unsafe) {
                        placeWord(next_char);
                    }
                }
            }

            if (line * dy > height) {
                truncate();
            }

            return lines = Math.abs(line - start) + 1;
        };

        wrap();

        lines = line;
        if (vars.shape.value === "circle") {
            space = height - lines * dy;
            if (space > dy) {
                if (valign === "middle") {
                    start = (space / dy / 2 >> 0) + 1;
                    wrap();
                } else if (valign === "bottom") {
                    reverse = true;
                    start = height / dy >> 0;
                    wrap();
                }
            }
        }
        if (vAlign === "top") {
            y = 0;
        } else {
            h = lines * dy;
            y = vAlign === "middle" ? height / 2 - h / 2 : height - h;
        }
        y -= dy * 0.2;
        translate = "translate(0," + y + ")";
        if (vars.rotate === 180 || vars.rotate === -180) {
            rx = vars.container.x + width / 2;
            ry = vars.container.y + height / 2;
        } else {
            rmod = vars.rotate < 0 ? width : height;
            rx = vars.container.x + rmod / 2;
            ry = vars.container.y + rmod / 2;
        }
        rotate = "rotate(" + vars.rotate + ", " + rx + ", " + ry + ")";
        return vars.container.attr("transform", rotate + translate);
    }

    /// Wraps the text in the given text container.
    this.draw = function() {

        // If we have no container just return
        if (!_textElement) return this;

        // Go through each of the selected items within the container
        _textElement.each(function(d) {

            // Create an object for passing around variables
            var vars = {};
            vars.element = d3.select(this);

            // Grab the container element and it's shape
            var container = vars.element.node().previousElementSibling;
            vars.shape = container ? container.tagName.toLowerCase() : "";
            vars.container = d3.select(container);

            // Calculate some basic properties of the object we're dealing with
            parse(vars);

            // Split the text into words
            var wordBreak = /[^\s\-\/\;\:\&]+\-?\/?\;?\:?\&?/g;
            vars.text = vars.element.text();
            vars.words = vars.text.match(wordBreak);

            // Ensure the element has no text
            vars.element.html("");

            // Resize or scale as appropriate
            if (_resize) {
                resize(vars);
            } else {
                flow(vars);
            }

            // Wrap the font if neccessary
            if (vars.size[0] <= vars.innerHeight) {

            }

            return;







            d3.select("svg")
                .append("rect")
                .attr({
                    x: _x,
                    y: _y,
                    width: _width,
                    height: _height
                })
                .style("stroke", "red")
                .style("fill", "none");

            (function() {

                // Split up the text into individual words
                var text = element.text().split(" ");
                var words = [];

                // Create an array of words and spaces
                for (var i = 0; i < text.length; i++) {
                    words.push(text[i] + (i === text.length ? "" : " "));
                }

                // Start by trying to use the largest font size
                //var sizeMax = Math.floor(???);


                size();
                if (_size[0] <= _innerHeight) {
                    text();
                    wrap();
                }


            })();

            console.log(_x, _y, _width, _height);
        });

        return this;
    };

    /// Defines the horizontal alignment of the block of text to be wrapped. 
    /// If undefined, D3plus will use the text element's "text-anchor" property if it has been set.
    /// Accepted values are: "left" or "start", "center" or "middle", "right" or "end".
    this.align = function(_) {
        if (!arguments.length) return _alignment;

        switch (_) {
            case "center":
                _ = "middle";
                break;
            case "right":
                _ = "end";
                break;
            case "left":
                _ = "start";
                break;
        }

        _alignment = _;
        return this;
    };

    /// When wrapping multiple blocks of text, they often share the same basic set of method values. 
    /// Using this method, multiple methods can be set using a pre-defined javascript Object that matches 
    /// the structure of the various other methods. In this example, the .width( ), .height( ), and .resize( ) 
    /// methods are all being set by using only the .config( ) method:
    this.config = function(_) {

        // Return the object if need be
        if (!arguments.length) return {
            alignment: _alignment,
            container: _textElement,
            resize: _resize,
            rotate: _rotate,
            fontSizeRange: _fontSizeRange,
            valign: _valign,
            height: _height,
            width: _width,
            padding: _padding,
            x: _x,
            y: _y,
            wrap: _wrap
        };

        // Add each property dynamically
        for (var property in _) {
            if (_.hasOwnProperty(property)) {
                if(this[property]) {
                    this[property](_[property]);
                }
            }
        }

        return this;
    };

    /// This required method tells d3plus which SVG text element to wrap text inside of. We 
    /// support all of the D3 Selection Methods, including D3 elements.
    this.container = function(_) {
        if (!arguments.length) return _textElement;
        _textElement = _;
        return this;
    };

    /// Sets the available inner bounding height to wrap text.
    this.height = function(_) {
        if (!arguments.length) return _height;
        _height = _;
        return this;
    };

    /// Defines the amount of pixel padding to apply to all sides of the wrapped text. 
    /// If undefined, D3plus will try to use the difference between the "x" position of 
    /// the text and the "x" position of the backing rectangle or circle element.
    this.padding = function(_) {
        if (!arguments.length) return _padding;
        _padding = _;
        return this;
    };

    /// Defines whether or not the text size in should be resized to fit the available space.
    this.resize = function(_) {
        if (!arguments.length) return _resize;
        _resize = _;
        return this;
    };

    /// Defines whether or not the text should be wrapped into the avaliable space
    this.wrap = function(_) {
        if (!arguments.length) return _wrap;
        _wrap = _;
        return this;
    };

    /// Rotates the entire wrapped text to a specific angle. Accepted values are: -180, -90, 0, 90, or 180.
    this.rotate = function(_) {
        if (!arguments.length) return _rotate;
        _rotate = _;
        return this;
    };

    /// An Array of 2 numbers to be used as a minimum and maximum font size when resizing text.
    this.fontSizeRange = function(_) {
        if (!arguments.length) return _fontSizeRange;
        _fontSizeRange = _;
        return this;
    };

    /// Defines the vertical alignment of the block of text to be wrapped.
    /// Accepted values are: "top", "middle", or "bottom".
    this.valign = function(_) {
        if (!arguments.length) return _valign;
        _valign = _;
        return this;
    };

    /// Sets the available inner bounding width to wrap text.
    this.width = function(_) {
        if (!arguments.length) return _width;
        _width = _;
        return this;
    };

    /// How many pixels the wrapped text should be offset horizontally. 
    /// If undefined, D3plus will try to detect the x position from the text element itself. 
    /// Can be used instead of (or with) the .padding( ) method.
    this.x = function(_) {
        if (!arguments.length) return _x;
        _x = _;
        return this;
    };

    /// How many pixels the wrapped text should be offset vertically. 
    /// If undefined, D3plus will try to detect the y position from the text element itself. 
    /// Can be used instead of (or with) the .padding( ) method
    this.y = function(_) {
        if (!arguments.length) return _y;
        _y = _;
        return this;
    };

    return this;
};

