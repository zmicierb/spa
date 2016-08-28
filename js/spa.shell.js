/*jslint browser : true, continue : true,
 devel : true, indent : 2, maxerr : 50,
 newcap : true, nomen : true, plusplus : true,
 regexp : true, sloppy : true, vars : false,
 white : true
 */
/*global $, spa */
spa.shell = (function () {

    'use strict';
//--------- НАЧАЛО ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ --------
    var
        configMap = {
            anchor_schema_map: {
                chat: {opened: true, closed: true}
            },
            resize_interval: 200,
            main_html: String()
            + '<div  class="spa-shell-head">'
            + '<div  class="spa-shell-head-logo">'
            + '<h1>SPA</h1>'
            + '<p>javascript  end  to  end</p>'
            + '</div>'
            + '<div  class="spa-shell-head-acct"></div>'
            + '</div>'
            + '<div  class="spa-shell-main">'
            + '<div  class="spa-shell-main-nav"></div>'
            + '<div  class="spa-shell-main-content"></div>'
            + '</div>'
            + '<div  class="spa-shell-foot"></div>'
            + '<div  class="spa-shell-modal"></div>'
        },
        stateMap = {
            $container: undefined,
            anchor_map: {},
            resize_idto: undefined
        },
        jqueryMap = {},
        copyAnchorMap, setJqueryMap,
        onTapAcct, onLogin, onLogout,
        changeAnchorPart, onHashchange, onResize,
        setChatAnchor, initModule;
//--------- КОНЕЦ ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ --------
//----------------- НАЧАЛО СЛУЖЕБНЫХ МЕТОДОВ -------------------
// Возвращает копию сохраненного хэша якорей; минимизация издержек
    copyAnchorMap = function () {
        return $.extend(true, {}, stateMap.anchor_map);
    };
//------------------ КОНЕЦ СЛУЖЕБНЫХ МЕТОДОВ -------------------
//-------------------- НАЧАЛО МЕТОДОВ DOM ----------------------
// Начало метода DOM /setJqueryMap/
    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container,
            $acct: $container.find('.spa-shell-head-acct'),
            $nav: $container.find('.spa-shell-main-nav')
        };
    };
// Конец метода DOM /setJqueryMap/
// Начало метода DOM /changeAnchorPart/
// Назначение: изменяет якорь в URI-адресе
// Аргументы:
// * arg_map – хэш, описывающий, какую часть якоря
// мы хотим изменить.
// Возвращает: булево значение
// * true – якорь в URI обновлен
// * false – не удалось обновить якорь в URI
// Действие:
// Текущая часть якоря сохранена в stateMap.anchor_map.
// Обсуждение кодировки см. в документации по uriAnchor.
// Этот метод
// * создает копию хэша, вызывая copyAnchorMap().
// * Модифицирует пары ключ–значение с помощью arg_map.
// * Управляет различием межу зависимыми и независимыми
// значениями в кодировке.
// * Пытается изменить URI, используя uriAnchor.
// * Возвращает true в случае успеха и false – в случае ошибки.
//
    changeAnchorPart = function (arg_map) {
        var
            anchor_map_revise = copyAnchorMap(),
            bool_return = true,
            key_name, key_name_dep;
// Начало объединения изменений в хэше якорей
        KEYVAL:
            for (key_name in arg_map) {
                if (arg_map.hasOwnProperty(key_name)) {
// пропустить зависимые ключи
                    if (key_name.indexOf('_') === 0) {
                        continue KEYVAL;
                    }
// обновить значение независимого ключа
                    anchor_map_revise[key_name] = arg_map[key_name];
// обновить соответствующий зависимый ключ
                    key_name_dep = '_' + key_name;
                    if (arg_map[key_name_dep]) {
                        anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                    }
                    else {
                        delete anchor_map_revise[key_name_dep];
                        delete anchor_map_revise['_s' + key_name_dep];
                    }
                }
            }
// Конец объединения изменений в хэше якорей
// Начало попытки обновления URI; в случае ошибки восстановить
// исходное состояние
        try {
            $.uriAnchor.setAnchor(anchor_map_revise);
        }
        catch (error) {
// восстановить исходное состояние в URI
            $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
            bool_return = false;
        }
// Конец попытки обновления URI...
        return bool_return;
    };
// Конец метода DOM /changeAnchorPart/
//--------------------- КОНЕЦ МЕТОДОВ DOM ----------------------
//---------------- НАЧАЛО ОБРАБОТЧИКОВ СОБЫТИЙ -----------------
    // Начало обработчика события /onResize/
    onResize = function () {
        if (stateMap.resize_idto) {
            return true;
        }
        spa.chat.handleResize();
        stateMap.resize_idto = setTimeout(
            function () {
                stateMap.resize_idto = undefined;
            },
            configMap.resize_interval
        );
        return true;
    };

    onTapAcct = function (event) {
        var acct_text, user_name, user = spa.model.people.get_user();
        if (user.get_is_anon()) {
            user_name = prompt('Please sign-in');
            spa.model.people.login(user_name);
            jqueryMap.$acct.text('...  processing  ...');
        }
        else {
            spa.model.people.logout();
        }
        return false;
    };

    onLogin = function (event, login_user) {
        jqueryMap.$acct.text(login_user.name);
    };
    onLogout = function (event, logout_user) {
        jqueryMap.$acct.text('Please  sign-in');
    };

// Начало обработчика события /onHashchange/
// Назначение: обрабатывает событие hashchange
// Аргументы:
// * event – объект события jQuery.
// Параметры: нет
// Возвращает: false
// Действие:
// * Разбирает якорь в URI
// * Сравнивает предложенное состояние приложения с текущим
// * Вносит изменения, только если предложенное состояние
// отличается от текущего
//
    onHashchange = function (event) {
        var
            _s_chat_previous, _s_chat_proposed, s_chat_proposed,
            anchor_map_proposed,
            is_ok = true,
            anchor_map_previous = copyAnchorMap();
// пытаемся разобрать якорь
        try {
            anchor_map_proposed = $.uriAnchor.makeAnchorMap();
        }
        catch (error) {
            $.uriAnchor.setAnchor(anchor_map_previous, null, true);
            return false;
        }
        stateMap.anchor_map = anchor_map_proposed;
// вспомогательные переменные
        _s_chat_previous = anchor_map_previous._s_chat;
        _s_chat_proposed = anchor_map_proposed._s_chat;
// Начало изменения компонента чат
        if (!anchor_map_previous
            || _s_chat_previous !== _s_chat_proposed
        ) {
            s_chat_proposed = anchor_map_proposed.chat;
            switch (s_chat_proposed) {
                case 'opened' :
                    is_ok = spa.chat.setSliderPosition('opened');
                    break;
                case 'closed' :
                    is_ok = spa.chat.setSliderPosition('closed');
                    break;
                default :
                    toggleChat(false);
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
            }
        }
// Конец изменения компонента чат
// Начало восстановления якоря, если не удалось
// изменить состояние окна чата
        if (!is_ok) {
            if (anchor_map_previous) {
                $.uriAnchor.setAnchor(anchor_map_previous, null, true);
                stateMap.anchor_map = anchor_map_previous;
            } else {
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
            }
        }
// Конец восстановления якоря, если не удалось изменить
// состояние окна чата
        return false;
    };
// Конец обработчика события /onHashchange/
//----------------- КОНЕЦ ОБРАБОТЧИКОВ СОБЫТИЙ -----------------
//---------------- НАЧАЛО ОБРАТНЫХ ВЫЗОВОВ -----------------
// Начало метода обратного вызова /setChatAnchor/
// Пример: setChatAnchor( 'closed' );
// Назначение: изменить компонент якоря, относящийся к чату
// Аргументы:
// * position_type – допустимы значения 'closed' или 'opened'
// Действие:
// Заменяет параметр 'chat' в якоре указанным значением,
// если это возможно.
// Возвращает:
// * true – часть якоря была обновлена
// * false – часть якоря не была обновлена
// Исключения: нет
//
    setChatAnchor = function (position_type) {
        return changeAnchorPart({chat: position_type});
    };
// Конец метода обратного вызова /setChatAnchor/
//----------------- КОНЕЦ ОБРАТНЫХ ВЫЗОВОВ -----------------
//---------------- НАЧАЛО ОТКРЫТЫХ МЕТОДОВ -----------------
// Начало открытого метода /initModule/
// Пример: spa.chat.initModule( $('#div_id') );
// Назначение:
// Требует, чтобы Chat начал предоставлять свою
// функциональность пользователю
// Аргументы:
// * $append_target (example: $('#div_id')).
// Коллекция jQuery, которая должна содержать
// единственный элемент DOM – контейнер
// Действие:
// Добавляет выплывающий чат в конец указанного контейнера и заполняет
// его HTML-содержимым. Затем инициализирует элементы, события и
// обработчики, так чтобы предоставить пользователю интерфейс для работы
// с чатом.
// Возвращает: true в случае успеха, иначе false
// Исключения: нет
//
    initModule = function ($container) {
// загружаем HTML и кэшируем коллекции jQuery
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();
// настраиваем uriAnchor на использование нашей схемы
        $.uriAnchor.configModule({
            schema_map: configMap.anchor_schema_map
        });
// конфигурируем и инициализируем функциональные модули
        spa.chat.configModule({
            set_chat_anchor: setChatAnchor,
            chat_model: spa.model.chat,
            people_model: spa.model.people
        });
        $.gevent.subscribe($container, 'spa-login', onLogin);
        $.gevent.subscribe($container, 'spa-logout', onLogout);
        spa.chat.initModule(jqueryMap.$container);
        spa.avtr.configModule({
            chat_model: spa.model.chat,
            people_model: spa.model.people
        });
        spa.avtr.initModule(jqueryMap.$nav);
// Обрабатываем события изменения якоря в URI.
// Это делается /после/ того, как все функциональные модули
// сконфигурированы и инициализированы, иначе они будут не готовы
// возбудить событие, которое используется, чтобы гарантировать
// учет якоря при загрузке
//

        $(window)
            .bind('resize', onResize)
            .bind('hashchange', onHashchange)
            .trigger('hashchange');

        jqueryMap.$acct
            .text('Please  sign-in')
            .bind('utap', onTapAcct);
    };
// Конец открытого метода/initModule/
    return {initModule: initModule};
//----------------- КОНЕЦ ОТКРЫТЫХ МЕТОДОВ -----------------
}());