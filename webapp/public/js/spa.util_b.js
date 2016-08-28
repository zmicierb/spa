/*jslint          browser : true,   continue : true,
 devel  : true,   indent : 2,        maxerr : 50,
 newcap : true,   nomen  : true,   plusplus : true,
 regexp : true,   sloppy : true,       vars : false,
 white  : true
 */
/*global $, spa, getComputedStyle */
spa.util_b = (function () {
    'use strict';
    //--------- НАЧАЛО ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ --------
    var
        configMap = {
            regex_encode_html: /[&"'><]/g,
            regex_encode_noamp: /["'><]/g,
            html_encode_map: {
                '&': '&#38;',
                '"': '&#34;',
                "'": '&#39;',
                '>': '&#62;',
                '<': '&#60;'
            }
        },
        decodeHtml, encodeHtml, getEmSize;
    configMap.encode_noamp_map = $.extend(
        {}, configMap.html_encode_map
    );
    delete  configMap.encode_noamp_map['&'];
//-------- КОНЕЦ ПЕРЕМЕННЫХ В ОБЛАСТИ ВИДИМОСТИ МОДУЛЯ --------
//----------------- НАЧАЛО ОТКРЫТЫХ МЕТОДОВ -------------------
    // Начало decodeHtml
    // Декодирует HTML-компоненты в среде браузера
    // См. http://stackoverflow.com/questions/1912501/\
    //  unescape-html-entities-in-javascript
    //
    decodeHtml = function (str) {
        return $('<div/>').html(str || '').text();
    };
    //  Конец decodeHtml
    //  Начало  encodeHtml
    // Однопроходный кодировщик HTML-компонентов, способный
    // обработать произвольное число символов.
    //
    encodeHtml = function (input_arg_str, exclude_amp) {
        var
            input_str = String(input_arg_str),
            regex, lookup_map
            ;
        if (exclude_amp) {
            lookup_map = configMap.encode_noamp_map;
            regex = configMap.regex_encode_noamp;
        }
        else {
            lookup_map = configMap.html_encode_map;
            regex = configMap.regex_encode_html;
        }
        return input_str.replace(regex,
            function (match, name) {
                return lookup_map[match] || '';
            }
        );
    };
    //  Конец  encodeHtml
    //  Начало getEmSize
    // Возвращает размер em в пикселях
    //
    getEmSize = function (elem) {
        return Number(
            getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]
        );
    };
    //  Конец getEmSize
    // Экспортируем методы
    return {
        decodeHtml: decodeHtml,
        encodeHtml: encodeHtml,
        getEmSize: getEmSize
    };
    //------------------ КОНЕЦ ОТКРЫТЫХ МЕТОДОВ -------------------
}());