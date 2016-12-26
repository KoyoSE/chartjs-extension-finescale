require('./core.fineScale')(Chart);
require('./core.fineTicks')(Chart);
require('./scale.fineLinear')(Chart);
require('./scale.fineTime')(Chart);
require('./overwrite.js')(Chart);

// test scales
require('./scale.linear2')(Chart);
require('./scale.fineLinearCompatibilityMode')(Chart);
