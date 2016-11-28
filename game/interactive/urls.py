from django.conf.urls import url

from .views import assign, assign_with_group, lobby, exit_survey, done

urlpatterns = [
    url(r'^$', assign),
    url(r'^(?P<group_id>\w+)/(?P<linked_id>\w+)$', assign_with_group, name='assign_group'),
    url(r'^lobby/$', lobby, name='lobby'),
    url(r'^lobby/(?P<group_id>\w+)/(?P<linked_id>\w+)$', lobby, name='lobby_group'),
#    url(r'^lobby/(?P<group_id>\w+)$', lobby, name='lobby_group'),
    
    # url(r'^play/$', play, name='play'),
    # url(r'^submit/$', submit_answer, name='submit'),
    # url(r'^view_answers/$', view_answers, name='view_answers'),
    url(r'^exit/$', exit_survey, name='exit'),
    url(r'^done/$', done, name='done')
]
