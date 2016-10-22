var express = require('express');
var path = require('path');

var webpack = require('webpack');
var webpackConfig = require('./webpack.config.js');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');

var _collection = require('lodash/collection'); // find
var _util = require('lodash/util'); // matches

var app = express();

// Hot reloading
var compiler = webpack(webpackConfig);
app.use(webpackDevMiddleware(compiler, {
	noInfo: true, publicPath: webpackConfig.output.publicPath
}));
app.use(webpackHotMiddleware(compiler));
// End hot reloading

app.use(express.static('./public'));
app.use(express.static('./node_modules/bootstrap/dist'));

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

var server = app.listen(3000);

var connections = [];
var audience = [];
var title = 'Untitled Presentation';

var io = require('socket.io')(server);

io.on('connection', (client) => {
	client.emit('welcome', {
		title: title
	});

	connections.push(client);
	console.log('Connected: %s socket. Total: %s', client.id, connections.length);

	client.on('join', (payload) => {
		const newMember = {
			id: client.id,
			name: payload.name
		};

		client.emit('joined', newMember);
		audience.push(newMember);
		io.emit('audience', audience);
		console.log('Audience joined: %s', payload.name);
	});

	client.on('disconnect', () => {
		var memberDisconnected = _collection.find(audience, _util.matches({ id: client.id }));
		if (memberDisconnected) {
			audience.splice(audience.indexOf(memberDisconnected), 1);
			io.emit('audience', audience);
			console.log('Left: %s (%s audience members)', memberDisconnected.name, audience.length);
		}

		connections.splice(connections.indexOf(client), 1);
		client.disconnect();
		console.log('Disconnected: %s sockets remaining.', connections.length);
	});
});

console.log('Server running at http://localhost:3000');