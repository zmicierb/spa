/*jslint browser : true, continue : true,
 devel : true, indent : 2, maxerr : 50,
 newcap : true, nomen : true, plusplus : true,
 regexp : true, sloppy : true, vars : false,
 white : true
 */
/*global TAFFY, $, spa */


// API объекта people
// ---------------------
// Объект people доступен по имени spa.model.people.
// Объект people предоставляет методы и события для управления
// коллекцией объектов person. Ниже перечислены его открытые методы:
//* get_user() – возвращает объект person, представляющий текущего
//пользователя. Если пользователь не аутентифицирован, возвращает
//объект person, представляющий анонимного пользователя.
//* get_db() – возвращает базу данных TaffyDB, содержащую все
//объекты person, в том числе текущего пользователя, – в
//отсортированном виде.
//* get_by_cid( <client_id> ) – возвращает объект person,
//    представляющий пользователя с указанным уникальным идентификатором.
//* login( <user_name> ) – аутентифицируется от имени пользователя
//с указанным именем. В объект, представляющий текущего пользователя,
//    вносятся изменения, отражающие новый статус.
//* logout()- возвращает объект текущего пользователя в анонимное
//состояние.
//
// Объект публикует следующие глобальные пользовательские события
// jQuery:
//* 'spa-login' публикуется по завершении аутентификации.
//    В качестве данных передается обновленный объект пользователя.
//* 'spa-logout' публикуется по завершении процедуры выхода из системы.
//    В качестве данных передается прежний объект пользователя.
//
// Каждый человек представляется объектом person.
// Объекты person предоставляют следующие методы:
//* get_is_user() – возвращает true, если объект соответствует
//текущему пользователю
//* get_is_anon() – возвращает true, если объект соответствует
//анонимному пользователю
//
// Объект person имеет следующие атрибуты:
//* cid – строковый клиентский идентификатор. Он всегда определен и
//отличается от атрибута id, только если данные на стороне клиента
//еще не синхронизированы с сервером.
// * id – уникальный идентификатор. Может быть равен undefined, если
//объект еще не синхронизирован с сервером.
// * name – строка, содержащая имя пользователя.
// * css_map – хэш атрибутов, используемый для представления аватара.
//

// API объекта chat
// ----------------
// Объект chat доступен по имени spa.model.chat.
// Объект chat предоставляет методы и события для управления
// сообщениями в чате. Ниже перечислены его открытые методы:
//   * join() – войти в чат. Настраивает протокол
// взаимодействия чата с сервером, включая публикаторов
// глобальных пользовательских событий 'spa-listchange' и
//     'spa-updatechat'. Если текущий пользователь анонимный,
//     то join() возвращает false и больше ничего не делает.
//   * get_chatee() – вернуть объект person, представляющий
//     собеседника пользователя. Если такого нет, возвращается
//     null.
//   * set_chatee( <person_id> ) – установить в качестве
//     собеседника объект person с указанным идентификатором
//     person_id. Если person_id не входит в список людей, то
//     в качестве собеседника устанавливается null. Если
//     указанный человек уже является собеседником, то метод
//     возвращает false. Публикуется глобальное пользовательское
//     событие 'spa-setchatee'.
//   * send_msg( <msg_text> ) – отправить сообщение собеседнику.
//     Публикуется глобальное пользовательское событие
//     'spa-updatechat'. Если пользователь анонимный или
//     собеседник равен null, метод возвращает false и больше
//     ничего не делает.
//   * update_avatar( <update_avtr_map> ) – отправить серверу
//     хэш update_avtr_map. В результате публикуется событие
//     'spa-listchange', сопровождаемое обновленным списком
//     людей и аватаров (атрибут css_map для каждого человека).
//     Хэш update_avtr_map должен иметь вид
//     { person_id : person_id, css_map : css_map }.
//
// Ниже перечислены глобальные пользовательские события
// jQuery, публикуемые объектом:
//   * spa-setchatee – публикуется при установке нового
//     собеседника. В качестве данных передается хэш вида
//     { old_chatee : <old_chatee_person_object>,
//       new_chatee : <new_chatee_person_object>
//     }
//   * spa-listchange – публикуется при изменении длины
//     списка людей в онлайне (то есть когда кто-то входит в чат
//     или выходит из чата) или его содержимого (то есть когда
//     (изменяется информация о каком-то аватаре).
//     Получатель этого события должен запросить обновленные
//     данные у метода people_db объекта модели people.
//   * spa-updatechat – публикуется при получении или отправке
//     сообщения. В качестве данных передается хэш вида
//     { dest_id : <chatee_id>,
//       dest_name : <chatee_name>,
//       sender_id : <sender_id>,
//       msg_text : <message_content>
//     }
//

spa.model = (function () {
    'use strict';
    var
        configMap = {anon_id: 'a0'},
        stateMap = {
            anon_user: null,
            cid_serial: 0,
            people_cid_map: {},
            people_db: TAFFY(),
            is_connected: false,
            user: null
        },
        isFakeData = true,

        personProto, makeCid, clearPeopleDb, completeLogin,
        makePerson, removePerson, people, chat, initModule;

    // API объекта chat
// ----------------
// Объект chat доступен по имени spa.model.chat.
// Объект chat предоставляет методы и события для управления
// сообщениями в чате. Ниже перечислены его открытые методы:
//   * join() – войти в чат. Настраивает протокол
// взаимодействия чата с сервером, включая публикаторов
// глобальных пользовательских событий 'spa-listchange' и
//     'spa-updatechat'. Если текущий пользователь анонимный,
//     то join() возвращает false и больше ничего не делает.
//   * get_chatee() – вернуть объект person, представляющий
//     собеседника пользователя. Если такого нет, возвращается
//     null.
//   * set_chatee( <person_id> ) – установить в качестве
//     собеседника объект person с указанным идентификатором
//     person_id. Если person_id не входит в список людей, то
//     в качестве собеседника устанавливается null. Если
//     указанный человек уже является собеседником, то метод
//     возвращает false. Публикуется глобальное пользовательское
//     событие 'spa-setchatee'.
//   * send_msg( <msg_text> ) – отправить сообщение собеседнику.
//     Публикуется глобальное пользовательское событие
//     'spa-updatechat'. Если пользователь анонимный или
//     собеседник равен null, метод возвращает false и больше
//     ничего не делает.
// ...
//
// Ниже перечислены глобальные пользовательские события
// jQuery, публикуемые объектом:
//   * spa-setchatee – публикуется при установке нового
//     собеседника. В качестве данных передается хэш вида
//     { old_chatee : <old_chatee_person_object>,
//       new_chatee : <new_chatee_person_object>
//     }
//   * spa-listchange – публикуется при изменении длины
//     списка людей в онлайне (то есть когда кто-то входит в чат
//     или выходит из чата) или его содержимого (то есть когда
//     изменяется информация о каком-то аватаре).
//     Получатель этого события должен запросить обновленные
//     данные у метода people_db объекта модели people.
//   * spa-updatechat – публикуется при получении или отправке
//     сообщения. В качестве данных передается хэш вида
//     { dest_id : <chatee_id>,
//       dest_name : <chatee_name>,
//       sender_id : <sender_id>,
//       msg_text : <message_content>
//     }
//
    chat = (function () {
        var
            _publish_listchange,
            _publish_updatechat,
            _update_list, _leave_chat,
            get_chatee,
            join_chat,
            send_msg, set_chatee,
            update_avatar,
            chatee = null;
        // Начало внутренних методов
        _update_list = function (arg_list) {
            var i, person_map, make_person_map, person,
                people_list = arg_list[0],
                is_chatee_online = false;
            clearPeopleDb();
            PERSON:
                for (i = 0; i < people_list.length; i++) {
                    person_map = people_list[i];
                    if (!person_map.name) {
                        continue PERSON;
                    }
                    //  если  пользователь  определен,  обновить
                    // css_map и больше ничего не делать
                    if (stateMap.user && stateMap.user.id === person_map._id) {
                        stateMap.user.css_map = person_map.css_map;
                        continue  PERSON;
                    }
                    make_person_map = {
                        cid: person_map._id,
                        css_map: person_map.css_map,
                        id: person_map._id,
                        name: person_map.name
                    };

                    if (chatee && chatee.id === make_person_map.id) {
                        is_chatee_online = true;
                        chatee = person;
                    }
                    makePerson(make_person_map);
                }
            stateMap.people_db.sort('name');
            //eсли собеседник уже не в онлайне, сбросить chatee,
            // в результате чего возникнет глобальное событие 'spa-setchatee'
            if (chatee && !is_chatee_online) {
                set_chatee('');
            }
        };
        _publish_listchange = function (arg_list) {
            _update_list(arg_list);
            $.gevent.publish('spa-listchange', [arg_list]);
        };

        _publish_updatechat = function (arg_list) {
            var msg_map = arg_list[0];
            if (!chatee) {
                set_chatee(msg_map.sender_id);
            }
            else if (msg_map.sender_id !== stateMap.user.id
                && msg_map.sender_id !== chatee.id
            ) {
                set_chatee(msg_map.sender_id);
            }
            $.gevent.publish('spa-updatechat', [msg_map]);
        };

        // Конец внутренних методов
        _leave_chat = function () {
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            chatee = null;
            stateMap.is_connected = false;
            if (sio) {
                sio.emit('leavechat');
            }
        };

        get_chatee = function () {
            return chatee;
        };

        join_chat = function () {
            var sio;
            if (stateMap.is_connected) {
                return false;
            }
            if (stateMap.user.get_is_anon()) {
                console.warn('User must be defined before joining chat');
                return false;
            }
            sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            sio.on('listchange', _publish_listchange);
            sio.on('updatechat', _publish_updatechat);
            stateMap.is_connected = true;
            return true;
        };

        send_msg = function (msg_text) {
            var msg_map,
                sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            if (!sio) {
                return false;
            }
            if (!( stateMap.user && chatee )) {
                return false;
            }
            msg_map = {
                dest_id: chatee.id,
                dest_name: chatee.name,
                sender_id: stateMap.user.id,
                msg_text: msg_text
            };
            // мы опубликовали updatechat, чтобы можно было показать
            //  текущий  список  сообщений
            _publish_updatechat([msg_map]);
            sio.emit('updatechat', msg_map);
            return true;
        };
        set_chatee = function (person_id) {
            var new_chatee;
            new_chatee = stateMap.people_cid_map[person_id];
            if (new_chatee) {
                if (chatee && chatee.id === new_chatee.id) {
                    return false;
                }
            }
            else {
                new_chatee = null;
            }
            $.gevent.publish('spa-setchatee',
                {old_chatee: chatee, new_chatee: new_chatee}
            );
            chatee = new_chatee;
            return true;
        };

        // avatar_update_map должен иметь вид:
// { person_id : <string>, css_map : {
//   top : <int>, left : <int>,
//   'background-color' : <string>
// }};
//
        update_avatar = function (avatar_update_map) {
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            if (sio) {
                sio.emit('updateavatar', avatar_update_map);
            }
        };
        return {
            _leave: _leave_chat,
            get_chatee: get_chatee,
            join: join_chat,
            send_msg: send_msg,
            set_chatee: set_chatee,
            update_avatar: update_avatar
        };
    }());


    //API объекта people
    //  ---------------------
    //Объект people доступен по имени spa.model.people.
    // Объект people предоставляет методы и события для управления
    // коллекцией объектов person. Ниже перечислены его открытые методы:
    //    * get_user() – возвращает объект person, представляющий текущего
    //    пользователя. Если пользователь не аутентифицирован, возвращает
    //    объект person, представляющий анонимного пользователя.
    //    * get_db() – возвращает базу данных TaffyDB, содержащую все
    //    объекты person, в том числе текущего пользователя, –
    //    в отсортированном виде.
    //    * get_by_cid( <client_id> ) – возвращает объект person,
    //    представляющий пользователя с указанным уникальным идентификатором.
    //    * login( <user_name> ) – аутентифицируется от имени пользователя
    //    с указанным именем. В объект, представляющий текущего пользователя,
    //        вносятся изменения, отражающие новый статус.
    //    * logout()- возвращает объект текущего пользователя в анонимное
    //    состояние.
    //
    // Объект публикует следующие глобальные пользовательские события
    //  jQuery:
    //    * 'spa-login' публикуется по завершении аутентификации.
    //        В качестве данных передается обновленный объект пользователя.
    //    * 'spa-logout' публикуется по завершении процедуры выхода из системы.
    //        В качестве данных передается прежний объект пользователя.
    //
    // Каждый человек представляется объектом person.
    // Объект person предоставляет следующие методы:
    //    * get_is_user() – возвращает true, если объект соответствует
    //    текущему пользователю;
    //    * get_is_anon() – возвращает true, если объект соответствует
    //    анонимному пользователю.
    //
    // Объект person имеет следующие атрибуты:
    //    * cid – строковый клиентский идентификатор. Он всегда определен и
    //    отличается от атрибута id, только если данные на стороне клиента
    //    еще не синхронизированы с сервером.
    //    * id – уникальный идентификатор. Может быть равен undefined, если
    //    объект еще не синхронизирован с сервером.
    //    * name – строка, содержащая имя пользователя.
    //   * css_map – хэш атрибутов, используемый для представления аватара.
    //

    personProto = {
        get_is_user: function () {
            return this.cid === stateMap.user.cid;
        },
        get_is_anon: function () {
            return this.cid === stateMap.anon_user.cid;
        }
    };

    makeCid = function () {
        return 'c' + String(stateMap.cid_serial++);
    };
    clearPeopleDb = function () {
        var user = stateMap.user;
        stateMap.people_db = TAFFY();
        stateMap.people_cid_map = {};
        if (user) {
            stateMap.people_db.insert(user);
            stateMap.people_cid_map[user.cid] = user;
        }
    };
    completeLogin = function (user_list) {
        var user_map = user_list[0];
        delete stateMap.people_cid_map[user_map.cid];
        stateMap.user.cid = user_map._id;
        stateMap.user.id = user_map._id;
        stateMap.user.css_map = user_map.css_map;
        stateMap.people_cid_map[user_map._id] = stateMap.user;
        chat.join();
        $.gevent.publish('spa-login', [stateMap.user]);
    };

    makePerson = function (person_map) {
        var person,
            cid = person_map.cid,
            css_map = person_map.css_map,
            id = person_map.id,
            name = person_map.name;
        if (cid === undefined || !name) {
            throw 'client id and name required';
        }
        person = Object.create(personProto);
        person.cid = cid;
        person.name = name;
        person.css_map = css_map;
        if (id) {
            person.id = id;
        }
        stateMap.people_cid_map[cid] = person;
        stateMap.people_db.insert(person);
        return person;
    };

    removePerson = function (person) {
        if (!person) {
            return false;
        }
        // анонимного пользователя удалять нельзя
        if (person.id === configMap.anon_id) {
            return false;
        }
        stateMap.people_db({cid: person.cid}).remove();
        if (person.cid) {
            delete  stateMap.people_cid_map[person.cid];
        }
        return true;
    };

    people = (function () {
        var get_by_cid, get_db, get_user, login, logout;
        get_by_cid = function (cid) {
            return stateMap.people_cid_map[cid];
        };
        get_db = function () {
            return stateMap.people_db;
        };
        get_user = function () {
            return stateMap.user;
        };
        login = function (name) {
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            stateMap.user = makePerson({
                cid: makeCid(),
                css_map: {top: 25, left: 25, 'background-color': '#8f8'},
                name: name
            });
            sio.on('userupdate', completeLogin);
            sio.emit('adduser', {
                cid: stateMap.user.cid,
                css_map: stateMap.user.css_map,
                name: stateMap.user.name
            });
        };
        logout = function () {
            var is_removed, user = stateMap.user;
            chat._leave();
            is_removed = removePerson(user);
            stateMap.user = stateMap.anon_user;
            clearPeopleDb();

            $.gevent.publish('spa-logout', [user]);
            return is_removed;
        };
        return {
            get_by_cid: get_by_cid,
            get_db: get_db,
            get_user: get_user,
            login: login,
            logout: logout
        };
    }());

    initModule = function () {
        // инициализируем анонимного пользователя
        stateMap.anon_user = makePerson({
            cid: configMap.anon_id,
            id: configMap.anon_id,
            name: 'anonymous'
        });
        stateMap.user = stateMap.anon_user;
    };
    return {
        initModule: initModule,
        chat: chat,
        people: people
    };
}());