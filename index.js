'use strict';
var fetch = require('node-fetch');
var Agent = require('https-proxy-agent');
var registryUrl = require('registry-url');
var Promise = require('pinkie-promise');
var config = require('rc')('npm');

function get(keyword, level) {
	if (typeof keyword !== 'string') {
		return Promise.reject(new TypeError('Keyword must be a string'));
	}

	keyword = encodeURIComponent(keyword);

	var url = registryUrl() +
		'-/_view/byKeyword?' +
		'startkey=[%22' + keyword + '%22]' +
		'&endkey=[%22' + keyword + '%22,%7B%7D]' +
		'&group_level=' + level;

	var options = {};

	var proxy = process.env.https_proxy || config['https-proxy'] || config.proxy;

	if(proxy){
		var agent = new Agent(proxy);
		options.agent = agent;
	}

	return fetch(url, options).then(function (res) {
		if (!res.ok) {
			throw Error(res.statusText);
		}
		return res.json();
	}).then(function(json){
		return json.rows;
	})
}

module.exports = function (keyword) {
	return get(keyword, 3).then(function (data) {
		return data.map(function (el) {
			return {
				name: el.key[1],
				description: el.key[2]
			};
		});
	});
};

module.exports.names = function (keyword) {
	return get(keyword, 2).then(function (data) {
		return data.map(function (el) {
			return el.key[1];
		});
	});
};

module.exports.count = function (keyword) {
	return get(keyword, 1).then(function (data) {
		return data[0] ? data[0].value : 0;
	});
};
