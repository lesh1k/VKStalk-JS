/* global io */

(function(socket_io) {
    'use strict';

    setupSocket();

    function setupSocket() {
        var socket = socket_io.connect(window.location.origin);

        socket.on('connection', function() {
            var path_parts = window.location.pathname.split('/');
            var user_id = path_parts[path_parts.length - 1];
            socket.emit('stalk-request', user_id);
        });

        socket.on('stalk-data', function(data) {
            document.getElementById('stalk-data').innerText = data;
        });

        socket.on('disconnect', function() {
            document.getElementById('stalk-data').innerText = 'Disconnected...';
        });

        setupStopButton(socket);
    }

    function setupStopButton(socket) {
        var btns = document.querySelectorAll('.stop-worker');

        [].slice.call(btns).forEach(function(btn) {
            btn.addEventListener('click', function() {
                var path_parts = window.location.pathname.split('/');
                var user_id = path_parts[path_parts.length - 1];
                socket.emit('stop-worker', user_id);
            });
        });
    }
})(io);
