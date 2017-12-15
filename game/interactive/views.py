import logging
from random import choice

from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect, reverse
from django.db import transaction
from django.contrib.auth.decorators import login_required
from django.utils import timezone

from game.users.models import User
from game.contrib.calculate import calculate_score
from game.contrib.random_user import random_user
from game.interactive.forms import RoundForm, ExitSurvey
from game.round.models import Plot
from .models import Settings, Interactive, InteractiveRound


def new_interactive_game(game_settings, user):
    i = Interactive(constraints=game_settings)
    i.save()
    i.users.add(user)
    i.save()
    user.avatar = avatar()
    user.save()
    return i

def assign(request):
    """Will attempt to redirect a user to the lobby or render the home page. This
    is called if there's no sent group ID or user ID with the request.
    """
    if request.method == 'POST':
        return redirect('interactive:lobby')
    return render(request, 'pages/home2.html')

def assign_with_group(request, group_id="", linked_id=""):
    print("assign with group", group_id, linked_id)
    if (request.GET.get('GroupID', default=False)) != False:
        group_id = request.GET.get('GroupID', default="dummy")
        linked_id = request.GET.get('StudentID', default="dummy")

    redirect_url = reverse("interactive:lobby_group", kwargs={'group_id': group_id,
                                                              'linked_id': linked_id})
    if request.method == 'POST':
        return redirect(redirect_url)
    return render(request, 'pages/home2.html')


# Create your views here.
def lobby(request, group_id="", linked_id=""):
    if request.user.is_anonymous:
        u, password = random_user('i', linked_id=linked_id)
        u = authenticate(username=u.username, password=password)
        request.groupId = group_id
        request.linkedId = u.linked_id
        login(request, u)
    else:
        u = request.user
        request.groupId = group_id
        request.linkedId = u.linked_id
        if u.game_type != 'i':
            return redirect('/')

    return render(request, 'interactive/lobby.html')


@login_required(login_url='/')
def play(request):
    u = request.user
    game = Interactive.objects.get(users=u)
    users = game.users.all()

    # round = InteractiveRound.objects.create(

    played_rounds = InteractiveRound.objects.filter(user=u)
    plot_pks = {i.plot.pk for i in played_rounds}

    score = calculate_score(played_rounds)
    currentRound = len(plot_pks)

    remaining = Plot.objects.count() - currentRound

    if remaining == 0:
        i = Interactive.objects.get(user=u)
        i.end_time = timezone.now()
        i.save()
        return redirect('interactive:exit_survey')

    if request.session.get('PLOT'):
        plot = Plot.objects.get(plot=request.session.get('PLOT'))
    else:
        plots = Plot.objects.exclude(pk__in=plot_pks)
        plot = choice(plots)

    request.session['PLOT'] = plot.plot
    form = RoundForm()

    return render(request, 'interactive/play.html', {'users': users,
                                                     'state': 'initial',
                                                     'round': plot,
                                                     'form': form,
                                                     'remaining': remaining,
                                                     'currentRound': currentRound
                                                     })


# @login_required(login_url='/')
# def instruction(request):
#     u = request.user
#     game = Interactive.objects.get(user=u)
#     game.instruction = True
#     game.save()

#     return render(request, 'interactive/instructions.html')

@login_required(login_url='/')
def submit_answer(request):
    pass


@login_required(login_url='/')
def view_answers(request):
    pass


@login_required(login_url='/')
def exit_survey(request):
    form = ExitSurvey(request.POST or None)
    if request.method == 'POST':
        if form.is_valid():
            u = User.objects.get(username=request.user.username)
            game = Interactive.objects.get(users=u)
            instance = form.save(commit=False)
            instance.username = u.username
            # instance.user.add(request.user)
            instance.game = game
            instance.save()
            return redirect('interactive:done')
        else:
            print('NOT Valid')
    return render(request, 'control/survey.html', {'form': form,
                                                   'score': request.user.get_score})

def leaderboard(request):
    scores = [{"group": interactive.group,
               "score": interactive.groupScore} for interactive in Interactive.objects.all()]

    scores = filter(lambda x: str.isdigit(x['group']), scores)

    def score_sorter (score):
        if not score['score']:
            return 0
        return score['score']

    scores = sorted(scores, key=score_sorter, reverse=True)
    print("scores:", scores)

    return render(request, "interactive/leaderboard.html", {"scores": scores})


def done(request):
    return render(request, 'interactive/done.html')
