from notifications.signals import notify


class NotificationTypes:
    def track_request_pending(actor, **kwargs):
        kwargs['verb'] = 'created a track request'
        kwargs['type'] = 'track_request_pending'
        notify.send(actor, **kwargs)

    def track_request_approved(actor, **kwargs):
        kwargs['verb'] = 'approved your track request'
        kwargs['type'] = 'track_request_approved'
        notify.send(actor, **kwargs)

    def track_request_declined(actor, **kwargs):
        kwargs['verb'] = 'declined your track request'
        kwargs['type'] = 'track_request_declined'
        notify.send(actor, **kwargs)
