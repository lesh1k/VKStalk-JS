/* eslint-env jquery */
/* global io */

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
    });
})();

(function(socket_io) {
    'use strict';
    var STALKED_IDS = getStalkedIds();

    setupSocket();

    function setupSocket() {
        var socket = socket_io.connect();

        socket.on('connection', function() {
            STALKED_IDS.forEach(function(stalked_id) {
                socket.emit('stalk-join', stalked_id);
            });
        });

        // socket.on

        socket.on('stalk-data', function(data) {
            var card = document.getElementById(data.stalked_id);
            if (card) {
                card.querySelector('.stalk-data').innerText = data.message;
            }
        });

        socket.on('disconnect', function() {
            $('.stalk-data').text('Disconnected...');
        });

        socket.on('stalk-remove', function(data) {
            if (!data.error) {
                $(document.getElementById(data.stalked_id)).parent().remove();
            } else {
                $(document.getElementById(data.stalked_id)).find('.stalk-data').text(data.error);
            }
        });

        setupCardAddition(socket);
        setupCardActions(socket);

    }

    function setupCardAddition(socket) {
        var $form = $('#form-card-add');

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
                        console.error(response.error);
                        return;
                    }

                    $form[0].reset();
                    $form.find('input').focus();
                    $('#stalkers > .row:first-child').prepend(response.html);
                    socket.emit('stalk-join', response.stalked_id);
                })
                .fail(function(response) {
                    console.error(response);
                });
        });
    }

    function setupCardActions(socket) {
        stalk(socket);
        stop(socket);
        remove(socket);

        function stalk(socket) {
            $(document).on('click', '.stalk-start', function() {
                var stalked_id = $(this).closest('.card').attr('id');
                socket.emit('stalk-start', stalked_id);
            });
        }

        function stop(socket) {
            $(document).on('click', '.stalk-stop', function() {
                var stalked_id = $(this).closest('.card').attr('id');
                socket.emit('stalk-stop', stalked_id);
            });
        }

        function remove(socket) {
            $(document).on('click', '.card-remove', function() {
                var stalked_id = $(this).closest('.card').attr('id');
                socket.emit('stalk-remove', stalked_id);
            });
        }
    }

    function getStalkedIds() {
        return $('.stalking-card').toArray().map(function(card) {
            return $(card).attr('id');
        });
    }
})(io);
