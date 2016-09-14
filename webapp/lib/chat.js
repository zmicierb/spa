/*
 * chat.js – модуль обмена сообщениями в чате
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
    emitUserList, signIn, signOut,
    chatObj,
    socket = require('socket.io'),
    crud = require('./crud'),

    makeMongoId = crud.makeMongoId,
    chatterMap = {};
// ---------- КОНЕЦ ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ -----------

// ------------------- НАЧАЛО СЛУЖЕБНЫХ МЕТОДОВ ---------------------
// emitUserList – отправить список пользователей всем подключенным
//                клиентам
//
emitUserList = function (io) {
    crud.read(
        'user',
        {is_online: true},
        {},
        function (result_list) {
            io
                .of('/chat')
                .emit('listchange', result_list);
        }
    );
};
// signIn – обновить свойство is_online и объект chatterMap
//
signIn = function (io, user_map, socket) {
    crud.update(
        'user',
        {'_id': user_map._id},
        {is_online: true},
        function (result_map) {
            emitUserList(io);
            user_map.is_online = true;
            socket.emit('userupdate', user_map);
        }
    );
    chatterMap[user_map._id] = socket;
    socket.user_id = user_map._id;
};

// signOut – изменить свойство is_online и объект chatterMap
//
signOut = function (io, user_id) {
    crud.update(
        'user',
        {'_id': user_id},
        {is_online: false},
        function (result_list) {
            emitUserList(io);
        }
    );
    delete chatterMap[user_id];
};

// -------------------- КОНЕЦ СЛУЖЕБНЫХ МЕТОДОВ ---------------------

// ------------------- НАЧАЛО ОТКРЫТЫХ МЕТОДОВ ----------------------
chatObj = {
    connect: function (server) {
        var io = socket.listen(server);
        //Начало настройки объекта io
        io
            .set('blacklist', [])
            .of('/chat')
            .on('connection', function (socket) {
                    //начало обработчика сообщения / adduser /
                    // Описание: обеспечивает аутентификацию
                    //  Аргументы:  один  объект  user_map.
                    //   user_map должен обладать следующими свойствами:
                    //      name  =  имя  пользователя
                    //      cid    =  клиентский  идентификатор
                    //  Действие:
                    //   Если пользователь с указанным именем уже существует в
                    //Mongo, использовать существующий объект пользователя
                    // и игнорировать остальные данные.
                    // Если пользователя с указанным именем не существует в
                    //Mongo, создать новый объект и использовать его.
                    // Послать отправителю сообщение 'userupdate', завершив
                    // тем самым цикл аутентификации.В ответное сообщение
                    // включить клиентский идентификатор, чтобы клиент мог
                    // коррелировать его с пользователем, но не сохранять
                    // этот идентификатор в MongoDB.
                    // Пометить, что пользователь в онлайне, и отправить обновленный
                    // список пользователей в онлайне всем клиентам, в
                    // том числе тому, от которого поступило сообщение
                    // 'adduser'.//
                    socket.on('adduser', function (user_map) {
                        crud.read(
                            'user',
                            {name: user_map.name},
                            {is_online: false},
                            function (result_list) {
                                var
                                    result_map,
                                    cid = user_map.cid;
                                delete  user_map.cid;
                                //  использовать  существующего  пользователя  с  указанным  именем
                                if (result_list.length > 0) {
                                    result_map = result_list[0];
                                    result_map.cid = cid;
                                    signIn(io, result_map, socket);
                                }
                                //  создать  нового  пользователя с  указанным  именем
                                else {
                                    user_map.is_online = true;
                                    crud.construct(
                                        'user',
                                        user_map,
                                        function (result_list) {
                                            result_map = result_list[0];
                                            result_map.cid = cid;
                                            chatterMap[result_map._id] = socket;
                                            socket.user_id = result_map._id;
                                            socket.emit('userupdate', result_map);
                                            emitUserList(io);
                                        }
                                    );
                                }
                            }
                        );
                    });
                    //  Конец  обработчика  сообщения  /adduser/
                    //начало  обработчика  сообщения  /updatechat/
                    // Описание: занимается обработкой сообщений в чате
                    //  Аргументы:  один  объект  chat_map.
                    // chat_map должен обладать следующими свойствами:
                    // dest_id   = идентификатор получателя
                    // dest_name = имя получателя
                    // sender_id = идентификатор отправителя
                    // msg_text  = текст сообщения
                    //  Действие:
                    // Если получатель в онлайне, отправить ему chat_map.
                    // Если нет, послать отправителю сообщение
                    // 'пользователь вышел из чата'
                    //
                    socket.on('updatechat', function (chat_map) {
                        if (chatterMap.hasOwnProperty(chat_map.dest_id)) {
                            chatterMap[chat_map.dest_id]
                                .emit('updatechat', chat_map);
                        }
                        else {
                            et.emit('updatechat', {
                                sender_id: chat_map.sender_id,
                                msg_text: chat_map.dest_name + '  вышел  из  чата.'
                            });
                        }
                    });
                    //  Конец  обработчика  сообщения  /updatechat/
                    //начало  методов  отключения
                    socket.on('leavechat', function () {
                        console.log(
                            '**  пользователь  %s  вышел  **', socket.user_id
                        );
                        signOut(io, socket.user_id);
                    });
                    socket.on('disconnect', function () {
                        console.log(
                            'пользователь %s закрыл окно или вкладку браузера **',
                            socket.user_id
                        );
                        signOut(io, socket.user_id);
                    });
                    //  Конец  методов  отключения
                    //начало  обработчика  сообщения  /updateavatar/
                    // Описание: обрабатывает обновления аватаров на стороне клиента
                    //  Аргументы:  один  объект  avtr_map.
                    // avtr_map должен обладать следующими свойствами:
                    //   person_id = идентификатор человека, чей аватар обновлен
                    // css_map = хэш, в котором содержатся координаты левого
                    //  верхнего угла и цвет фона
                    //  Действие:
                    // Этот обработчик обновляет записи в MongoDB, а затем
                    //  рассылает измененный список людей всем клиентам.
                    //
                    socket.on('updateavatar', function (avtr_map) {
                        crud.update(
                            'user',
                            {'_id': makeMongoId(avtr_map.person_id)},
                            {css_map: avtr_map.css_map},
                            function (result_list) {
                                emitUserList(io);
                            }
                        );
                    });
                    //  Конец  обработчика  сообщения  /updateavatar/
                }
            );
        // Конец настройки объекта io
        return io;
    }
};
module.exports = chatObj;
// -------------------- КОНЕЦ ОТКРЫТЫХ МЕТОДОВ ----------------------