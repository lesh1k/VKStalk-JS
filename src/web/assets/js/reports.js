/* eslint-env jquery */
/* global Materialize */

(function() {
    'use strict';

    $(function() {
        setupReportTypeSelect('#report-type');
        setupReportAjaxRequest();
        setupDatepickers();
    });

    function setupReportTypeSelect(selector) {
        $(selector).change(onReportTypeSelect);
        $(selector).change();
    }

    function onReportTypeSelect() {
        var $select = $(this);
        var url = window.location.pathname.replace(/\/$/, '') + '/' + $select.val();

        $select.closest('form').attr('action', url);
    }

    function setupReportAjaxRequest() {
        var $form = $('#report-form');

        $form.submit(function(e) {
            e.preventDefault();
            var data = $form.serializeObject();

            $.ajax({
                    url: $form.attr('action'),
                    method: $form.attr('method'),
                    data: data
                })
                .done(function(response) {
                    if (response.error) {
                        Materialize.toast(response.error, 5000);
                        return;
                    }

                    var msg = response.report_type + ' report is ready';
                    Materialize.toast(msg, 3000);
                    if (response.report_type === 'music') {
                        var $html = $(response.report);
                        $html.find('tbody tr td:last-child').each(function(i, td) {
                            $(td).text(new Date($(td).text()))
                        });
                        response.report = $html;
                    }
                    $('#report').html(response.report);
                })
                .fail(function(response) {
                    var msg = response.status + ' ';
                    msg += response.statusText;
                    msg += '<br>' + response.responseText;
                    Materialize.toast(msg, 5000);
                });
        });
    }

    function setupDatepickers() {
        var d_from = $('#date-from').pickadate('picker');
        var d_to = $('#date-to').pickadate('picker');

        d_from.on('open', function() {
            var max = Infinity;
            var val = d_to.get('select', 'yyyy.mm.dd');
            if (val) {
                max = new Date(val);
            }

            d_from.set('max', max);
        });

        d_to.on('open', function() {
            var min = -Infinity;
            var val = d_from.get('select', 'yyyy.mm.dd');
            if (val) {
                min = new Date(val);
            }

            d_to.set('min', min);
        });
    }

})();
