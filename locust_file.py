from locust import Locust, TaskSet, task, HttpLocust
from locust.events import request_success
import json
# import gevent
# from socketIO_client import SocketIO, LoggingNamespace, BaseNamespace
# import time


class UserBehavior(TaskSet):

    def on_start(self):
        # default TaskSet func, called per User initialization..
        self.initial_call()

    def initial_call(self):
        response = self.client.get("/cts/rest/chemaxon/")  # get chemaxon info


    @task
    def pchem_test(self):
        # run chemaxon for pchem data:
        sample_post = {
            'chemical': "CCCC",
            'calc': "chemaxon",
            'prop': "water_sol",
            'type': "rest"
        }
        response = self.client.post("/cts/rest/chemaxon/run/", json.dumps(sample_post))


class WebsiteUser(HttpLocust):
    """
    Represents a user
    """
    task_set = UserBehavior
    min_wait = 0
    max_wait = 100