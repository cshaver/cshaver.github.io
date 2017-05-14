var moment = require('moment');

var helpers = {
	formatDate: function(date, format) {
		if (date) {
			return moment(date).format(format);
		}
	},
	json: function(object) {
		return JSON.stringify(object, null, 2);
	},
	eq: function(a, b, options) {
		if (options.fn) {
			return a === b ? options.fn(this) : options.inverse(this);
		} else {
			return a === b;
		}
	},
	join: function(...args) {
		let options = args.splice(-1, 1);
		let separator = '';
		if (options.hash && options.separator) {
			separator = options.separator;
		}
		return args.join(separator);
	}
};

module.exports = function(hexo) {
	return helpers;
};
