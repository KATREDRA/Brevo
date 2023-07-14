// Client ID and API key from the Developer Console
var CLIENT_ID = '296426870147-9koen6cbgfgosb4n4fqk5tarv5191f24.apps.googleusercontent.com';
var developerKey = 'AIzaSyDxY-GfjHC5RVcL4lKvqnqnAwCuPYh7fWY';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var pickerApiLoaded = false;
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive";
var scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive'];

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
//authorizeButton.onclick = initClient;
/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
	gapi.load('client:auth2', function(e) {
		gapi.client.init({
			discoveryDocs: DISCOVERY_DOCS,
			clientId: CLIENT_ID,
			scope: SCOPES
		}).then(function() {});
	});
	gapi.load('auth', function(e) {});
	gapi.load('picker', {
		'callback': function(e) {
			pickerApiLoaded = true;
		}
	});
}

function handleAuthResult(authResult) {
	if (authResult && !authResult.error) {
		oauthToken = authResult.access_token;
		createPicker();
	}
}
// Create and render a Picker object for picking user Photos.
function createPicker() {
	if (pickerApiLoaded) {
		var picker = new google.picker.PickerBuilder().
		addView(google.picker.ViewId.SPREADSHEETS).
		setDeveloperKey(developerKey).
		setOAuthToken(oauthToken).
		setCallback(pickerCallback).
		build();
		picker.setVisible(true);
	}
}

function pickerCallback(data) {
	var url = 'nothing',
		id = '',
		name = '';
	if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
		var doc = data[google.picker.Response.DOCUMENTS][0];
		url = doc[google.picker.Document.URL];
		id = doc[google.picker.Document.ID];
		name = doc[google.picker.Document.NAME];
	}
	listMajors(name, id);
}
/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
	window.gapi.auth.authorize({
			'client_id': CLIENT_ID,
			'scope': scopes,
			'immediate': false
		},
		handleAuthResult);
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
	if (isSignedIn) {
		authorizeButton.style.display = 'none';
		//signoutButton.style.display = 'block';
		//createPicker();
		//listMajors();
	} else {
		authorizeButton.style.display = 'block';
		signoutButton.style.display = 'none';
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
	if (authResult && !authResult.error) {
		oauthToken = authResult.access_token;
		createPicker();
	}
}
/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
	gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
	var pre = document.getElementById('content');
	var textContent = document.createTextNode(message + '\n');
	pre.appendChild(textContent);
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
function listMajors(name, id) {
	gapi.client.sheets.spreadsheets.values.get({
		spreadsheetId: id,
		range: 'A1:Z1000',
	}).then(function(response) {
		var range = response.result.values;
		var results = [];
		for (var i = 1; i < range.length; i++) {
			var tempObject = {};
			var props = [];
			for (var j = 0; j < range[0].length; j++) {
				tempObject[range[0][j]] = range[i][j];
				props.push({
					property: range[0][j],
					value: range[0][j],
					name: range[0][j]
				});
			}
			results.push(tempObject);
		}
		results = [{
			name: name,
			data: results,
			properties: props
		}];
		window.sheetsResults = results;
		appendPre(JSON.stringify(range));
		cardTemplateThis.setFileNameForGoogleFile(name,results);
		console.log(range);
	}, function(response) {
		appendPre('Error: ' + response.result.error.message);
	});
}