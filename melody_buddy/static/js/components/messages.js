export class Messages {
    constructor() {
        const messages = $('.message');

        messages.each((index, message) => {
            new Message($(message));
        });
    }
}

class Message {
    constructor($element) {
        this.$element = $element;
        this.$closeIcon = this.$element.find('.js-message-close');
        this.$closeIcon.on('click', __closeMessageHandler.bind(this));
    }
}

function __closeMessageHandler() {
        this.$closeIcon.parents('.message').remove();
}