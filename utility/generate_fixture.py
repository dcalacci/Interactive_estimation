import os
import json
import subprocess

fixture = []


old_fixture = None
with open('../fixtures/initial_round.json', encoding='utf-8') as data_file:
    old_fixture = json.load(data_file)

to_keep = [obj["fields"]["plot"].split('.')[0] for obj in old_fixture]

for n, fname in enumerate(os.listdir('./plots')):
    name, value, other = fname.split('__')
    name = name.split('_')[0]
    value = value.split('_')[0]
    other = other.split('.')[0]

    fixture_obj = {
        "model": "round.plot",
        "fields": {
            "plot": "{}.png".format(name),
            "answer": "{}".format(value),
            "duration": None
        }

    }

    if name in to_keep:
        fixture.append(fixture_obj)

    for n, obj in enumerate(fixture):
        obj["pk"] = n+1
        fixture[n] = obj

    # after its added, rename it:

    os.rename(os.path.join("./plots", fname), "./plots/{}.svg".format(name))



with open("initial_round.json", 'w') as fp:
    json.dump(fixture, fp)

#subprocess.call(["find", './plots', '|', "xargs", "-I", "file", "inkscape", "-z", "-e", "file.png", "-w", "679", "-h", "548", "file"])

# for n, fname in enumerate(os.listdir('./plots')):
#     name = fname.split(".")[0]
#     os.rename(os.path.join("./plots", fname), "./plots/{}.png".format(name))



