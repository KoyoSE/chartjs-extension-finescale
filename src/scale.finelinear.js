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
