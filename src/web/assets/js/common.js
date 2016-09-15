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
        initMaterializeComponents('body');
    });

    function initMaterializeComponents(container) {
        $(container + ' .button-collapse').sideNav({
            edge: 'right'
        });

        $(container + ' .dropdown-button').dropdown({
            hover: true
        });

        $(container + ' select').material_select();

        $(container + ' .collapsible').collapsible();

        $(container + ' .datepicker').pickadate({
            selectMonths: true, // Creates a dropdown to control month
            selectYears: 15, // Creates a dropdown of 15 years to control year
            formatSubmit: 'yyyy.mm.dd',
            hiddenName: true,
            // It seems that the two below do not work in materializecss
            closeOnSelect: true,
            closeOnClear: false
        });

        $(container + ' .timepicker').pickatime({
            autoclose: true,
            twelvehour: false
        });
    }

    window.commonjs = {
        initMaterializeComponents: initMaterializeComponents
    };
})();
