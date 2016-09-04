/* eslint-env jquery */

(function() {
    'use strict';

    $(function() {
        $('.button-collapse').sideNav({
            edge: 'right'
        });

        $('.dropdown-button').dropdown({
            hover: true
        });
    });
})();
