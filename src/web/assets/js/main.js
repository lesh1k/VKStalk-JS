/* eslint-env jquery */
/* global io Materialize */

(function() {
    'use strict';

    $(function() {
        $(document).on('cardHeightUpdate', '.card', function(e, data) {
            var $card_data = $(this).find('.stalk-data');
            var min_height = parseInt($card_data.css('min-height'), 10);
            var height = $card_data.height();
            if (data && data.reset) {
                $card_data.css('min-height', 0);
            } else if (min_height < height) {
                $card_data.css('min-height', height);
            }
        });

        $(document).on('click', '.chip', function() {
            var $chip = $(this);
            $chip.siblings().removeClass('selected');
            $chip.toggleClass('selected');

            if ($chip.hasClass('selected')) {
                var card = document.getElementById($chip.data('stalk-id'));
                $('.stalking-card').not(card).parent().hide();
                $(card).parent().show();
            } else {
                $('.stalking-card').parent().show();
            }
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

        socket.on('stalk-data', function(data) {
            var card = document.getElementById(data.stalked_id);
            if (card) {
                card.querySelector('.stalk-data').innerText = data.message;
                $(card).trigger('cardHeightUpdate');

                if (data.is_reconnect || data.running) {
                    $(card).removeClass('stopped').addClass('running');
                } else {
                    $(card).removeClass('running').addClass('stopped');
                }

                if (data.error) {
                    $(card).removeClass('running').addClass('stopped');
                }
            }
        });

        socket.on('disconnect', function() {
            $('.stalk-data').text('Disconnected...');
            $('.card').trigger('cardHeightUpdate', {
                reset: true
            }).removeClass('running').addClass('stopped');
        });

        socket.on('stalk-remove', function(data) {
            if (!data.error) {
                $(document.getElementById(data.stalked_id)).parent().fadeOut(function() {
                    $(this).remove();
                });
                var $chip = $('.chip[data-stalk-id="' + data.stalked_id + '"]');
                if ($chip.hasClass('selected')) {
                    $chip.click();
                }
                $chip.remove();
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
                        Materialize.toast(response.error, 5000);
                        return;
                    }

                    $form[0].reset();
                    $form.find('input').focus();
                    $('#stalkers .cards-row').append(response.html);
                    var chip = createChip(response.stalked_id);
                    $('.chips-container').append(chip);
                    socket.emit('stalk-join', response.stalked_id);
                })
                .fail(function(response) {
                    var msg = response.status + ' ';
                    msg += response.statusText;
                    msg += '<br>' + response.responseText;
                    Materialize.toast(msg, 5000);
                });
        });
    }

    function createChip(stalked_id) {
        var $chip = $('<div class="chip" data-stalk-id="' + stalked_id + '"></div>');
        $chip.append('<span/>').append('<i/>');
        $chip.find('span').text(stalked_id + ' ');
        $chip.find('i').addClass('material-icons vertical-align-middle tiny hide').text('play_circle_filled');

        return $chip;
    }

    function setupCardActions(socket) {
        stalk(socket);
        stop(socket);
        remove(socket);
        cancelCardReveal();

        function stalk(socket) {
            $(document).on('click', '.stalk-start', function() {
                var $card = $(this).closest('.card');
                var stalked_id = $card.attr('id');
                socket.emit('stalk-start', stalked_id);
                // $card.find('.stalk-start, .stalk-stop').toggleClass('hide');
                $card.removeClass('stopped').addClass('running');
            });
        }

        function stop(socket) {
            $(document).on('click', '.stalk-stop', function() {
                var $card = $(this).closest('.card');
                var stalked_id = $card.attr('id');
                socket.emit('stalk-stop', stalked_id);
                $card.trigger('cardHeightUpdate', {
                    reset: true
                });
                // $card.find('.stalk-start, .stalk-stop').toggleClass('hide');
                $card.removeClass('running').addClass('stopped');
            });
        }

        function remove(socket) {
            $(document).on('click', '.card-remove', function() {
                var stalked_id = $(this).closest('.card').attr('id');
                socket.emit('stalk-remove', stalked_id);
            });
        }

        function cancelCardReveal() {
            $(document).on('click', '.deactivator', function() {
                $(this).closest('.card-reveal').find('.card-title').click();
            });
        }
    }

    function getStalkedIds() {
        return $('.stalking-card').toArray().map(function(card) {
            return $(card).attr('id');
        });
    }
})(io);
