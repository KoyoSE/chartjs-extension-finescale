/* !
 * chartjs-extension-finescale.js
 *
 * Version: 0.0.1
 *
 * chartjs-extension-finescale.js Copyright 2016 koyoSE
 * Released under the MIT license
 * https://github.com/KoyoSE/chartjs-extension-finescale.git
 *
 * Chart.js Copyright 2016 Nick Downie
 * Released under the MIT license
 * https://github.com/chartjs/Chart.js/blob/master/LICENSE.md
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require(2)(Chart);
require(3)(Chart);
require(5)(Chart);
require(4)(Chart);

},{"2":2,"3":3,"4":4,"5":5}],2:[function(require,module,exports){
'use strict';

module.exports = function(Chart) {

	var helpers = Chart.helpers;

	Chart.FineScale = {

		// ----------------------
		// core.helpers.js Replacement
		// ----------------------

		// getOptionsAry: function() {

		// 	var me = this;
		// 	var opts = [
		// 		me.options,
		// 		me.options.subScale? me.options.subScale: me.options,
		// 		me.options.subScale.subScale? me.options.subScale.subScale: me.options
		// 	];
		// 	return opts;

		// },


		update: function(maxWidth, maxHeight, margins) {
			var me = this;

			// Update Lifecycle - Probably don't want to ever extend or overwrite this function ;)
			me.beforeUpdate();

			// Absorb the master measurements
			me.maxWidth = maxWidth;
			me.maxHeight = maxHeight;
			me.margins = helpers.extend({
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			}, margins);
			me.longestTextCache = me.longestTextCache || {};

			// Dimensions
			me.beforeSetDimensions();
			me.setDimensions();
			me.afterSetDimensions();

			// Data min/max
			me.beforeDataLimits();
			me.determineDataLimits();
			me.afterDataLimits();

			// Ticks
			me.beforeBuildTicks();
			me.buildTicks();
			me.generateTickDisplayPrameters();
			me.afterBuildTicks();

			me.beforeTickToLabelConversion();
			me.convertTicksToLabels();
			me.afterTickToLabelConversion();

			// Tick Rotation
			me.beforeCalculateTickRotation();
			me.calculateTickRotation();
			me.afterCalculateTickRotation();
			// Fit
			me.beforeFit();
			me.fit();
			me.afterFit();
			//
			me.afterUpdate();

			return me.minSize;

		},

		// Generate ticks display parameters
		generateTickDisplayPrameters: function() {

			var me = this;
			var opts = [
				me.options,
				me.options.subScale,
				me.options.subScale.subScale
			];
			var optsTick = [opts[0].ticks, opts[1].ticks, opts[2].ticks];

			if (!me.ticks) {
				me.ticks = [];
			}

			if ((!me.tickLevels) || (me.ticks.length !== me.tickLevels.length)) {
				me.tickLevels = [];
				for (var index = 0; index < me.ticks.length; index++) {
					// default tick level = 0;
					me.tickLevels.push(0);
				}
			}

			var isDisplayTicks = [];
			var displayTicks = [];
			// Setting display flag for each tick.
			// and setting display ticks array.
			var isDisplay;
			for (index = 0; index < me.ticks.length; index++) {
				// Forced display of the first and last ticks.
				isDisplay = index !== 0? (index !== me.ticks.length - 1? !!optsTick[me.tickLevels[index]].display: true): true;
				isDisplayTicks.push(isDisplay);
				if (isDisplay) {
					displayTicks.push(me.ticks[index]);
				}
			}

			me.isDisplayTicks = isDisplayTicks;
			me.displayTicks = displayTicks;

		},

		// niceNum for fineScale
		niceNum: function(range, round) {
			var exponent = Math.floor(helpers.log10(range));
			var fraction = range / Math.pow(10, exponent);

			var niceFraction;
			if (round) {
				niceFraction = fraction <= 1? 5: (fraction <= 5? 10: 20);
			} else {
				niceFraction = fraction <= 1? 1: (fraction <= 2? 2: (fraction <= 5? 5: 10));
			}

			return niceFraction * Math.pow(10, exponent);
		},

		// ----------------------
		// core.scale.js Replacement
		// ----------------------

		computeTextSize: function(context, tick, font) {
			return helpers.isArray(tick)?
				helpers.longestText(context, font, tick):
				context.measureText(tick).width;
		},

		parseFontOptions: function(options) {
			var getValueOrDefault = helpers.getValueOrDefault;
			var globalDefaults = Chart.defaults.global;
			var size = getValueOrDefault(options.fontSize, globalDefaults.defaultFontSize);
			var style = getValueOrDefault(options.fontStyle, globalDefaults.defaultFontStyle);
			var family = getValueOrDefault(options.fontFamily, globalDefaults.defaultFontFamily);

			return {
				size: size,
				style: style,
				family: family,
				font: helpers.fontString(size, style, family)
			};
		},

		// Actually draw the scale on the canvas
		// @param {rectangle} chartArea: the area of the chart to draw full grid lines on
		draw: function(chartArea) {
			var me = this;
			// options
			var opts = [
				me.options,
				me.options.subScale,
				me.options.subScale.subScale
			];
			if (!opts[0].display) {
				return;
			}
			var globalDefaults = Chart.defaults.global;
			var optsTick = [opts[0].ticks, opts[1].ticks, opts[2].ticks];
			var optsGridLines = [opts[0].gridLines, opts[1].gridLines, opts[2].gridLines];
			var optsScaleLabel = [opts[0].scaleLabel, opts[1].scaleLabel, opts[2].scaleLabel];

			// canvas
			var context = me.ctx;

			// figure out the maximum number of gridlines to show
			var maxTicks;
			if (optsTick[0].maxTicksLimit) {
				maxTicks = optsTick[0].maxTicksLimit;
			}

			// for tick
			var tickFont = [
				me.parseFontOptions(optsTick[0]),
				me.parseFontOptions(optsTick[1]),
				me.parseFontOptions(optsTick[2])
			];

			// tick length
			var tl = optsGridLines[0].drawTicks? [
				optsGridLines[0].tickMarkLength,
				optsGridLines[1].drawTicks? optsGridLines[1].tickMarkLength || optsGridLines[0].tickMarkLength * 0.6: 0, // sub tick length
				optsGridLines[2].drawTicks? optsGridLines[2].tickMarkLength || optsGridLines[0].tickMarkLength * 0.4: 0  // sub-sub tick length
			]: [0, 0, 0];

			// draw data
			var itemsToDraw = [];

			// for scale label
			var scaleLabelFontColor = helpers.getValueOrDefault(optsScaleLabel[0].fontColor, globalDefaults.defaultFontColor);
			var scaleLabelFont = me.parseFontOptions(optsScaleLabel[0]);

			var isHorizontal = me.isHorizontal();
			var isRotated = me.labelRotation !== 0;

			// -----
			var labelRotationRadians = helpers.toRadians(me.labelRotation);

			if (isHorizontal) {
				// horizontal
				var skipRatio = false;

				// Calculating autoskip
				if (optsTick[0].autoSkip) {
					var cosRotation = Math.cos(labelRotationRadians);
					var longestRotatedLabelWidth = isRotated? me.longestLabelWidth * cosRotation / 2: me.longestLabelWidth * cosRotation;
					var ticksWidth = (longestRotatedLabelWidth + optsTick[0].autoSkipPadding) * me.displayTicks.length;
					var scaleWidth = (me.width - (me.paddingLeft + me.paddingRight));
					if (ticksWidth > scaleWidth) {
						skipRatio = 1 + Math.floor(ticksWidth / scaleWidth);
					}
					// if they defined a max number of optionTicks,
					// increase skipRatio until that number is met
					if (maxTicks && me.displayTicks.length > maxTicks) {
						while (!skipRatio || me.ticks.length / (skipRatio || 1) > maxTicks) {
							if (!skipRatio) {
								skipRatio = 1;
							}
							skipRatio += 1;
						}
					}
				}

			}
			// -----

			helpers.each(me.ticks, function(label, index) {
				// If the callback returned a null or undefined value, do not draw this line
				if (label === undefined || label === null) {
					return;
				}

				var level = me.tickLevels[index];

				// display option
				if (!opts[level].display) {
					return;
				}

				// Process of autoSkip
				var isLastTick = me.displayTicks.length === index + 1;
				var shouldSkip = (skipRatio > 1 && index % skipRatio > 0) || (index % skipRatio === 0 && index + skipRatio >= me.displayTicks.length);
				if (shouldSkip && !isLastTick) {
					return;
				}

				// for glidline border
				// If the option of subScale (level 1, 2) is not defined, it follows scale (level 0)
				var borderDash = helpers.getValueOrDefault(optsGridLines[level].borderDash, optsGridLines[0].borderDash);
				var borderDashOffset = helpers.getValueOrDefault(optsGridLines[level].borderDashOffset, optsGridLines[0].borderDashOffset);
				var display = optsGridLines[0].display? helpers.getValueOrDefault(optsGridLines[level].display, optsGridLines[0].display): false;
				var drawTicks = optsGridLines[0].drawTicks? helpers.getValueOrDefault(optsGridLines[level].drawTicks, optsGridLines[0].drawTicks): false;
				var drawOnChartArea = optsGridLines[0].drawOnChartArea? helpers.getValueOrDefault(optsGridLines[level].drawOnChartArea, optsGridLines[0].drawOnChartArea): false;

				// zero line option
				var lineWidth, lineColor;
				if (index === (typeof me.zeroLineIndex !== 'undefined'? me.zeroLineIndex: 0)) {
					// Draw the first index specially
					lineWidth = optsGridLines[0].zeroLineWidth;
					lineColor = optsGridLines[0].zeroLineColor;
				} else {
					// for array setting
					var lw1 = helpers.getValueAtIndexOrDefault(optsGridLines[0].lineWidth, index);
					var lw2 = helpers.getValueAtIndexOrDefault(optsGridLines[level].lineWidth, index, optsGridLines[0].lineWidth);
					lineWidth = helpers.isArray(optsGridLines[0].lineWidth)? lw1: lw2;

					var lc1 = helpers.getValueAtIndexOrDefault(optsGridLines[0].color, index);
					var lc2 = helpers.getValueAtIndexOrDefault(optsGridLines[level].color, index, optsGridLines[0].color);
					lineColor = helpers.isArray(optsGridLines[0].color)? lc1: lc2;
				}

				// label
				var lFontColor = helpers.getValueOrDefault(optsTick[level].fontColor, globalDefaults.defaultFontColor);

				// Common properties
				var tx1, ty1, tx2, ty2, x1, y1, x2, y2, labelX, labelY;
				var textAlign = 'middle';
				var textBaseline = 'middle';

				if (isHorizontal) {
					// horizontal

					// label
					if (opts[0].position === 'bottom') {
						// bottom
						textBaseline = 'top';
						textAlign = !isRotated? 'center': 'right';
						labelY = isRotated? me.top + tl[0]: me.top + tl[level];
					} else {
						// top
						textBaseline = 'bottom';
						textAlign = !isRotated? 'center': 'left';
						labelY = isRotated? me.bottom - tl[0]: me.bottom - tl[level];
					}
					// x values for optionTicks (need to consider offsetLabel option)
					labelX = me.getPixelForTick(index, optsGridLines[0].offsetGridLines) + optsTick[0].labelOffset;

					// ticks
					var xLineValue = me.getPixelForTick(index) + helpers.aliasPixel(lineWidth);
					var yTickStart = opts[0].position === 'bottom'? me.top: me.bottom - tl[level];
					var yTickEnd = opts[0].position === 'bottom'? me.top + tl[level]: me.bottom;
					tx1 = tx2 = x1 = x2 = xLineValue;
					ty1 = yTickStart;
					ty2 = yTickEnd;
					// glid line
					y1 = chartArea.top;
					y2 = chartArea.bottom;

				} else {
					// vertical
					var isLeft = opts[0].position === 'left';
					var tickPadding = optsTick[0].padding;
					var labelXOffset;

					// label
					if (optsTick[0].mirror) {
						textAlign = isLeft? 'left': 'right';
						labelXOffset = tickPadding;
					} else {
						textAlign = isLeft? 'right': 'left';
						labelXOffset = tl[level] + tickPadding;
					}
					labelX = isLeft? me.right - labelXOffset: me.left + labelXOffset;
					var yLineValue = me.getPixelForTick(index) + helpers.aliasPixel(lineWidth);
					labelY = me.getPixelForTick(index, optsGridLines[0].offsetGridLines);

					// ticks
					var xTickStart = opts[0].position === 'right'? me.left: me.right - tl[level];
					var xTickEnd = opts[0].position === 'right'? me.left + tl[level]: me.right;
					tx1 = xTickStart;
					tx2 = xTickEnd;
					// glid line
					x1 = chartArea.left;
					x2 = chartArea.right;
					ty1 = ty2 = y1 = y2 = yLineValue;
				}

				// data push
				itemsToDraw.push({
					// visible for grid line and ticks line
					display: display,
					level: level,
					// ticks line
					tlDraw: drawTicks,
					tlX1: tx1,
					tlY1: ty1,
					tlX2: tx2,
					tlY2: ty2,
					tlColor: optsGridLines[0].color,
					// grid line on chart area
					glDraw: drawOnChartArea,
					glX1: x1,
					glY1: y1,
					glX2: x2,
					glY2: y2,
					glWidth: lineWidth,
					glColor: lineColor,
					glBorderDash: borderDash,
					glBorderDashOffset: borderDashOffset,
					// label
					lDisplay: me.isDisplayTicks[index],
					lX: labelX,
					lY: labelY,
					label: label,
					lRotation: -1 * labelRotationRadians,
					lTextBaseline: textBaseline,
					lTextAlign: textAlign,
					lFontColor: lFontColor,
				});
			});

			// Draw all of the tick labels, tick marks, and grid lines at the correct places
			helpers.each(itemsToDraw, function(itemToDraw) {

				// line
				if (itemToDraw.display) {

					context.save();
					context.lineWidth = itemToDraw.glWidth;

					context.strokeStyle = itemToDraw.tlColor;

					context.beginPath();

					// ticks line (scale area)
					if (itemToDraw.tlDraw) {
						context.moveTo(itemToDraw.tlX1, itemToDraw.tlY1);
						context.lineTo(itemToDraw.tlX2, itemToDraw.tlY2);
					}
					context.stroke();

					context.strokeStyle = itemToDraw.glColor;

					// dashed line
					if (context.setLineDash) {
						context.setLineDash(itemToDraw.glBorderDash);
						context.lineDashOffset = itemToDraw.glBorderDashOffset;
					}

					// grid line (chart area)
					if (itemToDraw.glDraw) {
						context.moveTo(itemToDraw.glX1, itemToDraw.glY1);
						context.lineTo(itemToDraw.glX2, itemToDraw.glY2);
					}
					context.stroke();
					context.restore();
				}

				// display ticks text
				if (itemToDraw.lDisplay) {
					context.save();
					context.translate(itemToDraw.lX, itemToDraw.lY);
					context.rotate(itemToDraw.lRotation);
					context.font = tickFont[itemToDraw.level].font;
					context.fillStyle = itemToDraw.lFontColor;
					context.textBaseline = itemToDraw.lTextBaseline;
					context.textAlign = itemToDraw.lTextAlign;

					var label = itemToDraw.label;
					if (helpers.isArray(label)) {
						for (var i = 0, y = 0; i < label.length; ++i) {
							// We just make sure the multiline element is a string here..
							context.fillText('' + label[i], 0, y);
							// apply same linestepSize as calculated @ L#320
							y += (tickFont[itemToDraw.level].size * 1.5);
						}
					} else {
						context.fillText(label, 0, 0);
					}
					context.restore();
				}

			});

			// ------

			// display scale label
			if (optsScaleLabel[0].display) {
				// Draw the scale label
				var scaleLabelX;
				var scaleLabelY;
				var rotation = 0;

				if (isHorizontal) {
					// horizontal
					scaleLabelX = me.left + ((me.right - me.left) / 2); // midpoint of the width
					scaleLabelY = opts[0].position === 'bottom'? me.bottom - (scaleLabelFont.size / 2): me.top + (scaleLabelFont.size / 2);
				} else {
					// vertical
					var isLeft = opts[0].position === 'left';
					scaleLabelX = isLeft? me.left + (scaleLabelFont.size / 2): me.right - (scaleLabelFont.size / 2);
					scaleLabelY = me.top + ((me.bottom - me.top) / 2);
					rotation = isLeft? -0.5 * Math.PI: -0.5 * Math.PI;
				}

				context.save();
				context.translate(scaleLabelX, scaleLabelY);
				context.rotate(rotation);
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillStyle = scaleLabelFontColor; // render in correct colour
				context.font = scaleLabelFont.font;
				context.fillText(optsScaleLabel[0].labelString, 0, 0);
				context.restore();
			}

			// draw border
			if (optsGridLines[0].drawBorder) {
				// Draw the line at the edge of the axis
				context.lineWidth = helpers.getValueAtIndexOrDefault(optsGridLines[0].lineWidth, 0);
				context.strokeStyle = helpers.getValueAtIndexOrDefault(optsGridLines[0].color, 0);
				var x1 = me.left,
					x2 = me.right,
					y1 = me.top,
					y2 = me.bottom;

				var aliasPixel = helpers.aliasPixel(context.lineWidth);
				if (isHorizontal) {
					y1 = y2 = opts[0].position === 'top'? me.bottom: me.top;
					y1 += aliasPixel;
					y2 += aliasPixel;
				} else {
					x1 = x2 = opts[0].position === 'left'? me.right: me.left;
					x1 += aliasPixel;
					x2 += aliasPixel;
				}

				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.stroke();
			}
		},

		// Prevention of overlap Ticks
		// The function name 'calculateTickRotation' is not appropriate, but it is not changed for compatibility.
		calculateTickRotation: function() {
			var me = this;
			var context = me.ctx;
			var optsTick = [me.options.ticks, me.options.subScale.ticks, me.options.subScale.subScale.ticks];
			var tickFont = me.parseFontOptions(optsTick[0]);
			var labelRotation = me.labelRotation = optsTick[0].minRotation || 0;
			if (!me.options.display) {
				return;
			}

			var tickFirst = me.displayTicks[0];
			var tickSecond = me.displayTicks[1];
			var tickSecondLast = me.displayTicks[me.displayTicks.length - 2];
			var tickLast = me.displayTicks[me.displayTicks.length - 1];

			if (me.isHorizontal()) {
				// ------
				// calculate tick rotation
				// ------
				// horizontal
				var originalLabelWidth = helpers.longestText(context, tickFont.font, me.displayTicks, me.longestTextCache);
				var labelWidth = originalLabelWidth;
				var cosRotation;
				var sinRotation;

				var tickWidthLeft = me.getPixelForValue(tickSecond) - me.getPixelForValue(tickFirst) - 6;
				var tickWidthRight = me.getPixelForValue(tickLast) - me.getPixelForValue(tickSecondLast) - 6;

				var tickWidth = Math.min(tickWidthLeft, tickWidthRight);
				// Max label rotation can be set or default to 90 - also act as a loop counter
				while (labelWidth > tickWidth && labelRotation < optsTick[0].maxRotation) {
					var angleRadians = helpers.toRadians(labelRotation);
					cosRotation = Math.cos(angleRadians);
					sinRotation = Math.sin(angleRadians);

					if (sinRotation * originalLabelWidth > me.maxHeight) {
						// go back one step
						labelRotation--;
						break;
					}

					labelRotation++;
					labelWidth = cosRotation * originalLabelWidth;
				}
				me.labelRotation = labelRotation;


				// ------
				// Prevent overlap ticks of max,min
				// ------
				// horizontal
				var pointer;
				// var tickHeight, labelWidth;
				angleRadians = helpers.toRadians(labelRotation);
				cosRotation = Math.cos(angleRadians);

				labelWidth = cosRotation * context.measureText(tickSecond).width;
				if ((optsTick[0].min !== undefined) && (tickWidthLeft < labelWidth)) {
					pointer = me.ticks.indexOf(tickSecond.toString(10));
					me.isDisplayTicks[pointer] = false;
				}
				labelWidth = cosRotation * context.measureText(tickLast).width;
				if ((optsTick[0].max !== undefined) && (tickWidthRight < labelWidth)) {
					pointer = me.ticks.indexOf(tickSecondLast.toString(10));
					me.isDisplayTicks[pointer] = false;
				}

			} else {
				// ------
				// Prevent overlap ticks of max,min
				// ------
				// vertical

				var tickHeight, labelHeight;
				// Temporaly (font size)*1.2 = label height
				// ex) Math.round(18px * 1.2) = 22
				labelHeight = Math.round(tickFont.size * 1.2);

				tickHeight = me.getPixelForValue(tickSecond) - me.getPixelForValue(tickFirst);
				if ((optsTick[0].min !== undefined) && (tickHeight < labelHeight)) {
					pointer = me.ticks.indexOf(tickSecond.toString(10));
					me.isDisplayTicks[pointer] = false;
				}
				tickHeight = me.getPixelForValue(tickLast) - me.getPixelForValue(tickSecondLast);
				if ((optsTick[0].max !== undefined) && (tickHeight < labelHeight)) {
					pointer = me.ticks.indexOf(tickSecondLast.toString(10));
					me.isDisplayTicks[pointer] = false;
				}

			}
			// ------
		},

	};

};

},{}],3:[function(require,module,exports){
'use strict';

module.exports = function(Chart) {

	var helpers = Chart.helpers;

	// Fine linear scale default config
	var defaultConfig = {
		// for scale (level:0)
		position: 'left',

		// for sub scale (level:1)
		subScale: {
			display: true,
			ticks: {
				display: true,
				fontSize: 11,
			},
			gridLines: {
				display: true,
				drawTicks: true,
				color: 'rgba(0, 0, 0, 0.07)',
			},
			// for sub-sub scale (level:2)
			subScale: {
				display: true,
				ticks: {
					display: false,
					fontSize: 10,
				},
				gridLines: {
					display: true,
					drawTicks: true,
					color: 'rgba(0, 0, 0, 0.03)',
				},
			}
		}
	};

	// Fine linear scale
	var baseScale = Chart.scaleService.getScaleConstructor('linear').extend(Chart.FineScale);
	var fineLinearScale = baseScale.extend({

		// ----------------------
		// core.ticks.js Replacement
		// ----------------------

		// Generator of fine linear ticks data
		fineLinear: function(generationOptions, dataRange) {
			var me = this;
			// for return
			var ticks = [];
			var levels = [];
			var isDisplayTicks = [];
			var displayTicks = [];
			// options
			var optsTick = generationOptions.optsTick;
			// factor
			var niceRange = me.niceNum(dataRange.max - dataRange.min, false);
			var stepSize = [];
			stepSize[0] = me.niceNum(niceRange / (generationOptions.maxTicks - 1), true);
			stepSize[1] = me.niceNum(stepSize[0] / 10, true);
			stepSize[2] = me.niceNum(stepSize[1] / 10, true);
			// Pointer of minimum stepSize.
			var pointerStepSize = 2;

			// process of stepSize option
			if (generationOptions.stepSize && generationOptions.stepSize > 0) {
				// The maximum number of ticks is 1000.
				// This is for performance.
				var gStepSize = generationOptions.stepSize;
				while ((dataRange.max - dataRange.min) / gStepSize > 1000) {
					gStepSize *= 10;
				}
				// Check the stepSize of each tick level and
				// set the minimum stepSize to generationOptions.stepSize.
				var value = gStepSize;
				for (var i = 0; i < generationOptions.levelMax; i++) {
					if (stepSize[i] <= gStepSize) {
						stepSize[i] = value;
						pointerStepSize = value !== 0? i: pointerStepSize;
						value = 0;
					}
				}
				stepSize[pointerStepSize] = stepSize[pointerStepSize] > gStepSize? gStepSize: stepSize[pointerStepSize];
			}

			// Nice numerical value for min & max
			var niceMin = Math.floor(dataRange.min / stepSize[0]) * stepSize[0];
			var niceMax = Math.ceil(dataRange.max / stepSize[0]) * stepSize[0];
			// Max and Min value of scale
			var startTick = generationOptions.min !== undefined? generationOptions.min: niceMin;
			var endTick = generationOptions.max !== undefined? generationOptions.max: niceMax;

			// ss: stepSize
			var getDicimalDigits = function(ss) {
				ss = ss === 0? 1: ss;
				var exponent = Math.floor(helpers.log10(ss));

				return {
					digits: exponent > 0? 0: Math.abs(exponent),
					magnification: Math.pow(10, exponent)
				};
			};

			// Calculation parameters
			var stepSizeDicimal = [
				getDicimalDigits(stepSize[0]),
				getDicimalDigits(stepSize[1]),
				getDicimalDigits(stepSize[2])
			];

			// -------
			// Create ticks data

			// Calculation of scale level (0-2)
			var level, tickValue;

			// tv: tickValue
			// ss: stepSize[]
			// mc: magnification
			var getLevel = function(tv, ss, mc) {
				// Level discrimination
				var t1 = (tv / mc) % (ss[0] / mc);
				var t2 = (tv / mc) % (ss[1] / mc);
				return t1 === 0? 0: (t2 === 0? 1: 2);
			};

			// Number of tick for loop
			var stepCount = +(((niceMax - niceMin) / stepSize[pointerStepSize]).toFixed(stepSizeDicimal[pointerStepSize].digits));
			// --push start tick--
			ticks.push(startTick);
			levels.push(getLevel(startTick, stepSize, stepSizeDicimal[pointerStepSize].magnification));
			for (var index = 1; index < stepCount; index++) {
				tickValue = niceMin + +((index * stepSize[pointerStepSize]).toFixed(stepSizeDicimal[pointerStepSize].digits));
				if ((tickValue <= startTick) || (endTick <= tickValue)) {
					continue;
				}
				level = getLevel(tickValue, stepSize, stepSizeDicimal[pointerStepSize].magnification);
				// --push ticks--
				ticks.push(+((tickValue).toFixed(stepSizeDicimal[level].digits)));
				levels.push(level);
			}
			// --push end tick--
			ticks.push(endTick);
			levels.push(getLevel(endTick, stepSize, stepSizeDicimal[pointerStepSize].magnification));

			// -------

			// // Setting display flag for each tick.
			// // and setting display ticks array.
			// var isDisplay;
			// for (index = 0; index < ticks.length; index++) {
			// 	// Forced display of the first and last ticks.
			// 	isDisplay = index !== 0? (index !== ticks.length - 1? !!optsTick[levels[index]].display: true): true;
			// 	isDisplayTicks.push(isDisplay);
			// 	if (isDisplay) {
			// 		displayTicks.push(ticks[index]);
			// 	}
			// }

			return {
				ticks: ticks,
				levels: levels,
				min: startTick,
				max: endTick,
				// isDisplayTicks: isDisplayTicks,
				// displayTicks: displayTicks
			};
		},

		// ----------------------
		// scale.linearbase.js Replacement
		// ----------------------

		ticksReverse: function() {
			var me = this;
			me.ticks.reverse();
			me.tickLevels.reverse();
			// me.isDisplayTicks.reverse();
			// me.displayTicks.reverse();
		},

		handleDirectionalChanges: function() {
			var me = this;
			if (!me.isHorizontal()) {
				// We are in a vertical orientation. The top value is the highest. So reverse the array
				// this.ticks.reverse();
				me.ticksReverse();
			}
		},

		// Compute an tick number upper limit depending on display area.
		getTickLimit: function() {
			var me = this;
			var maxTicks;
			var optsTick = me.options.ticks;

			if (me.isHorizontal()) {
				maxTicks = Math.min(optsTick.maxTicksLimit? optsTick.maxTicksLimit: 11, Math.ceil(me.width / 50));
			} else {
				// The factor of 1.5 used to scale the font size has been experimentally determined.
				var tickFontSize = helpers.getValueOrDefault(optsTick.fontSize, Chart.defaults.global.defaultFontSize);
				maxTicks = Math.min(optsTick.maxTicksLimit? optsTick.maxTicksLimit: 11, Math.ceil(me.height / (1.5 * tickFontSize)));
			}
			// Minimum is 2.
			return Math.max(2, maxTicks);
		},

		// Build of ticks
		buildTicks: function() {
			var me = this;
			// constant of sub scale max.
			me.levelMax = 3;
			// options
			var opts = me.options;
			var optsTick = [opts.ticks, opts.subScale.ticks, opts.subScale.subScale.ticks];

			var numericGeneratorOptions = {
				maxTicks: me.getTickLimit(),
				min: optsTick[0].min,
				max: optsTick[0].max,
				stepSize: helpers.getValueOrDefault(optsTick[0].fixedStepSize, optsTick[0].stepSize),
				optsTick: optsTick,
				levelMax: me.levelMax
			};
			var fineLinear = me.fineLinear(numericGeneratorOptions, me);
			me.ticks = fineLinear.ticks;
			me.tickLevels = fineLinear.levels;
			// me.isDisplayTicks = fineLinear.isDisplayTicks;
			// me.displayTicks = fineLinear.displayTicks;
			// At this point, we need to update our max and min given the tick values
			// since we have expanded the range of the scale
			me.max = fineLinear.max;
			me.min = fineLinear.min;
			me.handleDirectionalChanges();

			// Handling the reverse option.
			if (optsTick[0].reverse) {
				// ticks.reverse();
				me.ticksReverse();
				me.start = me.max;
				me.end = me.min;
			} else {
				me.start = me.min;
				me.end = me.max;
			}
		},

	});

	// regist fineLinear
	Chart.scaleService.registerScaleType('fineLinear', fineLinearScale, defaultConfig);
};

},{}],4:[function(require,module,exports){
'use strict';

module.exports = function(Chart) {

	// Fine linear scale default config
	var defaultConfig = {
		// for scale (level:0)
		position: 'left',
		ticks: {
			callback: Chart.Ticks.formatters.linear
		},

		// for sub scale (level:1)
		subScale: {
			display: true,
			ticks: {
				display: true,
				fontSize: 11,
			},
			gridLines: {
				display: true,
				drawTicks: true,
				color: 'rgba(0, 0, 0, 0.07)',
			},
			// for sub-sub scale (level:2)
			subScale: {
				display: true,
				ticks: {
					display: false,
					fontSize: 10,
				},
				gridLines: {
					display: true,
					drawTicks: true,
					color: 'rgba(0, 0, 0, 0.03)',
				},
			}
		}
	};

	// Fine linear scale
	var baseScale = Chart.scaleService.getScaleConstructor('linear').extend(Chart.FineScale);
	var fineLinearCompatibilityModeScale = baseScale;

	// regist fineLinear
	Chart.scaleService.registerScaleType('fineLinearCompatibilityMode', fineLinearCompatibilityModeScale, defaultConfig);
};

},{}],5:[function(require,module,exports){
'use strict';

// var moment = require('moment');
// moment = typeof(moment) === 'function' ? moment : window.moment;

module.exports = function(Chart) {

	var helpers = Chart.helpers;
	var time = {
		units: [{
			name: 'millisecond',
			steps: [1, 2, 5, 10, 20, 50, 100, 250, 500]
		}, {
			name: 'second',
			steps: [1, 2, 5, 10, 30]
		}, {
			name: 'minute',
			steps: [1, 2, 5, 10, 30]
		}, {
			name: 'hour',
			steps: [1, 2, 3, 6, 12]
		}, {
			name: 'day',
			steps: [1, 2, 5]
		}, {
			name: 'week',
			maxStep: 4
		}, {
			name: 'month',
			maxStep: 3
		}, {
			name: 'quarter',
			maxStep: 4
		}, {
			name: 'year',
			maxStep: false
		}]
	};

	// Fine time scale default config
	var defaultConfig = {
		position: 'bottom',
		time: {
			parser: false, // false == a pattern string from http://momentjs.com/docs/#/parsing/string-format/ or a custom callback that converts its argument to a moment
			format: false, // DEPRECATED false == date objects, moment object, callback or a pattern string from http://momentjs.com/docs/#/parsing/string-format/
			unit: false, // false == automatic or override with week, month, year, etc.
			round: false, // none, or override with week, month, year, etc.
			displayFormat: false, // DEPRECATED
			isoWeekday: false, // override week start day - see http://momentjs.com/docs/#/get-set/iso-weekday/
			minUnit: 'millisecond',

			// defaults to unit's corresponding unitFormat below or override using pattern string from http://momentjs.com/docs/#/displaying/format/
			displayFormats: {
				millisecond: 'h:mm:ss.SSS a', // 11:20:01.123 AM,
				second: 'h:mm:ss a', // 11:20:01 AM
				minute: 'h:mm:ss a', // 11:20:01 AM
				hour: 'MMM D, hA', // Sept 4, 5PM
				day: 'll', // Sep 4 2015
				week: 'll', // Week 46, or maybe "[W]WW - YYYY" ?
				month: 'MMM YYYY', // Sept 2015
				quarter: '[Q]Q - YYYY', // Q3
				year: 'YYYY' // 2015
			}
		},
		ticks: {
			autoSkip: false
		},
		// --------------
		// for sub scale (level:1)
		subScale: {
			display: true,
			ticks: {
				display: true,
				fontSize: 11,
			},
			gridLines: {
				display: true,
				drawTicks: true,
				color: 'rgba(0, 0, 0, 0.07)',
			},
			// for sub-sub scale (level:2)
			subScale: {
				display: true,
				ticks: {
					display: false,
					fontSize: 10,
				},
				gridLines: {
					display: true,
					drawTicks: true,
					color: 'rgba(0, 0, 0, 0.03)',
				},
			}
		}
		// --------------

	};

	// Fine time scale
	var baseScale = Chart.scaleService.getScaleConstructor('time').extend(Chart.FineScale);
	var fineTimeScale = baseScale.extend({

		// Generator of fine time ticks data
		fineTime: function(generationOptions, dataRange) {

		},

		buildTicks: function() {
			var me = this;

			me.ctx.save();

			var tickFontSize = helpers.getValueOrDefault(me.options.ticks.fontSize, Chart.defaults.global.defaultFontSize);
			var tickFontStyle = helpers.getValueOrDefault(me.options.ticks.fontStyle, Chart.defaults.global.defaultFontStyle);
			var tickFontFamily = helpers.getValueOrDefault(me.options.ticks.fontFamily, Chart.defaults.global.defaultFontFamily);
			var tickLabelFont = helpers.fontString(tickFontSize, tickFontStyle, tickFontFamily);

			me.ctx.font = tickLabelFont;

			me.ticks = [];
			me.unitScale = 1; // How much we scale the unit by, ie 2 means 2x unit per step
			me.scaleSizeInUnits = 0; // How large the scale is in the base unit (seconds, minutes, etc)

			// Set unit override if applicable
			if (me.options.time.unit) {
				me.tickUnit = me.options.time.unit || 'day';
				me.displayFormat = me.options.time.displayFormats[me.tickUnit];
				me.scaleSizeInUnits = me.lastTick.diff(me.firstTick, me.tickUnit, true);
				me.unitScale = helpers.getValueOrDefault(me.options.time.unitStepSize, 1);
			} else {
				// Determine the smallest needed unit of the time
				var innerWidth = me.isHorizontal() ? me.width : me.height;

				// Crude approximation of what the label length might be
				var tempFirstLabel = me.tickFormatFunction(me.firstTick, 0, []);
				var tickLabelWidth = me.ctx.measureText(tempFirstLabel).width;
				var cosRotation = Math.cos(helpers.toRadians(me.options.ticks.maxRotation));
				var sinRotation = Math.sin(helpers.toRadians(me.options.ticks.maxRotation));
				tickLabelWidth = (tickLabelWidth * cosRotation) + (tickFontSize * sinRotation);
				var labelCapacity = innerWidth / (tickLabelWidth);

				// Start as small as possible
				me.tickUnit = me.options.time.minUnit;
				me.scaleSizeInUnits = me.lastTick.diff(me.firstTick, me.tickUnit, true);
				me.displayFormat = me.options.time.displayFormats[me.tickUnit];

				var unitDefinitionIndex = 0;
				var unitDefinition = time.units[unitDefinitionIndex];

				// While we aren't ideal and we don't have units left
				while (unitDefinitionIndex < time.units.length) {
					// Can we scale this unit. If `false` we can scale infinitely
					me.unitScale = 1;

					if (helpers.isArray(unitDefinition.steps) && Math.ceil(me.scaleSizeInUnits / labelCapacity) < helpers.max(unitDefinition.steps)) {
						// Use one of the predefined steps
						for (var idx = 0; idx < unitDefinition.steps.length; ++idx) {
							if (unitDefinition.steps[idx] >= Math.ceil(me.scaleSizeInUnits / labelCapacity)) {
								me.unitScale = helpers.getValueOrDefault(me.options.time.unitStepSize, unitDefinition.steps[idx]);
								break;
							}
						}

						break;
					} else if ((unitDefinition.maxStep === false) || (Math.ceil(me.scaleSizeInUnits / labelCapacity) < unitDefinition.maxStep)) {
						// We have a max step. Scale this unit
						me.unitScale = helpers.getValueOrDefault(me.options.time.unitStepSize, Math.ceil(me.scaleSizeInUnits / labelCapacity));
						break;
					} else {
						// Move to the next unit up
						++unitDefinitionIndex;
						unitDefinition = time.units[unitDefinitionIndex];

						me.tickUnit = unitDefinition.name;
						var leadingUnitBuffer = me.firstTick.diff(me.getMomentStartOf(me.firstTick), me.tickUnit, true);
						var trailingUnitBuffer = me.getMomentStartOf(me.lastTick.clone().add(1, me.tickUnit)).diff(me.lastTick, me.tickUnit, true);
						me.scaleSizeInUnits = me.lastTick.diff(me.firstTick, me.tickUnit, true) + leadingUnitBuffer + trailingUnitBuffer;
						me.displayFormat = me.options.time.displayFormats[unitDefinition.name];
					}
				}
			}

			var roundedStart;

			// Only round the first tick if we have no hard minimum
			if (!me.options.time.min) {
				me.firstTick = me.getMomentStartOf(me.firstTick);
				roundedStart = me.firstTick;
			} else {
				roundedStart = me.getMomentStartOf(me.firstTick);
			}

			// Only round the last tick if we have no hard maximum
			if (!me.options.time.max) {
				var roundedEnd = me.getMomentStartOf(me.lastTick);
				var delta = roundedEnd.diff(me.lastTick, me.tickUnit, true);
				if (delta < 0) {
					// Do not use end of because we need me to be in the next time unit
					me.lastTick = me.getMomentStartOf(me.lastTick.add(1, me.tickUnit));
				} else if (delta >= 0) {
					me.lastTick = roundedEnd;
				}

				me.scaleSizeInUnits = me.lastTick.diff(me.firstTick, me.tickUnit, true);
			}

			// Tick displayFormat override
			if (me.options.time.displayFormat) {
				me.displayFormat = me.options.time.displayFormat;
			}

			// first tick. will have been rounded correctly if options.time.min is not specified
			me.ticks.push(me.firstTick.clone());

			// For every unit in between the first and last moment, create a moment and add it to the ticks tick
			for (var i = 1; i <= me.scaleSizeInUnits; ++i) {
				var newTick = roundedStart.clone().add(i, me.tickUnit);

				// Are we greater than the max time
				if (me.options.time.max && newTick.diff(me.lastTick, me.tickUnit, true) >= 0) {
					break;
				}

				if (i % me.unitScale === 0) {
					me.ticks.push(newTick);
				}
			}

			// Always show the right tick
			var diff = me.ticks[me.ticks.length - 1].diff(me.lastTick, me.tickUnit);
			if (diff !== 0 || me.scaleSizeInUnits === 0) {
				// this is a weird case. If the <max> option is the same as the end option, we can't just diff the times because the tick was created from the roundedStart
				// but the last tick was not rounded.
				if (me.options.time.max) {
					me.ticks.push(me.lastTick.clone());
					me.scaleSizeInUnits = me.lastTick.diff(me.ticks[0], me.tickUnit, true);
				} else {
					me.ticks.push(me.lastTick.clone());
					me.scaleSizeInUnits = me.lastTick.diff(me.firstTick, me.tickUnit, true);
				}
			}

			me.ctx.restore();

			// Invalidate label diffs cache
			me.labelDiffs = undefined;
		},


	});

	// regist fineTime
	Chart.scaleService.registerScaleType('fineTime', fineTimeScale, defaultConfig);
};

},{}]},{},[1]);
