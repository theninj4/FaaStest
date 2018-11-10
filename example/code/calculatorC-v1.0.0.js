'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var calculatorV1_0_0Raw = createCommonjsModule(function (module) {
const calculator = module.exports = { };

calculator.add = function (payload) {
  return payload.a + payload.b
};
});

module.exports = calculatorV1_0_0Raw;
