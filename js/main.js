$(document).ready(function(){
    
    'use strict'; // Enforce strict mode

    var app = {};

    app.uiElements = {
        "cover": $('.cover'),
        "fullViewport": $('.full-viewport'),
        "canvasWrapper": $('.canvas-wrapper'),
        "colorPreviewCanvas": $('.color-previewer-canvas'),
        "blenderWrapper": $('#blender-wrapper'),
        "textInput": $('.search-photo-text-input'),
        "searchButton": $('.search-photo-button'),
        "loader": $('.loader'),
        "photoColumnWrapper": $('.photo-column-wrapper'),
        "photoSelectButton": $('.photo-select-button'),
        "photoContainer": $('.photo-column'),
        "loadingMessage": $('.loading-message'),
        "canvasDownloadBtn": $('.canvas-download-btn'),
        "footer": $('.footer')
    };

    app.imageList = []; 

    app.addPaletteItems = function(palette, container, options){

        var hexValues = [];
        var paletteItemsWrapper;
        var timer;
        var timerRectGradientColor;

        options = options || {};
        palette = app.optimizeColorPalette(palette);

        if(!container.find('.color-palette-items-wrapper').length){
            var paletteItemsWrapperConstructionOptions = { "class": "color-palette-items-wrapper" };
            paletteItemsWrapper = app._newDiv(paletteItemsWrapperConstructionOptions);
            container.prepend(paletteItemsWrapper);
        } else {
            paletteItemsWrapper = container.find('.color-palette-items-wrapper');
            paletteItemsWrapper.empty();
        }

        var addGradientColorRect =  function(paletteText, container){
            var rectDiv = app._newDiv({
                "class": "rect-gradient-color",
                "styles": [
                    {"name": "opacity", "value": "0"},
                    {"name": "background", "value": "-webkit-linear-gradient(left, " + paletteText + ")"},
                    {"name": "background", "value": "-o-linear-gradient(right, " + paletteText + ")"},
                    {"name": "background", "value": "-moz-linear-gradient(right, " + paletteText + ")"},
                    {"name": "background", "value": "linear-gradient(to right, " + paletteText + ")"},
                ],
                "mouseoverEventListener": function(){
                    timerRectGradientColor = setTimeout(function(){
                        app.uiElements.colorPreviewCanvas.css('background', "-webkit-linear-gradient(left, " + paletteText + ")");
                        app.uiElements.colorPreviewCanvas.css('background', "-o-linear-gradient(right, " + paletteText + ")");
                        app.uiElements.colorPreviewCanvas.css('background', "-moz-linear-gradient(right, " + paletteText + ")");
                        app.uiElements.colorPreviewCanvas.css('background', "linear-gradient(to right, " + paletteText + ")");
                        app.uiElements.colorPreviewCanvas.fadeIn(250);
                    }, 500);
                },
                "mouseoutEventListener": function(){
                    app.uiElements.colorPreviewCanvas.fadeOut(250);
                    app.uiElements.colorPreviewCanvas.css('background', 'unset');
                    clearTimeout(timerRectGradientColor);
                }
            });
            container.append(rectDiv);
        }

        var sorted = palette.sort(function(colorA, colorB) {
            return app.getBrightness(app.rgb2hex(colorA)) - app.getBrightness(app.rgb2hex(colorB));
        });

        sorted.forEach(function (d) {
            var hexValue = app.rgb2hex(d);
            hexValues.push(hexValue);

            var paletteItemWrapperCustructorOption = {"class": "color-palette-item-wrapper"};

            if(options["canvas-item"]){
                paletteItemWrapperCustructorOption.styles = [
                    {
                        "name": "opacity",
                        "value": "0"
                    }
                ];
            }

            var paletteItemWrapper = app._newDiv(paletteItemWrapperCustructorOption);

            var paletteItem = app._newDiv({
                "class": "color-palette-item",
                "styles": [{
                    "name": "background-color", 
                    "value": d
                }],
                "mouseoverEventListener": function(){
                    timer = setTimeout(function(){
                        app.uiElements.colorPreviewCanvas.css('background-color', d);
                        app.uiElements.colorPreviewCanvas.fadeIn(250);
                    }, 500);
                },
                "mouseoutEventListener": function(){
                    app.uiElements.colorPreviewCanvas.fadeOut(250);
                    clearTimeout(timer);
                }
            });

            var paletteItemLabelHex = app._newDiv({
                "class": "color-label hex",
                "text": hexValue
            });

            var paletteItemLabelRgb = app._newDiv({
                "class": "color-label rgb",
                "text": d.replace('rgb', '')
            });

            paletteItemWrapper.append(paletteItem);
            paletteItemWrapper.append(paletteItemLabelHex);
            paletteItemWrapper.append(paletteItemLabelRgb);
            paletteItemsWrapper.append(paletteItemWrapper);
        });

        if(options["update"] && options["target"] === "canvas"){
            var hexValuesText = hexValues.join(', ');
            addGradientColorRect(hexValuesText, paletteItemsWrapper);
            $(".rect-gradient-color").css('opacity', '1');
            this.uiElements.fullViewport.find(".color-palette-wrapper-canvas .copy-button-wrapper").show();
            this.uiElements.fullViewport.find(".color-palette-wrapper-canvas .input-range-wrapper").show();
        }

        if(options["canvas-item"]){

            var hexValuesText = hexValues.join(', ');

            var clipboardItems = [
                {'id': 'copy-hex', 'values': 'Copy Hex values'},
                {'id': 'copy-rgb', 'values': 'Copy RGB values'}
            ];

            var copyButtonWrapper = app._newDiv({"class": "copy-button-wrapper"});

            var emptyPlaceholderDiv = app._newDiv({
                "styles": [
                    {"name": "height", "value": "85px"},
                    {"name": "margin-bottom", "value": "5px"},
                ]
            });
            copyButtonWrapper.append(emptyPlaceholderDiv);

            var createCopyBtn = function(id, clipboardText) {

                var buttonItem = $("<div data-toggle='tooltip' data-placement='left' class='copy-button-item' id='" + id + "' title='" + clipboardText + "'></div>");
                buttonItem.html('<i class="fa fa-clipboard fa-1x" aria-hidden="true"></i>');
                buttonItem.tooltip();
                buttonItem.on('mouseout', function() {
                    buttonItem.attr('data-original-title', clipboardText);
                })
                copyButtonWrapper.append(buttonItem);

                var clipboardRgb = new Clipboard('#' + id, {
                    text: function(trigger){
                        return app.getColorPaletteLabel(trigger.id);
                    }
                });
                clipboardRgb.on('success', function(e) {
                    // console.log(e);
                    buttonItem.attr('data-original-title', "copied to clipboard")
                        .tooltip('show');
                });
                clipboardRgb.on('error', function(e) {
                    // console.log(e);
                });
            };

            clipboardItems.forEach(function(d) {
                createCopyBtn(d.id, d.values);
            });

            container.prepend(copyButtonWrapper);

            addGradientColorRect(hexValuesText, paletteItemsWrapper);

            // canvasBlendedColorPalette = hexValues;
        }
    };

    app.populateColorPalette = function(palette, container, options, callback){
        options = options || {};
        var paletteWrapperClass = options['palette-wrapper-class'] || "color-palette-wrapper";
        var colorPaletteWrapper = this._newDiv({"class": paletteWrapperClass});

        this.addPaletteItems(palette, colorPaletteWrapper, options);
        container.append(colorPaletteWrapper);

        if (callback) {
            callback(colorPaletteWrapper);
        }
    };

    app.updateColorPalette = function(palette, container, options){
        options = options || {};
        options.update = true;
        this.addPaletteItems(palette, container, options);
        app.displayLoadingMessage(null);
    };
    
    app.getColorPaletteLabel = function(id){
        var textLabels = [];
        var type = (id == 'copy-hex') ? 'hex' : 'rgb';
        $('.color-palette-wrapper-canvas').find('.color-palette-item-wrapper').find('.color-label.' + type).each(function (d) {
            textLabels.push($(this).text());
        });
        return textLabels.join(', ');
    };

    app.addSaturationInputRange = function(container){

        var inputRangeWrapper = app._newDiv({"class": "input-range-wrapper"});
        container.append(inputRangeWrapper);

        var tickPositions = [90, 72.5, 55, 37.5, 20];
        var saturationValues = [0, 25, 50, 75, 100];
        
        // Set the dimensions of the canvas / graph
        var margin = {top: 5, right: 5, bottom: 5, left: 5},
            width = 30 - margin.left - margin.right,
            height = 120 - margin.top - margin.bottom;

        var drag = d3.behavior.drag()
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);

        // Adds the svg canvas
        var svg = d3.select(".input-range-wrapper")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", 
                    "translate(" + margin.left + "," + margin.top + ")");
        
        var slider = svg.append("g").attr("class", "slider-group");  

        slider.append("svg:image")
            .attr("xlink:href", './assets/img/slider-bg.png')
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        var rect = slider.append("svg:rect")
            .attr("class", "rect-container")
            .attr("x", 0)
            .attr("y", margin.top)
            .attr("fill", "url(#bg)")
            .attr("width", width)
            .attr("height", height - margin.top - margin.bottom);
                
		var circle = slider.append("circle")
            .attr('class', 'slider-circle')
			.attr("cx", width - margin.left - margin.right)
            // .attr("cy", height - margin.bottom - margin.top - 10)
			.attr("cy", (height /2) )
			.attr("r", 4)
			.style("fill", "#cccccc")
            .style("cursor", "crosshair")
            .call(drag);

        var buttonDownText= slider.append("text")
			.attr("x", width - 16)
			.attr("y", height + 3)
            .style("fill","#909090")
            // .attr("font-weight","600")
            .style("cursor", "pointer")
            .attr('font-family', 'FontAwesome')
			.text(function(d) { return '\uf056'; }) 
            .on('click', function(d){
                updateSliderPosition('down');
            });

        var buttonUpText = slider.append("text")
			.attr("x", width - 16)
			.attr("y", 7)
            .attr("font-weight","600")
            .style("fill","#d7d7d7")
            .style("cursor", "pointer")
            .attr('font-family', 'FontAwesome')
			.text(function(d) { return '\uf055'; })
            .on('click', function(d){
                updateSliderPosition('up');
            });

        function updateSliderPosition(direction){
            if(direction == 'up' || direction == 'down'){
                var positionIndex = getPositionIndex();
                var newPositionIndex = (direction == 'up') ? positionIndex + 1 :  positionIndex - 1;

                newPositionIndex = (newPositionIndex > 4) ? 4 : newPositionIndex;
                newPositionIndex = (newPositionIndex < 0) ? 0 : newPositionIndex;
                d3.select('.slider-circle').attr("cy", tickPositions[newPositionIndex]);
                app.adjustCanvasSaturation(saturationValues[newPositionIndex]);
            }
        }

        function getPositionIndex(){
            var currentPosition = d3.select('.slider-circle').attr("cy") ;
            return tickPositions.indexOf(+currentPosition);
        }

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }

        function dragged(d) {
            function closest (num, arr) {
                var curr = arr[0];
                var diff = Math.abs (num - curr);
                for (var val = 0; val < arr.length; val++) {
                    var newdiff = Math.abs (num - arr[val]);
                    if (newdiff < diff) {
                        diff = newdiff;
                        curr = arr[val];
                    }
                }
                return curr;
            }

            var tickValue = closest(d3.event.y, tickPositions);
            d3.select(this).attr("cy", tickValue);
        }

        function dragended(d) {
            d3.select(this).classed("dragging", false);
            var currentPositionIndex = getPositionIndex();
            app.adjustCanvasSaturation(saturationValues[currentPositionIndex]);
        } 

    };

    app.addImageToCanvas = function(images) {

        var containerWidth = this.uiElements.canvasWrapper.width();
        var containerHeight = this.uiElements.canvasWrapper.height();
        var imagesAlpha = ((1/images.length).toFixed(2));

        var canvas = $('<canvas/>', { id: 'blender-canvas'})[0];
        canvas.setAttribute("data-caman-hidpi-disabled", true); 
        this.uiElements.canvasWrapper.prepend(canvas);
        this._fitCanvasToContainer(canvas);

        var ctx = canvas.getContext('2d');
        ctx.globalAlpha = imagesAlpha;

        this.uiElements.loader.removeClass('loading');

        images.sort(function(a, b) {
            return parseFloat(a.index) - parseFloat(b.index);
        });

        images.forEach(function(d) {
            app._drawImageProp(ctx, d.image, 0, 0, containerWidth, containerHeight);
        });    

        this.adjustCanvasSaturation(50);
        app.uiElements.colorPreviewCanvas.fadeOut(3000);

        if(!this.uiElements.canvasDownloadBtn.hasClass('show')){
            this.uiElements.canvasDownloadBtn.addClass('show');
        }

        if(this.uiElements.footer.hasClass('hide')){
            this.uiElements.footer.removeClass('hide');
        }        
    };

    app.adjustCanvasSaturation = function(value){
        Caman('#blender-canvas', function () {
            this.revert();
            this.saturation(value);
            this.render(app.calcColorPaletteForCanvas);
        });
    };

    app.calcColorPaletteForCanvas = function() {
        var canvas = $('#blender-canvas')[0];
        var dataURL = canvas.toDataURL(); 

        $('<img id="blended-image" src="'+ dataURL +'">').load(function() {
            app.getColorPalette(this, function(d){
                var canvasColorPaletteWrapper = $('.color-palette-wrapper-canvas');

                if(!canvasColorPaletteWrapper.length) {
                    app.populateColorPalette(d, app.uiElements.fullViewport, {"palette-wrapper-class": "color-palette-wrapper-canvas", "canvas-item": true}, function(d) {
                        app.addSaturationInputRange(d);
                        app.displayLoadingMessage('loading-message-squeez');

                        var delayInterval = 250;

                        $(".color-palette-wrapper-canvas > .color-palette-items-wrapper > div").each(function(index) {
                            $(this).delay(delayInterval * index).fadeTo("slow", 1);
                        });

                        setTimeout(function(){
                            app.displayLoadingMessage(null);
                        }, delayInterval * 6);
                    });
                } else {
                    app.displayLoadingMessage('loading-message-squeez');
                    app.updateColorPalette(d, canvasColorPaletteWrapper, {"target": "canvas"});
                }
                
            });
        });
    };

    app.optimizeColorPalette = function(palette, callback) {

        palette = palette.map(function(d) {
            return app.rgb2hex(d);
        });
        var bezierColors = chroma.bezier(palette);
        var lightnesCorrectedBezierColors = chroma.scale(bezierColors).mode('lab').correctLightness().colors(5);
        return lightnesCorrectedBezierColors.map(function(d) {
            return app.hex2rgb(d);
        });
    };

    app.updateImageList = function(){
        var images = app.imageList.filter(function(d, i) {
            if($('#img-selector-' + d.index).hasClass('active')){
                return d;
            }
        });
        app.resetCanvas();
        app.addImageToCanvas(images);
    };

    app.loadImage = function(photo, index) {
        
        var deferred = $.Deferred();
        var path = photo.path;

        var column = (index % 2) ? 'div.right' : 'div.left';
        var container = app._newDiv({"class": "photo-item-wrapper"});

        var imageWrapper = app._newDiv({
            "class": "img-wrapper",
        });
        container.append(imageWrapper);

        var imageSelector = app._newDiv({
            "id": "img-selector-" + index,
            "class": "img-selector active",
            "html": '<i class="fa fa-check fa-1x" aria-hidden="true"></i>',
            "clickEventListener": function(){
                $(this).toggleClass('active');
                app.updateImageList();
            }
        });

        var unsplashLink = app._newDiv({
            "class": "unsplash-link",
            "html": '<span class="fa fa-external-link fa-1x"></span><span> '+photo.user+'</span>',
            "clickEventListener": function(){
                window.open(photo.link);
            }
        });

        $('<img crossOrigin="Anonymous" src="'+ path +'">').load(function() {
            var img = this;
            var triggerCropCall;
            imageWrapper.append(this);

            setTimeout(function(){
                $(img).cropper({
                    // aspectRatio: 16 / 9,
                    // viewMode: 0
                    viewMode: 3,
                    autoCropArea: 1,
                    cropBoxResizable: false,
                    guides: false,
                    center: false,
                    zoomOnWheel: false,
                    cropend: function(e) {
                        cropEventsHandler();                     
                    },
                    zoom: function(e){
                        cropEventsHandler();
                    }
                });

                var zoominButton = app._newDiv({
                    "class": "crop-zoomin",
                    "html": '<i class="fa fa-plus fa-1x" aria-hidden="true"></i>',
                    "clickEventListener": function(){
                        $(img).cropper('zoom', 0.1);
                    }
                });

                var zoomoutButton = app._newDiv({
                    "class": "crop-zoomout",
                    "html": '<i class="fa fa-minus fa-1x" aria-hidden="true"></i>',
                    "clickEventListener": function(){
                        $(img).cropper('zoom', -0.1);
                    }
                });

                imageWrapper.append(zoominButton);
                imageWrapper.append(zoomoutButton);
            }, 1000);

            var cropEventsHandler = function(){
                if(triggerCropCall){
                    clearTimeout(triggerCropCall);
                }
                triggerCropCall = setTimeout(function(){
                    cropImage();
                }, 1500);  
            };

            var cropImage = function(){
                var croppedCanvas = $(img).cropper('getCroppedCanvas');
                $('<img crossOrigin="Anonymous" src="' + croppedCanvas.toDataURL() + '">').load(function(){
                    var croppedImage = this;
                    app.getColorPalette(this, function(result) {
                        app.updateColorPalette(result, container);
                    });
                    app.imageList.find(function(d, i) {
                        if(d.index == index){
                            d.image = croppedImage;
                        }
                    });
                    app.updateImageList();
                });
            };
            
            app.getColorPalette(img, function(d) {
                app.populateColorPalette(d, container, {index: index});
                deferred.resolve({
                    index: index, 
                    image: img, 
                    palette: d
                });
            });
        });
        
        imageWrapper.append(imageSelector);
        imageWrapper.append(unsplashLink);
        $(column).append(container);

        return deferred.promise();
    };

    app.getColorPalette = function (img, callback) {

        var colorThief = new ColorThief();
        var palette = colorThief.getPalette(img, 5);

        palette = palette.map(function(d){
            var color = 'rgb(' + d.join(',') + ')';
            return color;
        });
        callback(palette);
    };

    app.processImages = function(images) {
        var deferred = $.Deferred();
        var imageObjects = [];

        images.forEach(function(d, i){
            app.loadImage(d, i).then(function(img){
                imageObjects.push(img);
                if(imageObjects.length == images.length){
                    deferred.resolve(imageObjects);
                }
            });
        });
        return deferred.promise();
    };

    app.searchImages = function(tag) {
        var queryURL = "https://unsplash.vannizhang.com/getImages";
        if(!tag){
            alert('please provide a theme that you wanted to search for, like "mountain"');
            return;
        }

        if(history.pushState) {
            history.pushState(null, null, '#' + tag);
        }
        else {
            location.hash = '#' + tag;
        }

        this.refreshPage();
        this.uiElements.loader.addClass('loading');
        this.displayLoadingMessage('loading-message-search');

        $.get(queryURL, {tag: tag}, function( data ) {
            if(data){
                if(data.error){
                    app.displayLoadingMessage('loading-message-error');
                    app.uiElements.loader.removeClass('loading');
                    return;
                }
                
                app.displayLoadingMessage('loading-message-smoosh');
                app.processImages(data).then(function(images){
                    app.imageList = images;
                    app.uiElements.photoColumnWrapper.removeClass('hide');
                    app.addImageToCanvas(images);
                });
            }
        });
    };

    app.displayLoadingMessage = function(id) {
        this.uiElements.loadingMessage.addClass('hide');
        $('#' + id).removeClass('hide');
    };

    app.refreshPage = function(){
        this.imageList.length = 0;
        this.uiElements.photoContainer.empty();
        this.resetCanvas();
    };

    app.resetCanvas = function() {
        this.uiElements.blenderWrapper.find(".color-palette-wrapper").remove();
        this.uiElements.canvasWrapper.find("canvas").remove();
        this.uiElements.fullViewport.find(".color-palette-wrapper-canvas .color-palette-items-wrapper").empty();
        this.uiElements.fullViewport.find(".color-palette-wrapper-canvas .copy-button-wrapper").hide();
        this.uiElements.fullViewport.find(".color-palette-wrapper-canvas .input-range-wrapper").hide();
        this.uiElements.canvasDownloadBtn.removeClass('show');
    };

    app.checkHashData = function(){
        var tag = window.location.hash.substr(1);

        if(tag){
            this.searchImages(tag);
            this.uiElements.textInput.val(tag);
        }
    };

    app._newDiv = function(options) {
        options = options || {};
        var divElement = $('<div></div>');
        if(options.id) divElement.attr('id', options.id);
        if(options.class) divElement.addClass(options.class);
        if(options.title) divElement.attr('title', options.title);
        if(options.styles) {
            options.styles.forEach(function(style) {
                divElement.css(style.name, style.value);
            });
        }
        if(options.text) {
            divElement.html('<span>' + options.text + '</span>');
        }
        if(options.html) {
            divElement.html(options.html);
        }
        if(options.clickEventListener) {
            divElement.on('click', options.clickEventListener);
        }
        if(options.mouseoverEventListener) {
            divElement.on('mouseover', options.mouseoverEventListener);
        }
        if(options.mouseoutEventListener) {
            divElement.on('mouseout', options.mouseoutEventListener);
        }
        return divElement;
    };

    app._fitCanvasToContainer = function(canvas){
        canvas.style.width='100%';
        canvas.style.height='100%';
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };

    app._drawImageProp = function(ctx, img, x, y, w, h, offsetX, offsetY) {

        if (arguments.length === 2) {
            x = y = 0;
            w = ctx.canvas.width;
            h = ctx.canvas.height;
        }

        // default offset is center
        offsetX = typeof offsetX === "number" ? offsetX : 0.5;
        offsetY = typeof offsetY === "number" ? offsetY : 0.5;

        // keep bounds [0.0, 1.0]
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        if (offsetX > 1) offsetX = 1;
        if (offsetY > 1) offsetY = 1;

        var iw = img.width,
            ih = img.height,
            r = Math.min(w / iw, h / ih),
            nw = iw * r,   // new prop. width
            nh = ih * r,   // new prop. height
            cx, cy, cw, ch, ar = 1;

        // decide which gap to fill    
        if (nw < w) ar = w / nw;                             
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
        nw *= ar;
        nh *= ar;

        // calc source rectangle
        cw = iw / (nw / w);
        ch = ih / (nh / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        // make sure source rectangle is valid
        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        // fill image in dest. rectangle
        ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
    };
    
    app.rgb2hex = function(rgb){
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (rgb && rgb.length === 4) 
            ? "#" +
                ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
                ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
                ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) 
            : '';
    };

    app.hex2rgb = function(hex) {
        if (hex.lastIndexOf('#') > -1) {
            hex = hex.replace(/#/, '0x');
        } else {
            hex = '0x' + hex;
        }
        var r = hex >> 16;
        var g = (hex & 0x00FF00) >> 8;
        var b = hex & 0x0000FF;
        return 'rgb(' + [r, g, b].join(',') +')';
    };

    app.getBrightness = function(hexCode) {
        // strip off any leading #
        hexCode = hexCode.replace('#', '');

        var c_r = parseInt(hexCode.substr(0, 2),16);
        var c_g = parseInt(hexCode.substr(2, 2),16);
        var c_b = parseInt(hexCode.substr(4, 2),16);

        return ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
    };   

    app.uiElements.textInput.keydown(function(event) {
        if (event.keyCode == 13) {
            app.searchImages($(this).val());
            return false;
         }
    });

    app.uiElements.searchButton.on('click', function(evt) {
        app.searchImages(app.uiElements.textInput.val());
    });

    app.uiElements.canvasDownloadBtn.on('click', function(evt) {
        domtoimage.toJpeg(document.getElementById('canvas-wrapper-div'), { quality: 0.95 }).then(function (dataUrl) {
            var link = document.createElement('a');
            link.download = 'PhotoChrome_' + app.uiElements.textInput.val() + '.jpeg';
            link.href = dataUrl;
            link.click();
        });
    });

    // add hash change event listener
    $(window).on('hashchange', function() { 
        if(!window.location.hash || window.location.hash == '' || window.location.hash == '#' || window.location.hash == '#footer'){
            window.location.hash = initialHash;
        } 
        app.checkHashData(); 
    });  

    //add twitter share box
    $('.twitter-popup').on('click', function(event) {
        var message = 'Check out this word-based color palette';
        var width  = 500,
            height = 300,
            left   = ($(window).width()  - width)  / 2,
            top    = ($(window).height() - height) / 2,
            url    = 'https://twitter.com/intent/tweet?hashtags=PhotoChrome&text=' + message + '&url=' + encodeURIComponent(window.location.href),
            opts   = 'status=1' +
                    ',width='  + width  +
                    ',height=' + height +
                    ',top='    + top    +
                    ',left='   + left;
        
        window.open(url, 'twitter', opts);
    
        return false;
    }); 

    //add LinkedIn share box
    $('.linkedin-popup').on('click', function(event) {
        var message = 'Check out this word-based color palette';
        var width  = 500,
            height = 300,
            left   = ($(window).width()  - width)  / 2,
            top    = ($(window).height() - height) / 2,
            url    = 'https://www.linkedin.com/shareArticle?mini=true&title=PhotoChrome&summary='+message+'&url=' + encodeURIComponent(window.location.href),
            opts   = 'status=1' +
                    ',width='  + width  +
                    ',height=' + height +
                    ',top='    + top    +
                    ',left='   + left;
        
        window.open(url, 'LinkedIn', opts);
    
        return false;
    }); 

    //add LinkedIn share box
    $('.facebook-popup').on('click', function(event) {
        FB.ui({
            method: 'share',
            display: 'popup',
            quote: 'Check out this word-based color palette',
            href: window.location.href,
        }, function(response){});
    
        return false;
    }); 

    app.checkHashData(); 

});