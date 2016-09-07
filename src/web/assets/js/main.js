/* eslint-env jquery */
/* global io */

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

(function(socket_io) {
    'use strict';
    var STALKED_IDS = getStalkedIds();

    setupSocket();

    function setupSocket() {
        var socket = socket_io.connect();

        socket.on('connection', function() {
            STALKED_IDS.forEach(function(stalked_id) {
                socket.emit('join-room', stalked_id);
            });
        });

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

        setupCardActions(socket);

    }

    function setupCardActions(socket) {
        stalk(socket);
        stop(socket);
        remove(socket);

        function stalk(socket) {
            var $btns = $('.stalk-start');

            $btns.click(function() {
                var stalked_id = $(this).closest('.card').attr('id');
                socket.emit('stalk-start', stalked_id);
            });
        }

        function stop(socket) {
            var $btns = $('.stalk-stop');

            $btns.click(function() {
                var stalked_id = $(this).closest('.card').attr('id');
                socket.emit('stalk-stop', stalked_id);
            });
        }

        function remove(socket) {
            var $btns = $('.card-remove');

            $btns.click(function() {
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
