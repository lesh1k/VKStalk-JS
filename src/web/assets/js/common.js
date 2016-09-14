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

        $('.datepicker').pickadate({
            selectMonths: true, // Creates a dropdown to control month
            selectYears: 15 // Creates a dropdown of 15 years to control year
        });

        $('.timepicker').pickatime({
            autoclose: true,
            twelvehour: false
        });
    });
})();
