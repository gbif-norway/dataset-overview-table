#!/usr/bin/python

import sys
import json
import pystache
import requests

reload(sys)
sys.setdefaultencoding('utf-8')

GBIF = "https://api.gbif.org/v1/"

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

query = { 'publishingCountry': 'NO', 'limit': 500 }
response = requests.get(GBIF + "dataset/search", params=query).json()

datasets = []
installations = {}
for result in response['results']:
    data = requests.get(GBIF + "dataset/" + result['key']).json()
    ikey = data['installationKey']
    if not ikey in installations:
        installations[ikey] = requests.get(GBIF + "installation/" + ikey).json()
    occurrences = requests.get(GBIF + "occurrence/search",
            params={ 'datasetKey': result['key'] }).json()
    datasets.append({
        'key': result['key'],
        'title': result['title'],
        'occurrenceCount': occurrences['count'],
        'installation': installations[ikey]['title'],
        'organization': result['publishingOrganizationTitle'],
        'type': result['type'].capitalize()
    })


datasets = sorted(datasets, key=lambda k: (k['type'], k['title']))
template = open("template.html", "r").read()

renderer = pystache.Renderer()
html = renderer.render(template, { 'datasets': datasets })

print(html)

