/* eslint-env jquery */

(function() {
    'use strict';

    $.fn.extend({
        serializeObject: function() {
            var form = this[0];
            var data = $(form).serializeArray();
            var obj = {};
            $.each(data, function(k, v) {
                obj[v.name] = v.value;
            });
            return obj;
        },
    });

    $(function() {
        $('.button-collapse').sideNav({
            edge: 'right'
        });

        $('.dropdown-button').dropdown({
            hover: true
        });

        $('select').material_select();

        $('.collapsible').collapsible();
    });
})();
