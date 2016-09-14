/*
 * routes.js – модуль, содержащий маршруты
 */
/*jslint         node   : true, continue : true,
 devel  : true, indent : 2,    maxerr   : 50,
 newcap : true, nomen  : true, plusplus : true,
 regexp : true, sloppy : true, vars     : false,
 white  : true
 */
/*global */
// --------- НАЧАЛО ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ -----------
'use strict';
var
    configRoutes,
    crud = require('./crud'),
    chat = require('./chat'),
    makeMongoId = crud.makeMongoId;
// --------- КОНЕЦ ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ -----------

// ------------------- НАЧАЛО ОТКРЫТЫХ МЕТОДОВ ---------------------
configRoutes = function (app, server) {

    var agent_text = 'Добро пожаловать в современное одностраничное веб-приложение'
        + '(SPA). Благодаря почти повсеместному присутствию развитых браузеров и '
        + 'мощному оборудованию мы можем перенести в браузер большую часть'
        + ' веб-приложения, в том числе отрисовку HTML, данные и бизнес-логику.'
        + 'Клиент должен обращаться к серверу только для аутентификации и '
        + 'синхронизации данных. Это означает, что пользователи могут получить '
        + ' гибкие и удобные средства работы вне зависимости от способа выхода '
        + 'в сеть: с настольного ПК или с телефона по 3G-соединению.'
        + '<br><br>'
        + '<a href="/index.htm#page=home">В начало</a><br>'
        + '<a href="/index.htm#page=about">О программе</a><br>'
        + '<a href="/index.htm#page=buynow">Купить</a><br>'
        + '<a href="/index.htm#page=contact us">Контакты</a><br>';


    app.all('*', function (req, res, next) {
        if (req.headers['user-agent'] === 'Googlebot/2.1 (+http://www.googlebot.com/bot.html)') {
            res.contentType('text/html; charset=utf-8');
            res.end(agent_text);
        }
        else {
            next();
        }
    });

    app.get('/', function (request, response) {
        response.redirect('/spa.html');
    });
    app.all('/:obj_type/*?', function (request, response, next) {
        response.contentType('application/json; charset=utf-8');
        next();
    });
    app.get('/:obj_type/list', function (request, response) {
        crud.read(
            request.params.obj_type,
            {}, {},
            function (map_list) {
                response.send(map_list);
            }
        );
    });
    app.post('/:obj_type/create', function (request, response) {
        crud.construct(
            request.params.obj_type,
            request.body,
            function (result_map) {
                response.send(result_map);
            }
        );
    });
    app.get('/:obj_type/read/:id', function (request, response) {
        crud.read(
            request.params.obj_type,
            {_id: makeMongoId(request.params.id)},
            {},
            function (map_list) {
                response.send(map_list);
            }
        );
    });
    app.post('/:obj_type/update/:id', function (request, response) {
        crud.update(
            request.params.obj_type,
            {_id: makeMongoId(request.params.id)},
            request.body,
            function (result_map) {
                response.send(result_map);
            }
        );
    });
    app.get('/:obj_type/delete/:id', function (request, response) {
        crud.destroy(
            request.params.obj_type,
            {_id: makeMongoId(request.params.id)},
            function (result_map) {
                response.send(result_map);
            }
        );
    });

    chat.connect(server);
};
module.exports = {configRoutes: configRoutes};
// -------------------- КОНЕЦ ОТКРЫТЫХ МЕТОДОВ ---------------------