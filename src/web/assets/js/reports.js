/* eslint-env jquery */

(function() {
    'use strict';

    $(function() {
        setupReportTypeSelect('#report-type');
    });

    function setupReportTypeSelect(selector) {
        $(selector).change(onReportTypeSelect);
    }

    function onReportTypeSelect() {
        var $select = $(this);
        var url = window.location.pathname.replace(/\/$/, '') + '/' + $select.val();

        $select.closest('form').attr('action', url);
    }
})();
