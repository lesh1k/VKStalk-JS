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
    console.log(STALKED_IDS);

    setupSocket();

    function setupSocket() {
        var socket = socket_io.connect(window.location.origin);

        socket.on('connection', function(data) {
            console.log(data);
            STALKED_IDS.forEach(function(stalked_id) {
                console.log('Emitting join room', stalked_id);
                socket.emit('join-room', stalked_id);
            });
        });

        socket.on('stalk-data', function(data) {
            console.log(data);
            var card = document.getElementById(data.stalked_id);
            card.querySelector('.stalk-data').innerText = data.message;
        });

        socket.on('disconnect', function() {
            $('.stalk-data').text('Disconnected...');
        });

        setupStalkButton(socket);
        setupStopButton(socket);
    }

    function setupStalkButton(socket) {
        var $btns = $('.stalk-user');

        $btns.click(function() {
            var stalked_id = $(this).closest('.card').attr('id');
            socket.emit('stalk-request', stalked_id);
        });
    }

    function setupStopButton(socket) {
        // var $btns = $('.stop-worker');
        //
        // $btns.click(function() {
        //     var path_parts = window.location.pathname.split('/');
        //     var user_id = path_parts[path_parts.length - 1];
        //     socket.emit('stop-worker', user_id);
        // });
    }

    function getStalkedIds() {
        return $('.stalking-card').toArray().map(function(card) {
            return $(card).attr('id');
        });
    }
})(io);
