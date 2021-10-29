import React from 'react';

interface SpotifyButtonProps {
    on_aquire_token?: (token: string) => void;
}

interface SpotifyButtonState {
	profile_pic_url: string|null;
	profile_name: string|null;
	access_token: string|null;
}

export class SpotifyButton extends React.Component<SpotifyButtonProps, SpotifyButtonState> {
	// Account logic taken from: https://github.com/spotify/web-api-auth-examples/blob/master/implicit_grant/public/index.html

	constructor(props: SpotifyButtonProps) {
		super(props);

		this.state = {
			profile_pic_url: null,
			profile_name: null,
			access_token: null,
		};
	}

	componentDidMount() {
		var params = getHashParams();

		var storedState: string|null = localStorage.getItem(SpotifyButton.STATE_KEY);

		if (params.access_token && (params.state == null || params.state !== storedState)) {
			alert('There was an error during Spotify authentication');
		} else {
			localStorage.removeItem(SpotifyButton.STATE_KEY);

			if (params.access_token) {
				if (this.props.on_aquire_token) {
					this.props.on_aquire_token(params.access_token);
				}

				// Show the profile pic
				fetch(
					'https://api.spotify.com/v1/me',
					{ headers: { 'Authorization': 'Bearer ' + params.access_token } },
				).then((response) => {
					return response.json();
				}).then((json: any) => {
					this.setState({
						profile_pic_url: (json.images.length > 0) ? json.images[0].url : null,
						profile_name: json.display_name,
						access_token: params.access_token,
					});
				});
			} else {
				// $('#login').show();
				// $('#loggedin').hide();
			}
		}
	}

	render() {
		return (
			<div className="account-icon"
				style={{
					width: "48px", height: "48px",
					backgroundImage: this.state.profile_pic_url
						? `url(${this.state.profile_pic_url})`
						: 'white',
					backgroundSize: "contain",
				}}
				onClick={this.goto_login_page.bind(this)}
			>
				{ (this.state.access_token && !this.state.profile_pic_url) && this.state.profile_name }
			</div>
		);
	}

	static STATE_KEY = 'spotify_auth_state';
	static CLIENT_ID = '1d3d80974a3c4a3a99b6f25c4e7483aa'; // Your client id
	static REDIRECT_URI = 'http://localhost:3000/'; // Your redirect uri

	goto_login_page(): void {
		var state = generateRandomString(16);

		localStorage.setItem(SpotifyButton.STATE_KEY, state);
		var scope = 'user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing';

		var url = 'https://accounts.spotify.com/authorize';
		url += '?response_type=token';
		url += '&client_id=' + encodeURIComponent(SpotifyButton.CLIENT_ID);
		url += '&scope=' + encodeURIComponent(scope);
		url += '&redirect_uri=' + encodeURIComponent(SpotifyButton.REDIRECT_URI);
		url += '&state=' + encodeURIComponent(state);

		window.location.assign(url);
	}
}

function getHashParams() {
	/* Obtains parameters from the hash of the URL */
	var hashParams: any = {};
	var e, r = /([^&;=]+)=?([^&;]*)/g,
		q = window.location.hash.substring(1);
	while (e = r.exec(q)) {
		hashParams[e[1]] = decodeURIComponent(e[2]);
	}
	return hashParams;
}

function generateRandomString(length: number) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
	text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
