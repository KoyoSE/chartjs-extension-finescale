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
	var fineLinearCompatibilityModeScale = baseScale.extend({});

	// regist fineLinear
	Chart.scaleService.registerScaleType('fineLinearCompatibilityMode', fineLinearCompatibilityModeScale, defaultConfig);
};
