var moment = require('moment');

var helpers = {
	formatDate: function(date, format) {
		if (date) {
			return moment(date).format(format);
		}
	},
	json: function(object) {
		return JSON.stringify(object, null, 2);
	}
};

module.exports = function(hexo) {
	return helpers;
};
