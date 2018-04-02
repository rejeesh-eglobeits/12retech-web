'use strict';

angular.module('usxs.filters', []).

	filter('capitalize', function() {
		return function(input) {
		  return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
		};
	}).
	
	filter('titlecase', function() {
		return function (input) {
			var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

			input = input.toLowerCase();
			return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
				if (index > 0 && index + match.length !== title.length &&
					match.search(smallWords) > -1 && title.charAt(index - 2) !== ':' &&
					(title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
					title.charAt(index - 1).search(/[^\s-]/) < 0) {
					return match.toLowerCase();
				}

				if (match.substr(1).search(/[A-Z]|\../) > -1) {
					return match;
				}

				return match.charAt(0).toUpperCase() + match.substr(1);
			});
		};
	}).
	
	filter('escape', function() {
		return function (input) {
			return encodeURIComponent(input).
             replace(/%40/gi, '@').
             replace(/%3A/gi, ':').
             replace(/%24/g, '$').
             replace(/%2C/gi, ',').
             replace(/%3B/gi, ';').
             replace(/%20/g, '-');
		};
	}).

	filter('escape_strict', function() {
		return function (input) {
			return input
			.replace(/[^\w\d]+/ig,'_');
		};
	});