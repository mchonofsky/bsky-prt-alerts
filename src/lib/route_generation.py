# /usr/bin/python

# run this script to generate routes.ts, a file containing the PRT routes

import sys
import os
import json
import requests
key = os.environ['PRT_KEY']

routes_link = f'https://realtime.portauthority.org/bustime/api/v3/getroutes?key={key}&format=json'
r = requests.get(routes_link)
routes = json.loads(r.content)['bustime-response']['routes']

with open('routes.ts', 'w') as route_file:
    route_file.write(f'''export const rail_routes = {
        json.dumps([i for i in routes if i['rtpidatafeed'] == 'Light Rail'])
        }''')
    route_file.write(f'''\n\nexport const bus_routes  = {
        json.dumps([i for i in routes if i['rtpidatafeed'] == 'Port Authority Bus'])
        }''')