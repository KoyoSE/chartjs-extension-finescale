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

},{"2":2}],2:[function(require,module,exports){
module.exports = function(Chart) {

	'use strict';

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
	var fineLinearScale = Chart.scaleService.getScaleConstructor('linear').extend({

		// ----------------------
		// core.helpers.js Replacement
		// ----------------------

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
		// core.ticks.js linear functionReplacement
		// ----------------------

		getDicimalDigits: function(value) {

			value = value === 0 ? 1 : value;
			var exponent = Math.floor(helpers.log10(value));

			return {
				digits: exponent > 0 ? 0 : Math.abs(exponent),
				magnification: Math.pow(10, exponent)
			};
		},

		// get scale level 0-2
		getLevel: function(tickValue, stepSize, magnification) {
			// Level discrimination
			var t1 = (tickValue / magnification) % (stepSize[0] / magnification);
			var t2 = (tickValue / magnification) % (stepSize[1] / magnification);
			return t1 === 0 ? 0 : (t2 === 0 ? 1 : 2);
		},

		// Generator of fine linear ticks data
		fineLinear: function(generationOptions, dataRange) {

			var me = this;
			var ticks = [];
			var levels = [];
			var isDisplayTicks = [];
			var displayTicks = [];

			var tickOpts = [me.options.ticks, me.options.subScale.ticks, me.options.subScale.subScale.ticks];

			var niceRange = me.niceNum(dataRange.max - dataRange.min, false);
			var stepSize = [];
			stepSize[0] = me.niceNum(niceRange / (generationOptions.maxTicks - 1), true);
			stepSize[1] = me.niceNum(stepSize[0] / 10, true);
			stepSize[2] = me.niceNum(stepSize[1] / 10, true);
			var stepSizeLevel = 2;

			// process of stepSize option
			if (generationOptions.stepSize && generationOptions.stepSize > 0) {
				var value = generationOptions.stepSize;
				for (var i = 0; i < me.levelMax; i++) {
					if (stepSize[i] <= generationOptions.stepSize) {
						stepSize[i] = value;
						stepSizeLevel = value !== 0 ? i : stepSizeLevel;
						value = 0;
					}
				}
				stepSize[stepSizeLevel] = stepSize[stepSizeLevel] > generationOptions.stepSize ? generationOptions.stepSize : stepSize[stepSizeLevel];
			}

			var niceMin = Math.floor(dataRange.min / stepSize[0]) * stepSize[0];
			var niceMax = Math.ceil(dataRange.max / stepSize[0]) * stepSize[0];

			// process of min max stepSize option
			// if (generationOptions.min && generationOptions.max && generationOptions.stepSize) {
			// 	// minMax Delta Divisible By Step Size
			// 	var minMaxDDBSS = ((generationOptions.max - generationOptions.min) % generationOptions.stepSize) === 0;
			// 	if (minMaxDDBSS) {
			// 		niceMin = generationOptions.min;
			// 		niceMax = generationOptions.max;
			// 	}
			// }
			var startTick = generationOptions.min !== undefined ? generationOptions.min : niceMin;
			var endTick = generationOptions.max !== undefined ? generationOptions.max : niceMax;

			// Calculation parameters
			var stepSizeDicimal = [
				me.getDicimalDigits(stepSize[0]),
				me.getDicimalDigits(stepSize[1]),
				me.getDicimalDigits(stepSize[2])
			];

			// -------

			// Create ticks data
			var level, tickValue;
			// Number of tick marks for loop
			var stepCount = +(((niceMax - niceMin) / stepSize[stepSizeLevel]).toFixed(stepSizeDicimal[stepSizeLevel].digits));
			// --push start tick --
			ticks.push(startTick);
			levels.push(me.getLevel(startTick, stepSize, stepSizeDicimal[stepSizeLevel].magnification));
			for (var index = 1; index < stepCount; ++index) {
				tickValue = niceMin + +((index * stepSize[stepSizeLevel]).toFixed(stepSizeDicimal[stepSizeLevel].digits));
				if ((tickValue <= startTick) || (endTick <= tickValue)) {
					continue;
				}
				level = me.getLevel(tickValue, stepSize, stepSizeDicimal[stepSizeLevel].magnification);
				// --push ticks--
				ticks.push(+((tickValue).toFixed(stepSizeDicimal[level].digits)));
				levels.push(level);
			}
			// --push end tick --
			ticks.push(endTick);
			levels.push(me.getLevel(endTick, stepSize, stepSizeDicimal[stepSizeLevel].magnification));

			// -------

			var isDraw;
			// helpers.each(me.ticks, function(label, index) {
			for (index = 0; index < ticks.length; index++) {
				// 最初と最後は強制表示
				isDraw = index !== 0 ? (index !== ticks.length - 1 ? !!tickOpts[levels[index]].display : true) : true;
				isDisplayTicks.push(isDraw);
				if (isDraw) {
					displayTicks.push(ticks[index]);
				}
			}

			return {
				ticks: ticks,
				levels: levels,
				min: startTick,
				max: endTick,
				isDisplayTicks: isDisplayTicks,
				displayTicks: displayTicks
			};
		},

		// ----------------------
		// scale.linearbase.js Replacement
		// ----------------------

		ticksReverse: function() {
			var me = this;
			me.ticks.reverse();
			me.tickLevels.reverse();
			me.isDisplayTicks.reverse();
			me.displayTicks.reverse();
		},

		handleDirectionalChanges: function() {
			var me = this;
			if (!me.isHorizontal()) {
				// We are in a vertical orientation. The top value is the highest. So reverse the array
				// this.ticks.reverse();
				me.ticksReverse();
			}
		},

		getTickLimit: function() {
			var maxTicks;
			var me = this;
			var tickOpts = me.options.ticks;

			if (me.isHorizontal()) {
				maxTicks = Math.min(tickOpts.maxTicksLimit ? tickOpts.maxTicksLimit : 11, Math.ceil(me.width / 50));
			} else {
				// The factor of 2 used to scale the font size has been experimentally determined.(for linear type)
				// The finelinear scale sets the factor to 1.5.
				var tickFontSize = helpers.getValueOrDefault(tickOpts.fontSize, Chart.defaults.global.defaultFontSize);
				maxTicks = Math.min(tickOpts.maxTicksLimit ? tickOpts.maxTicksLimit : 11, Math.ceil(me.height / (1.5 * tickFontSize)));
			}

			return maxTicks;
		},

		buildTicks: function() {
			var me = this;
			me.levelMax = 3;

			var opts = me.options;
			var tickOpts = [opts.ticks, opts.subScale.ticks, opts.subScale.subScale.ticks];
			// var gridLinesOpts = [me.options.gridLines, me.options.subScale.gridLines, me.options.subScale.subScale.gridLines];

			var maxTicks = me.getTickLimit();
			maxTicks = Math.max(2, maxTicks);

			var numericGeneratorOptions = {
				maxTicks: maxTicks,
				min: tickOpts[0].min,
				max: tickOpts[0].max,
				stepSize: helpers.getValueOrDefault(tickOpts[0].fixedStepSize, tickOpts[0].stepSize)
			};

			var fineLinear = me.fineLinear(numericGeneratorOptions, me);
			me.ticks = fineLinear.ticks;
			me.tickLevels = fineLinear.levels;
			me.isDisplayTicks = fineLinear.isDisplayTicks;
			me.displayTicks = fineLinear.displayTicks;

			// 軸によって ticks をリバース
			me.handleDirectionalChanges();

			// At this point, we need to update our max and min given the tick values since we have expanded the
			// range of the scale
			me.max = fineLinear.max;
			me.min = fineLinear.min;

			// オプションによって ticksをリバース
			if (tickOpts[0].reverse) {
				// ticks.reverse();
				me.ticksReverse();
				me.start = me.max;
				me.end = me.min;
			} else {
				me.start = me.min;
				me.end = me.max;
			}
		},

		// ----------------------
		// core.scale.js Replacement
		// ----------------------

		// saito なぜ元を呼び出せないかを調べる。
		// getscale を使わなければ呼べる？

		computeTextSize: function(context, tick, font) {
			return helpers.isArray(tick) ?
				helpers.longestText(context, font, tick) :
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
		// @param {rectangle} chartArea : the area of the chart to draw full grid lines on
		draw: function(chartArea) {
			var me = this;
			var options = [me.options, me.options.subScale, me.options.subScale.subScale];

			if (!options[0].display) {
				return;
			}

			var context = me.ctx;

			var globalDefaults = Chart.defaults.global;

			// saito:
			var optionTicks = [options[0].ticks, options[1].ticks, options[2].ticks];
			var gridLines = [options[0].gridLines, options[1].gridLines, options[2].gridLines];
			var scaleLabel = [options[0].scaleLabel, options[1].scaleLabel, options[2].scaleLabel];

			// figure out the maximum number of gridlines to show
			var maxTicks;
			if (optionTicks[0].maxTicksLimit) {
				maxTicks = optionTicks[0].maxTicksLimit;
			}

			// for tick
			// var tickFontColor = helpers.getValueOrDefault(optionTicks[0].fontColor, globalDefaults.defaultFontColor);
			var tickFont = [
				me.parseFontOptions(optionTicks[0]),
				me.parseFontOptions(optionTicks[1]),
				me.parseFontOptions(optionTicks[2])
			];

			var tl = gridLines[0].drawTicks ? [
				gridLines[0].tickMarkLength,
				gridLines[1].drawTicks ? gridLines[1].tickMarkLength || gridLines[0].tickMarkLength * 0.6 : 0, // sub tick length
				gridLines[2].drawTicks ? gridLines[2].tickMarkLength || gridLines[0].tickMarkLength * 0.4 : 0  // sub-sub tick length
			] : [0, 0, 0];

			var itemsToDraw = [];

			// for label
			var scaleLabelFontColor = helpers.getValueOrDefault(scaleLabel[0].fontColor, globalDefaults.defaultFontColor);
			var scaleLabelFont = me.parseFontOptions(scaleLabel[0]);

			var isRotated = me.labelRotation !== 0;
			var skipRatio;
			var useAutoskipper = optionTicks[0].autoSkip;
			var isHorizontal = me.isHorizontal();

			var labelRotationRadians = helpers.toRadians(me.labelRotation);
			var cosRotation = Math.cos(labelRotationRadians);
			var longestRotatedLabel = me.longestLabelWidth * cosRotation;

			// 目盛り重なり防止処理
			// 水平軸の時、重なる目盛の表示スキップを、傾きによってスキップするかどうか判定
			if (isHorizontal) {
				// horizontal

				skipRatio = false;

				// Only calculate the skip ratio with the half width of longestRotateLabel if we got an actual rotation
				// See #2584
				if (isRotated) {
					longestRotatedLabel /= 2;
				}

				if ((longestRotatedLabel + optionTicks[0].autoSkipPadding) * me.ticks.length > (me.width - (me.paddingLeft + me.paddingRight))) {
					skipRatio = 1 + Math.floor(((longestRotatedLabel + optionTicks[0].autoSkipPadding) * me.ticks.length) / (me.width - (me.paddingLeft + me.paddingRight)));
				}

				// if they defined a max number of optionTicks,
				// increase skipRatio until that number is met
				if (maxTicks && me.ticks.length > maxTicks) {
					while (!skipRatio || me.ticks.length / (skipRatio || 1) > maxTicks) {
						if (!skipRatio) {
							skipRatio = 1;
						}
						skipRatio += 1;
					}
				}

				if (!useAutoskipper) {
					skipRatio = false;
				}

			}

			helpers.each(me.ticks, function(label, index) {
				// If the callback returned a null or undefined value, do not draw this line
				if (label === undefined || label === null) {
					return;
				}

				var level = me.tickLevels[index];
				if (!options[level].display) {
					return;
				}

				// --------------
				// 重なり防止処理
				var isLastTick = me.ticks.length === index + 1;
				var shouldSkip = (skipRatio > 1 && index % skipRatio > 0) || (index % skipRatio === 0 && index + skipRatio >= me.ticks.length);
				if (shouldSkip && !isLastTick || (label === undefined || label === null)) {
					return;
				}
				// --------------

				// for glidline border
				// オプション定義がない場合は Level=0 の設定に従う
				var borderDash = helpers.getValueOrDefault(gridLines[level].borderDash, gridLines[0].borderDash);
				var borderDashOffset = helpers.getValueOrDefault(gridLines[level].borderDashOffset, gridLines[0].borderDashOffset);
				var drawOnChartArea = helpers.getValueOrDefault(gridLines[level].drawOnChartArea, gridLines[0].drawOnChartArea);
				var display = gridLines[0].display ? gridLines[level].display : false;
				var drawTicks = gridLines[0].drawTicks ? gridLines[level].drawTicks : false;

				var lineWidth, lineColor;
				if (index === (typeof me.zeroLineIndex !== 'undefined' ? me.zeroLineIndex : 0)) {
					// Draw the first index specially
					lineWidth = gridLines[0].zeroLineWidth;
					lineColor = gridLines[0].zeroLineColor;
				} else {
					// for array setting
					lineWidth = helpers.isArray(gridLines[0].lineWidth) ? helpers.getValueAtIndexOrDefault(gridLines[0].lineWidth, index) : helpers.getValueAtIndexOrDefault(gridLines[level].lineWidth, index, gridLines[0].lineWidth);
					lineColor = helpers.isArray(gridLines[0].color) ? helpers.getValueAtIndexOrDefault(gridLines[0].color, index) : helpers.getValueAtIndexOrDefault(gridLines[level].color, index, gridLines[0].color);
				}

				// Common properties
				var tx1, ty1, tx2, ty2, x1, y1, x2, y2, labelX, labelY;
				var textAlign = 'middle';
				var textBaseline = 'middle';

				if (isHorizontal) {
					// horizontal

					// label
					if (options[0].position === 'bottom') {
						// bottom
						textBaseline = 'top';
						textAlign = !isRotated ? 'center' : 'right';
						labelY = (isRotated) ? me.top + tl[0] : me.top + tl[level]; // saito この１２はどうする？
					} else {
						// top
						textBaseline = 'bottom';
						textAlign = !isRotated ? 'center' : 'left';
						labelY = (isRotated) ? me.bottom - tl[0] : me.bottom - tl[level];
					}
					// x values for optionTicks (need to consider offsetLabel option)
					labelX = me.getPixelForTick(index, gridLines[0].offsetGridLines) + optionTicks[0].labelOffset;

					// ticks
					var xLineValue = me.getPixelForTick(index) + helpers.aliasPixel(lineWidth); // xvalues for tick & glid lines
					var yTickStart = options[0].position === 'bottom' ? me.top : me.bottom - tl[level];
					var yTickEnd = options[0].position === 'bottom' ? me.top + tl[level] : me.bottom;

					tx1 = tx2 = x1 = x2 = xLineValue;
					ty1 = yTickStart;
					ty2 = yTickEnd;
					// glid line
					y1 = chartArea.top;
					y2 = chartArea.bottom;

				} else {
					// vertical
					var isLeft = options[0].position === 'left';
					var tickPadding = optionTicks[0].padding;
					var labelXOffset;

					// label
					if (optionTicks[0].mirror) {
						textAlign = isLeft ? 'left' : 'right';
						labelXOffset = tickPadding;
					} else {
						textAlign = isLeft ? 'right' : 'left';
						labelXOffset = tl[level] + tickPadding;
					}

					labelX = isLeft ? me.right - labelXOffset : me.left + labelXOffset;

					var yLineValue = me.getPixelForTick(index); // xvalues for grid lines
					yLineValue += helpers.aliasPixel(lineWidth);
					labelY = me.getPixelForTick(index, gridLines[0].offsetGridLines);

					// ticks
					var xTickStart = options[0].position === 'right' ? me.left : me.right - tl[level];
					var xTickEnd = options[0].position === 'right' ? me.left + tl[level] : me.right;
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
					tlColor: gridLines[0].color,
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
					lFontColor: helpers.getValueOrDefault(optionTicks[level].fontColor, globalDefaults.defaultFontColor),
				});
			});

			// 表示処理
			// Draw all of the tick labels, tick marks, and grid lines at the correct places
			helpers.each(itemsToDraw, function(itemToDraw) {

				// グリッド線
				if (itemToDraw.display) {

					context.save();
					context.lineWidth = itemToDraw.glWidth;

					context.strokeStyle = itemToDraw.tlColor;

					context.beginPath();

					// グリッド 目盛りエリア
					if (itemToDraw.tlDraw) {
						context.moveTo(itemToDraw.tlX1, itemToDraw.tlY1);
						context.lineTo(itemToDraw.tlX2, itemToDraw.tlY2);
					}
					context.stroke();

					context.strokeStyle = itemToDraw.glColor;

					// 破線の設定
					if (context.setLineDash) {
						context.setLineDash(itemToDraw.glBorderDash);
						context.lineDashOffset = itemToDraw.glBorderDashOffset;
					}

					// グリッド チャートエリア
					if (itemToDraw.glDraw) {
						context.moveTo(itemToDraw.glX1, itemToDraw.glY1);
						context.lineTo(itemToDraw.glX2, itemToDraw.glY2);
					}
					context.stroke();
					context.restore();
				}

				// 目盛りテキスト表示
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

			// スケールの表題表示
			// rightの時ラベルの向きを左にする
			if (scaleLabel[0].display) {
				// Draw the scale label
				var scaleLabelX;
				var scaleLabelY;
				var rotation = 0;

				if (isHorizontal) {
					// horizontal
					scaleLabelX = me.left + ((me.right - me.left) / 2); // midpoint of the width
					scaleLabelY = options[0].position === 'bottom' ? me.bottom - (scaleLabelFont.size / 2) : me.top + (scaleLabelFont.size / 2);
				} else {
					// vertical
					var isLeft = options[0].position === 'left';
					scaleLabelX = isLeft ? me.left + (scaleLabelFont.size / 2) : me.right - (scaleLabelFont.size / 2);
					scaleLabelY = me.top + ((me.bottom - me.top) / 2);
					rotation = isLeft ? -0.5 * Math.PI : -0.5 * Math.PI;
				}

				context.save();
				context.translate(scaleLabelX, scaleLabelY);
				context.rotate(rotation);
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillStyle = scaleLabelFontColor; // render in correct colour
				context.font = scaleLabelFont.font;
				context.fillText(scaleLabel[0].labelString, 0, 0);
				context.restore();
			}

			// ボーダーの表示
			if (gridLines[0].drawBorder) {
				// return;
				// Draw the line at the edge of the axis
				context.lineWidth = helpers.getValueAtIndexOrDefault(gridLines[0].lineWidth, 0);
				context.strokeStyle = helpers.getValueAtIndexOrDefault(gridLines[0].color, 0);
				var x1 = me.left,
					x2 = me.right,
					y1 = me.top,
					y2 = me.bottom;

				var aliasPixel = helpers.aliasPixel(context.lineWidth);
				if (isHorizontal) {
					y1 = y2 = options[0].position === 'top' ? me.bottom : me.top;
					y1 += aliasPixel;
					y2 += aliasPixel;
				} else {
					x1 = x2 = options[0].position === 'left' ? me.right : me.left;
					x1 += aliasPixel;
					x2 += aliasPixel;
				}

				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.stroke();
			}
		},

		// 傾きの角度を求める
		// Prevention of overlap Tick
		calculateTickRotation: function() {

			var me = this;
			var context = me.ctx;
			var tickOpts = [me.options.ticks, me.options.subScale.ticks, me.options.subScale.subScale.ticks];
			// var gridLinesOpts = [me.options.gridLines, me.options.subScale.gridLines, me.options.subScale.subScale.gridLines];

			// Get the width of each grid by calculating the difference
			// between x offsets between 0 and 1.
			var tickFont = me.parseFontOptions(tickOpts[0]);
			// context.font = tickFont.font;

			var labelRotation = tickOpts[0].minRotation || 0;

			if (me.options.display) {

				if (me.isHorizontal()) {
					// 水平時

					// 表示されている目盛りから計算
					var originalLabelWidth = helpers.longestText(context, tickFont.font, me.displayTicks, me.longestTextCache);
					var labelWidth = originalLabelWidth;
					var cosRotation;
					var sinRotation;

					// Allow 3 pixels x2 padding either side for label readability
					// var tickWidthLeft = me.getPixelForTick(1) - me.getPixelForTick(0) - 6;
					// var tickWidthRight = me.getPixelForTick(me.isDisplayTicks.length - 1) - me.getPixelForTick(me.isDisplayTicks.length - 2) - 6;
					var tickWidthLeft = me.getPixelForValue(me.displayTicks[1]) - me.getPixelForValue(me.displayTicks[0]) - 6;
					var tickWidthRight = me.getPixelForValue(me.displayTicks[me.displayTicks.length - 1]) - me.getPixelForValue(me.displayTicks[me.displayTicks.length - 2]) - 6;

					var tickWidth = Math.min(tickWidthLeft, tickWidthRight);
					// Max label rotation can be set or default to 90 - also act as a loop counter
					while (labelWidth > tickWidth && labelRotation < tickOpts[0].maxRotation) {
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

					// saito 別関数にする。
					// 重なり防止処理 横軸
					// 最初と最後付近のラベル  saito
					// min max 指定時の重なり防止
					var pointer;
					angleRadians = helpers.toRadians(labelRotation);
					cosRotation = Math.cos(angleRadians);
					labelWidth = cosRotation * context.measureText(me.displayTicks[1]).width;
					if ((tickOpts[0].min !== undefined) && (tickWidthLeft < labelWidth)) {
						pointer = me.ticks.indexOf(me.displayTicks[1].toString(10));
						me.isDisplayTicks[pointer] = false;
					}
					labelWidth = cosRotation * context.measureText(me.displayTicks[me.isDisplayTicks.length - 1]).width;
					if ((tickOpts[0].max !== undefined) && (tickWidthRight < labelWidth)) {
						pointer = me.ticks.indexOf(me.displayTicks[me.displayTicks.length - 2].toString(10));
						me.isDisplayTicks[pointer] = false;
					}

				} else {
					// saito 別関数にする。
					// font size *1.2で縦サイズとする。
					// Math.round(18px * 1.2) = 22
					var tickHeight, labelHeight;
					tickHeight = me.getPixelForValue(me.displayTicks[1]) - me.getPixelForValue(me.displayTicks[0]);
					labelHeight = Math.round(tickFont.size * 1.2);
					if (tickHeight < labelHeight) {
						// pointer = me.displayTicksPointer[1];
						pointer = me.ticks.indexOf(me.displayTicks[1].toString(10));
						me.isDisplayTicks[pointer] = false;
					}
					tickHeight = me.getPixelForValue(me.displayTicks[me.displayTicks.length - 1]) - me.getPixelForValue(me.displayTicks[me.displayTicks.length - 2]);
					labelHeight = Math.round(tickFont.size * 1.2);
					if (tickHeight < labelHeight) {
						pointer = me.ticks.indexOf(me.displayTicks[me.displayTicks.length - 2].toString(10));
						me.isDisplayTicks[pointer] = false;
					}

				}
			}

			me.labelRotation = labelRotation;
		},


	});

	Chart.scaleService.registerScaleType('fineLinear', fineLinearScale, defaultConfig);

};

},{}]},{},[1]);
