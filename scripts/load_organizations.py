"""
This utility allows the Organization model to be populated by generating
POST requests to the organizations API endpoint using a csv input file.  (It
is not very polished, because it is not intended for long-term or frequent
use.)

The expected csv format is two columns, containing the values for "key" and
"display_name", with no header row.  The file is expected to reside in the
current working directory and to be named "organizations.csv".

Usage:

    python load_organizations.py HOST ID_TOKEN

    HOST should point to the root URL of the API instance, for example
        https://programs.openedx-instance.org

    ID_TOKEN should be a valid JWT token which will be used to authenticate
        to the API. If an instance of Studio is running in the target
        environment, with Studio Authoring Interface enabled in its Programs
        API config, then you can easily get a JWT token using this URL:
            https://studio.openedx-instance.org/programs/id_token/

"""

import csv
import json
import sys

import requests

if __name__ == '__main__':

    host, token = sys.argv[1:]
    url = '{}/api/v1/organizations/'.format(host)
    headers = {
        'content-type': 'application/json',
        'encoding': 'utf-8',
        'Authorization': 'JWT {}'.format(token)
    }

    for key, display_name in csv.reader(open('organizations.csv', 'rb')):
        data = {'key': key, 'display_name': display_name}
        res = requests.post(url, data=json.dumps(data), headers=headers)
        if res.status_code != 201:
            print res.status_code, res.json(), data
        else:
            print res.status_code, res.json()

