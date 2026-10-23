"""Run against a local Firestore emulator loaded with firebase/firestore.rules.

Example: python3 tests/ranking_rules.py
No production database is accessed.
"""
import base64
import json
import time
import unittest
import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:8085/v1/projects/demo-study-planner/databases/(default)/documents'
DAY = '2026-10-24'

def token(uid):
    def encode(value):
        return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
    now = int(time.time())
    return encode({'alg': 'none', 'typ': 'JWT'}) + '.' + encode({
        'sub': uid, 'user_id': uid, 'aud': 'demo-study-planner',
        'iss': 'https://securetoken.google.com/demo-study-planner',
        'iat': now, 'exp': now + 3600, 'firebase': {'sign_in_provider': 'google.com'}
    }) + '.'

def value(v):
    if isinstance(v, bool): return {'booleanValue': v}
    if isinstance(v, int): return {'integerValue': str(v)}
    if isinstance(v, float): return {'doubleValue': v}
    if isinstance(v, str): return {'stringValue': v}
    if isinstance(v, list): return {'arrayValue': {'values': [value(x) for x in v]}}
    if isinstance(v, dict): return {'mapValue': {'fields': {k: value(x) for k, x in v.items()}}}
    raise TypeError(v)

def request(method, path, uid=None, data=None, admin=False):
    headers = {'Content-Type': 'application/json'}
    if admin: headers['Authorization'] = 'Bearer owner'
    elif uid: headers['Authorization'] = 'Bearer ' + token(uid)
    req = urllib.request.Request(BASE + '/' + path, method=method, headers=headers,
        data=json.dumps(data).encode() if data is not None else None)
    try:
        with urllib.request.urlopen(req) as response: return response.status
    except urllib.error.HTTPError as error:
        return error.code

def write(path, data, uid=None, admin=False):
    return request('PATCH', path, uid, {'fields': {k: value(v) for k, v in data.items()}}, admin)

class RankingRules(unittest.TestCase):
    def setUp(self):
        self.path = f'dailyRankings/{DAY}/users/alice'
        self.record = dict(name='Alice', icon='📚', color='#347DA5', photo='', seconds=3600, live=False, updated=1000)
        self.assertEqual(write(self.path, self.record, admin=True), 200)
        self.assertEqual(write('stats/alice', {'log': {DAY: {'数学': 3600}}}, admin=True), 200)
        self.assertEqual(write('privateData/alice', {'data': 'private'}, admin=True), 200)

    def test_owner_can_publish(self):
        self.assertEqual(write(self.path, self.record, 'alice'), 200)
    def test_other_user_cannot_publish(self):
        self.assertEqual(write(self.path, self.record, 'bob'), 403)
    def test_signed_out_cannot_publish(self):
        self.assertEqual(write(self.path, self.record), 403)
    def test_signed_in_can_read_rankings(self):
        self.assertEqual(request('GET', self.path, 'bob'), 200)
    def test_signed_out_cannot_read_rankings(self):
        self.assertEqual(request('GET', self.path), 403)
    def test_collection_query_allowed(self):
        body = {'structuredQuery': {'from': [{'collectionId': 'users'}], 'orderBy': [{'field': {'fieldPath': '__name__'}, 'direction': 'ASCENDING'}], 'limit': 200}}
        self.assertEqual(request('POST', f'dailyRankings/{DAY}:runQuery', 'bob', body), 200)
    def test_extra_private_field_rejected(self):
        self.assertEqual(write(self.path, dict(self.record, school='private school'), 'alice'), 403)
    def test_missing_field_rejected(self):
        record = dict(self.record); del record['seconds']
        self.assertEqual(write(self.path, record, 'alice'), 403)
    def test_negative_time_rejected(self):
        self.assertEqual(write(self.path, dict(self.record, seconds=-1), 'alice'), 403)
    def test_fractional_time_rejected(self):
        self.assertEqual(write(self.path, dict(self.record, seconds=1.5), 'alice'), 403)
    def test_invalid_date_rejected(self):
        self.assertEqual(write('dailyRankings/not-a-date/users/alice', self.record, 'alice'), 403)
    def test_zero_time_allowed(self):
        self.assertEqual(write(self.path, dict(self.record, seconds=0), 'alice'), 200)
    def test_other_user_cannot_delete(self):
        self.assertEqual(request('DELETE', self.path, 'bob'), 403)
    def test_private_data_still_protected(self):
        self.assertEqual(request('GET', 'privateData/alice', 'bob'), 403)
        self.assertEqual(request('GET', 'privateData/alice', 'alice'), 200)
    def test_global_profile_follow_request_allowed(self):
        self.assertEqual(write('requests/alice/from/bob', {'at': 1000, 'profile': {'grade': '', 'goal': '', 'high': ''}}, 'bob'), 200)
        self.assertEqual(write('follows/bob', {'ids': ['alice']}, 'bob'), 200)
        self.assertEqual(request('GET', 'stats/alice', 'bob'), 403)
    def test_follow_request_cannot_impersonate_another_user(self):
        self.assertEqual(write('requests/alice/from/bob', {'at': 1000}, 'mallory'), 403)
    def test_learning_records_still_require_approval(self):
        self.assertEqual(request('GET', 'stats/alice', 'stranger'), 403)
        self.assertEqual(write('stats/alice/viewers/friend', {'at': 1000}, admin=True), 200)
        self.assertEqual(request('GET', 'stats/alice', 'friend'), 200)

if __name__ == '__main__':
    unittest.main()
