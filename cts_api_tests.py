"""
A Python module for performing quick, "single-user" load testing
specifially for the CTS API (think "bursts" of requests from a developer).
Although the nodejs module does a great job at simulating multiple-user
scenarios by directly connecting to the nodejs server behind nginx, 
this Python module will be an easy way to simulate a developer making
programmatic requests to the CTS endpoints.
"""

import requests
import time
import json



class ApiTests:

	def __init__(self):

		# URLs
		self.base_url = "https://qed.epacdx.net"
		self.metabolizer_url = self.base_url + "/cts/rest/metabolizer/run"
		self.test_url = self.base_url + "/cts/rest/testws/run"
		self.props = ['melting_point', 'boiling_point', 'water_sol',
			'vapor_press', 'log_bcf']  # available props for TEST in CTS API

		# POST Examples:
		# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		# NOTE: For human biotransformation, use a blank list for
		# transformationLibraries key (e.g., "transformationLibraries": []).
		# Also, hydrolysis and abiotic can be run separate or together, but
		# biotransformation can only run by itself.
		self.metabolizer_post = {
			"structure": "CCCC",
			"generationLimit": 1,
			"transformationLibraries": [
				"hydrolysis",
				"abiotic_reduction"
			]
		}
		self.test_post = {
			"chemical": "CCCC",
			"calc": "test",
			"prop": "water_sol"
		}
		# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	def make_request(self, url, post_data):
		"""
		Makes a POST request, returns dictionary of data.
		"""
		data = requests.post(url, data=json.dumps(post_data), headers={'Content-Type': "application/json"})
		response_data = json.loads(data.text)
		return response_data




if __name__ == '__main__':

	api = ApiTests()

	print("\nMaking a request to metabolizer for abiotic and reduction pathways.")
	metabolizer_post_1 = dict(api.metabolizer_post)
	response = api.make_request(api.metabolizer_url, metabolizer_post_1)
	print("{}".format(response))
	
	time.sleep(1)

	print("\nMaking a request to metabolizer for biotransformation pathway.")
	metabolizer_post_2 = dict(api.metabolizer_post)
	metabolizer_post_2['transformationLibraries'] = []
	response = api.make_request(api.metabolizer_url, metabolizer_post_2)
	print("{}".format(response))

	time.sleep(1)

	print("\nMaking a request to TEST for water solubility.")
	test_post_1 = dict(api.test_post)
	response = api.make_request(api.test_url, test_post_1)
	print("{}".format(response))