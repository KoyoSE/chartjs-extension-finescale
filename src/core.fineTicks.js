'use strict';

module.exports = function(Chart) {

	var helpers = Chart.helpers;

	/**
	 * Namespace to hold static tick generation functions
	 * @namespace Chart.Ticks
	 */
	Chart.FineTicks = {
		generators: {
			// niceNum for fineScale
			// helpers.niceNumForFineScale = function(range, round, maxTicks, level) {
			niceNumForFineScale: function(range, round, maxTicks) {
				var tickRange = maxTicks? range / (maxTicks - 1): range;
				var exponent = Math.floor(helpers.log10(tickRange));
				var fraction = tickRange / Math.pow(10, exponent);
				var niceFraction;
				if (round) {
					niceFraction = 	fraction <= 1? 5:
									10;
				} else {
					niceFraction = 	fraction <= 1? 1:
									fraction <= 2? 2:
									fraction <= 5? 5:
									10;
				}
				return niceFraction * Math.pow(10, exponent);
			},

			// Generator of fine linear ticks data
			fineLinear: function(generationOptions, dataRange, callback) {
				var me = this;
				// for return
				var ticks = [];
				var levels = [];

				// var niceNum = callback? callback: helpers.niceNumForFineScale;
				var niceNum = callback? callback: me.niceNumForFineScale;
				var niceRange = niceNum(dataRange.max - dataRange.min, false);
				var stepSize = [];
				stepSize[0] = niceNum(niceRange, true, generationOptions.maxTicks, 0);
				stepSize[1] = niceNum(stepSize[0], true, 11, 1);
				stepSize[2] = niceNum(stepSize[1], true, 11, 2);
				// Pointer of minimum stepSize.
				var pointerStepSize = 2;
				// var isRev = dataRange.max < dataRange.min;
				// var min = isRev? dataRange.max: dataRange.min;
				// var max = isRev? dataRange.min: dataRange.max;

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
				// If min, max and stepSize is set and they make an evenly spaced scale use it.
				if (generationOptions.min && generationOptions.max && generationOptions.stepSize) {
					// If very close to our whole number, use it.
					// if (helpers.almostWhole((generationOptions.max - generationOptions.min) / generationOptions.stepSize, spacing / 1000)) {
					niceMin = generationOptions.min;
					niceMax = generationOptions.max;
					// }
				}
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

				// ----
				// Calculation of scale level (0-2)
				// nm : niceMin
				// tv: tickValue
				// ss: stepSize[]
				// mc: magnification
				// ----
				var level, tickValue;
				var getLevel = function(nm, tv, ss, mc) {
					// Level discrimination
					var t1 = (tv - nm) / mc % (ss[0] / mc);
					var t2 = (tv - nm) / mc % (ss[1] / mc);
					return t1 === 0? 0: (t2 === 0? 1: 2);
				};

				// Number of tick for loop
				var stepCount = +(((niceMax - niceMin) / stepSize[pointerStepSize]).toFixed(stepSizeDicimal[pointerStepSize].digits));
				// --push start tick--
				ticks.push(startTick);
				levels.push(getLevel(niceMin, startTick, stepSize, stepSizeDicimal[pointerStepSize].magnification));
				for (var index = 1; index < stepCount; index++) {
					tickValue = +(niceMin + index * stepSize[pointerStepSize]).toFixed(stepSizeDicimal[pointerStepSize].digits);
					if ((tickValue <= startTick) || (endTick <= tickValue)) {
						continue;
					}
					level = getLevel(niceMin, tickValue, stepSize, stepSizeDicimal[pointerStepSize].magnification);
					// --push ticks--
					ticks.push(+((tickValue).toFixed(stepSizeDicimal[level].digits)));
					levels.push(level);
				}
				// --push end tick--
				ticks.push(endTick);
				levels.push(getLevel(niceMin, endTick, stepSize, stepSizeDicimal[pointerStepSize].magnification));

				// -------
				return {
					ticks: ticks,
					levels: levels,
					min: startTick,
					max: endTick,
				};
			}
		}
	};
};
