/*
 * app.js – простой сервер на основе Express
 */

// --------- НАЧАЛО ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ -----------
'use strict';
var
    http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app);
// ---------- КОНЕЦ ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ -----------
// ------------------ НАЧАЛО КОНФИГУРАЦИИ СЕРВЕРА -------------------
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});
app.configure('development', function () {
    app.use(express.logger());
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});
app.configure('production', function () {
    app.use(express.errorHandler());
});
app.get('/', function (request, response) {
    response.redirect('/spa.html');
});
// ------------------- КОНЕЦ КОНФИГУРАЦИИ СЕРВЕРА -------------------
// -------------------- НАЧАЛО ЗАПУСКА СЕРВЕРА ----------------------
server.listen(3000);
console.log(
    'Express-сервер прослушивает порт %d в режиме %s',
    server.address().port, app.settings.env
);
// --------------------- КОНЕЦ ЗАПУСКА СЕРВЕРА ----------------------