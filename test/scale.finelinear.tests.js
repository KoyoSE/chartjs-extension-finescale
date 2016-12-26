describe('fineLinear Scale', function() {
	it('Should register the constructor with the scale service', function() {
		var Constructor = Chart.scaleService.getScaleConstructor('fineLinear');
		expect(Constructor).not.toBe(undefined);
		expect(typeof Constructor).toBe('function');
	});

	it('Should have the correct default config', function() {
		var defaultConfig = Chart.scaleService.getScaleDefaults('fineLinear');
		expect(defaultConfig).toEqual(
			{
				display: true,
				position: 'left',
				gridLines: {
					display: true,
					color: 'rgba(0, 0, 0, 0.1)',
					lineWidth: 1,
					drawBorder: true,
					drawOnChartArea: true,
					drawTicks: true,
					tickMarkLength: 10,
					zeroLineWidth: 1,
					zeroLineColor: 'rgba(0,0,0,0.25)',
					offsetGridLines: false,
					borderDash: [],
					borderDashOffset: 0
				},
				scaleLabel: {
					labelString: '',
					display: false
				},
				ticks: {
					beginAtZero: false,
					minRotation: 0,
					maxRotation: 50,
					mirror: false,
					padding: 0,
					reverse: false,
					display: true,
					autoSkip: false,
					autoSkipPadding: 0,
					labelOffset: 0,
					callback: defaultConfig.ticks.callback,
				},
				subScale: {
					display: true,
					ticks: {
						display: true,
						fontSize: 11
					},
					gridLines: {
						display: true,
						drawTicks: true,
						color: 'rgba(0, 0, 0, 0.07)'
					},
					subScale: {
						display: true,
						ticks: {
							display: false,
							fontSize: 10
						},
						gridLines: {
							display: true,
							drawTicks: true,
							color: 'rgba(0, 0, 0, 0.03)'
						}
					}
				}
			});
		expect(defaultConfig.ticks.callback).toEqual(jasmine.any(Function));
	});

	it('Should correctly determine the max & min data values', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [10, 5, 0, -5, 78, -100]
				}, {
					yAxisID: 'yScale1',
					data: [-1000, 1000],
				}, {
					yAxisID: 'yScale0',
					data: [150]
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}, {
						id: 'yScale1',
						type: 'fineLinear'
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.min).toBe(-100);
		expect(chart.scales.yScale0.max).toBe(200);
	});

	it('Should correctly determine the max & min of string data values', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: ['10', '5', '0', '-5', '78', '-100']
				}, {
					yAxisID: 'yScale1',
					data: ['-1000', '1000'],
				}, {
					yAxisID: 'yScale0',
					data: ['150']
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}, {
						id: 'yScale1',
						type: 'fineLinear'
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.min).toBe(-100);
		expect(chart.scales.yScale0.max).toBe(200);
	});

	it('Should correctly determine the max & min data values ignoring hidden datasets', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: ['10', '5', '0', '-5', '78', '-100']
				}, {
					yAxisID: 'yScale1',
					data: ['-1000', '1000'],
				}, {
					yAxisID: 'yScale0',
					data: ['150'],
					hidden: true
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}, {
						id: 'yScale1',
						type: 'fineLinear'
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.min).toBe(-100);
		expect(chart.scales.yScale0.max).toBe(100);
	});

	it('Should correctly determine the max & min data values ignoring data that is NaN', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [null, 90, NaN, undefined, 45, 30, Infinity, -Infinity]
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}]
				}
			}
		});

		expect(chart.scales.yScale0.min).toBe(0);
		expect(chart.scales.yScale0.max).toBe(100);

		// Scale is now stacked
		chart.scales.yScale0.options.stacked = true;
		chart.update();

		expect(chart.scales.yScale0.min).toBe(0);
		expect(chart.scales.yScale0.max).toBe(100);
	});

	it('Should correctly determine the max & min for scatter data', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: [{
						x: 10,
						y: 100
					}, {
						x: -10,
						y: 0
					}, {
						x: 0,
						y: 0
					}, {
						x: 99,
						y: 7
					}]
				}],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'fineLinear',
						position: 'bottom'
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}]
				}
			}
		});
		chart.update();

		expect(chart.scales.xScale0.min).toBe(-100);
		expect(chart.scales.xScale0.max).toBe(100);
		expect(chart.scales.yScale0.min).toBe(0);
		expect(chart.scales.yScale0.max).toBe(100);
	});

	it('Should correctly get the label for the given index', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: [{
						x: 10,
						y: 100
					}, {
						x: -10,
						y: 0
					}, {
						x: 0,
						y: 0
					}, {
						x: 99,
						y: 7
					}]
				}],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'fineLinear',
						position: 'bottom'
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}]
				}
			}
		});
		chart.update();

		expect(chart.scales.yScale0.getLabelForIndex(3, 0)).toBe(7);
	});

	it('Should correctly determine the min and max data values when stacked mode is turned on', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [10, 5, 0, -5, 78, -100],
					type: 'bar'
				}, {
					yAxisID: 'yScale1',
					data: [-1000, 1000],
				}, {
					yAxisID: 'yScale0',
					data: [150, 0, 0, -100, -10, 9],
					type: 'bar'
				}, {
					yAxisID: 'yScale0',
					data: [10, 10, 10, 10, 10, 10],
					type: 'line'
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						stacked: true
					}, {
						id: 'yScale1',
						type: 'fineLinear'
					}]
				}
			}
		});
		chart.update();

		expect(chart.scales.yScale0.min).toBe(-200);
		expect(chart.scales.yScale0.max).toBe(200);
	});

	it('Should correctly determine the min and max data values when stacked mode is turned on and there are hidden datasets', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [10, 5, 0, -5, 78, -100],
				}, {
					yAxisID: 'yScale1',
					data: [-1000, 1000],
				}, {
					yAxisID: 'yScale0',
					data: [150, 0, 0, -100, -10, 9],
				}, {
					yAxisID: 'yScale0',
					data: [10, 20, 30, 40, 50, 60],
					hidden: true
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						stacked: true
					}, {
						id: 'yScale1',
						type: 'fineLinear'
					}]
				}
			}
		});
		chart.update();

		expect(chart.scales.yScale0.min).toBe(-200);
		expect(chart.scales.yScale0.max).toBe(200);
	});

	it('Should correctly determine the min and max data values when stacked mode is turned on there are multiple types of datasets', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					type: 'bar',
					data: [10, 5, 0, -5, 78, -100]
				}, {
					type: 'line',
					data: [10, 10, 10, 10, 10, 10],
				}, {
					type: 'bar',
					data: [150, 0, 0, -100, -10, 9]
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						stacked: true
					}]
				}
			}
		});

		chart.scales.yScale0.determineDataLimits();
		expect(chart.scales.yScale0.min).toBe(-105);
		expect(chart.scales.yScale0.max).toBe(160);
	});

	it('Should ensure that the scale has a max and min that are not equal', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.min).toBe(-1);
		expect(chart.scales.yScale0.max).toBe(1);
	});

	it('Should ensure that the scale has a max and min that are not equal when beginAtZero is set', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						ticks: {
							beginAtZero: true
						}
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.min).toBe(0);
		expect(chart.scales.yScale0.max).toBe(1);
	});

	it('Should use the suggestedMin and suggestedMax options', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [1, 1, 1, 2, 1, 0]
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						ticks: {
							suggestedMax: 10,
							suggestedMin: -10
						}
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.min).toBe(-10);
		expect(chart.scales.yScale0.max).toBe(10);
	});

	it('Should use the min and max options', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [1, 1, 1, 2, 1, 0]
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						ticks: {
							max: 1010,
							min: -1010
						}
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.min).toBe(-1010);
		expect(chart.scales.yScale0.max).toBe(1010);
		expect(chart.scales.yScale0.ticks[0]).toBe('1010');
		expect(chart.scales.yScale0.ticks[chart.scales.yScale0.ticks.length - 1]).toBe('-1010');
	});

	it('Should use min, max and stepSize to create fixed spaced ticks', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [10, 3, 6, 8, 3, 1]
				}],
				labels: ['a', 'b', 'c', 'd', 'e', 'f']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						ticks: {
							min: 1,
							max: 11,
							stepSize: 2
						}
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.min).toBe(1);
		expect(chart.scales.yScale0.max).toBe(11);
		expect(chart.scales.yScale0.ticks).toEqual(['11', '9', '7', '5', '3', '1']);
	});


	it('should forcibly include 0 in the range if the beginAtZero option is used', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [20, 30, 40, 50]
				}],
				labels: ['a', 'b', 'c', 'd']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
					}]
				}
			}
		});

		expect(chart.scales.yScale0).not.toEqual(undefined); // must construct
		expect(chart.scales.yScale0.ticks).toEqual(['50', '49', '48', '47', '46', '45', '44', '43', '42', '41', '40', '39', '38', '37', '36', '35', '34', '33', '32', '31', '30', '29', '28', '27', '26', '25', '24', '23', '22', '21', '20']);

		chart.scales.yScale0.options.ticks.beginAtZero = true;
		chart.update();
		expect(chart.scales.yScale0.ticks).toEqual(['50', '49', '48', '47', '46', '45', '44', '43', '42', '41', '40', '39', '38', '37', '36', '35', '34', '33', '32', '31', '30', '29', '28', '27', '26', '25', '24', '23', '22', '21', '20', '19', '18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0']);

		chart.data.datasets[0].data = [-20, -30, -40, -50];
		chart.update();
		expect(chart.scales.yScale0.ticks).toEqual(['0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10', '-11', '-12', '-13', '-14', '-15', '-16', '-17', '-18', '-19', '-20', '-21', '-22', '-23', '-24', '-25', '-26', '-27', '-28', '-29', '-30', '-31', '-32', '-33', '-34', '-35', '-36', '-37', '-38', '-39', '-40', '-41', '-42', '-43', '-44', '-45', '-46', '-47', '-48', '-49', '-50']);

		chart.scales.yScale0.options.ticks.beginAtZero = false;
		chart.update();
		expect(chart.scales.yScale0.ticks).toEqual(['-20', '-21', '-22', '-23', '-24', '-25', '-26', '-27', '-28', '-29', '-30', '-31', '-32', '-33', '-34', '-35', '-36', '-37', '-38', '-39', '-40', '-41', '-42', '-43', '-44', '-45', '-46', '-47', '-48', '-49', '-50']);
	});

	it('Should generate tick marks in the correct order in reversed mode', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [10, 5, 0, 25, 78]
				}],
				labels: ['a', 'b', 'c', 'd']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						ticks: {
							reverse: true
						}
					}]
				}
			}
		});

		expect(chart.scales.yScale0.ticks).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85', '90', '95', '100']);
		expect(chart.scales.yScale0.start).toBe(100);
		expect(chart.scales.yScale0.end).toBe(0);
	});

	it('should use the correct number of decimal places in the default format function', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [0.06, 0.005, 0, 0.025, 0.0078]
				}],
				labels: ['a', 'b', 'c', 'd']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
					}]
				}
			}
		});
		expect(chart.scales.yScale0.ticks).toEqual(['0.1', '0.095', '0.09', '0.085', '0.08', '0.075', '0.07', '0.065', '0.06', '0.055', '0.05', '0.045', '0.04', '0.035', '0.03', '0.025', '0.02', '0.015', '0.01', '0.005', '0']);
	});

	it('Should build labels using the user supplied callback', function() {
		var chart = window.acquireChart({
			type: 'bar',
			data: {
				datasets: [{
					yAxisID: 'yScale0',
					data: [10, 5, 0, 25, 78]
				}],
				labels: ['a', 'b', 'c', 'd']
			},
			options: {
				scales: {
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						ticks: {
							callback: function(value, index) {
								return index.toString();
							}
						}
					}]
				}
			}
		});

		// Just the index
		expect(chart.scales.yScale0.ticks).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']);
	});

	it('Should get the correct pixel value for a point', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: []
				}],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'fineLinear',
						position: 'bottom'
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}]
				}
			}
		});

		var xScale = chart.scales.xScale0;
		expect(xScale.getPixelForValue(1, 0, 0)).toBeCloseToPixel(506); // right - paddingRight
		expect(xScale.getPixelForValue(-1, 0, 0)).toBeCloseToPixel(31); // left + paddingLeft
		expect(xScale.getPixelForValue(0, 0, 0)).toBeCloseToPixel(268); // halfway*/

		expect(xScale.getValueForPixel(506)).toBeCloseTo(1, 1e-2);
		expect(xScale.getValueForPixel(31)).toBeCloseTo(-1, 1e-2);
		expect(xScale.getValueForPixel(268)).toBeCloseTo(0, 1e-2);

		var yScale = chart.scales.yScale0;
		expect(yScale.getPixelForValue(1, 0, 0)).toBeCloseToPixel(32); // right - paddingRight
		expect(yScale.getPixelForValue(-1, 0, 0)).toBeCloseToPixel(484); // left + paddingLeft
		expect(yScale.getPixelForValue(0, 0, 0)).toBeCloseToPixel(258); // halfway*/

		expect(yScale.getValueForPixel(32)).toBe(1);
		expect(yScale.getValueForPixel(484)).toBe(-1);
		expect(yScale.getValueForPixel(258)).toBe(0);
	});

	it('should fit correctly', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: [{
						x: 10,
						y: 100
					}, {
						x: -10,
						y: 0
					}, {
						x: 0,
						y: 0
					}, {
						x: 99,
						y: 7
					}]
				}],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'fineLinear',
						position: 'bottom'
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear'
					}]
				}
			}
		});

		var xScale = chart.scales.xScale0;
		expect(xScale.paddingTop).toBeCloseToPixel(0);
		expect(xScale.paddingBottom).toBeCloseToPixel(0);
		expect(xScale.paddingLeft).toBeCloseToPixel(0);
		expect(xScale.paddingRight).toBeCloseToPixel(0);
		expect(xScale.width).toBeCloseToPixel(468);
		expect(xScale.height).toBeCloseToPixel(28);

		var yScale = chart.scales.yScale0;
		expect(yScale.paddingTop).toBeCloseToPixel(0);
		expect(yScale.paddingBottom).toBeCloseToPixel(0);
		expect(yScale.paddingLeft).toBeCloseToPixel(0);
		expect(yScale.paddingRight).toBeCloseToPixel(0);
		expect(yScale.width).toBeCloseToPixel(30);
		expect(yScale.height).toBeCloseToPixel(452);

		// Extra size when scale label showing
		xScale.options.scaleLabel.display = true;
		yScale.options.scaleLabel.display = true;
		chart.update();

		expect(xScale.paddingTop).toBeCloseToPixel(0);
		expect(xScale.paddingBottom).toBeCloseToPixel(0);
		expect(xScale.paddingLeft).toBeCloseToPixel(0);
		expect(xScale.paddingRight).toBeCloseToPixel(0);
		expect(xScale.width).toBeCloseToPixel(450);
		expect(xScale.height).toBeCloseToPixel(46);

		expect(yScale.paddingTop).toBeCloseToPixel(0);
		expect(yScale.paddingBottom).toBeCloseToPixel(0);
		expect(yScale.paddingLeft).toBeCloseToPixel(0);
		expect(yScale.paddingRight).toBeCloseToPixel(0);
		expect(yScale.width).toBeCloseToPixel(48);
		expect(yScale.height).toBeCloseToPixel(434);
	});

	it('should fit correctly when display is turned off', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: [{
						x: 10,
						y: 100
					}, {
						x: -10,
						y: 0
					}, {
						x: 0,
						y: 0
					}, {
						x: 99,
						y: 7
					}]
				}],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'fineLinear',
						position: 'bottom'
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'fineLinear',
						gridLines: {
							drawTicks: false,
							drawBorder: false
						},
						scaleLabel: {
							display: false
						},
						ticks: {
							display: false,
							padding: 0
						}
					}]
				}
			}
		});

		var yScale = chart.scales.yScale0;
		expect(yScale.width).toBeCloseToPixel(0);
	});
});
