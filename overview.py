#!/usr/bin/python

import sys
import json
import pystache
import requests
from datetime import datetime

GBIF = "https://api.gbif.org/v1/"

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

query = { 'publishingCountry': 'NO', 'limit': 500 }
response = requests.get(GBIF + "dataset/search", params=query).json()

datasets = []
sources = {}
for result in response['results']:
    data = requests.get(GBIF + "dataset/" + result['key']).json()
    source = data['installationKey']
    if not source in sources:
        sources[source] = requests.get(GBIF + "installation/" + source).json()

    # doesn't look like we can trust the record counts from the dataset search
    occurrences = requests.get(GBIF + "occurrence/search",
            params={ 'datasetKey': result['key'] }).json()
    datasets.append({
        'key': result['key'],
        'title': result['title'],
        'occurrenceCount': occurrences['count'],
        'installation': sources[source]['title'],
        'organization': result['publishingOrganizationTitle'],
        'type': result['type'].replace("_", " ").capitalize(),
        'created': datetime.fromisoformat(data['created'][:19]).strftime("%Y-%m-%d"),
        'modified': datetime.fromisoformat(data['modified'][:19]).strftime("%Y-%m-%d"),
    })

datasets = sorted(datasets, key=lambda k: (k['type'], k['title']))
renderer = pystache.Renderer()

template = open("template.html", "r").read()
html = renderer.render(template, { 'datasets': datasets, 'datasets_string': json.dumps(datasets) })
with open('index.html', 'w') as f:
  f.write(html)

