import React from 'react';

interface AuthButtonSpotifyProps {
    on_aquire_token?: (token: string) => void;
}

interface AuthButtonSpotifyState {
	profile_pic_url: string|null;
	profile_name: string|null;
	access_token: string|null;
}

export class AuthButtonSpotify extends React.Component<AuthButtonSpotifyProps, AuthButtonSpotifyState> {
	// Account logic taken from: https://github.com/spotify/web-api-auth-examples/blob/master/implicit_grant/public/index.html

    static CLIENT_ID = '1d3d80974a3c4a3a99b6f25c4e7483aa'; // Your client id
    static REDIRECT_URI = 'http://localhost:3000/'; // Your redirect uri

	constructor(props: AuthButtonSpotifyProps) {
		super(props);

		this.state = {
			profile_pic_url: null,
			profile_name: null,
			access_token: null,
		};
	}

	componentDidMount() {
        var url_params = getHashParams(); // Get params from the URL if we've returned from Spotify's OAuth
        var token_expiry = parseInt(localStorage.getItem('spotify_token_expiry') ?? '0');     // Expiry time of the cached token

		if (url_params.access_token) {
            /* If we've returned from OAuth */
            // window.history.pushState(null, '', window.location.href);    // Change the url to get rid of the hash params.
            window.location.assign(window.location.href);   // FIXME: above doesn't work

            var storedState: string|null = localStorage.getItem('spotify_auth_state');

            if ((url_params.state == null || url_params.state !== storedState)) {
    			alert('There was an error during Spotify authentication');
    		} else {
    			localStorage.removeItem('spotify_auth_state');

                localStorage.setItem('spotify_auth_token', url_params.access_token);
                localStorage.setItem('spotify_token_expiry', (Date.now() + 1000*parseInt(url_params.expires_in)).toString());
                this.token_aquired(url_params.access_token);
    		}
        }
        else if (Date.now() < token_expiry) {
            this.token_aquired(localStorage.getItem('spotify_auth_token')!);
        }
        else {
            // Too bad. No token. We've got to wait for the user to log in.
        }
	}

    token_aquired(token: string) {
        if (this.props.on_aquire_token) {
            this.props.on_aquire_token(token);
        }

        // Show the profile pic
        fetch(
            'https://api.spotify.com/v1/me',
            { headers: { 'Authorization': 'Bearer ' + token } },
        ).then((response) => {
            return response.json();
        }).then((json: any) => {
            this.setState({
                profile_pic_url: (json.images.length > 0) ? json.images[0].url : null,
                profile_name: json.display_name,
                access_token: token,
            });
        });
    }

	render() {
		// return (
		// 	<div className="account-icon"
		// 		style={{
		// 			width: "48px", height: "48px",
		// 			backgroundImage: this.state.profile_pic_url
		// 				? `url(${this.state.profile_pic_url})`
		// 				: 'white',
		// 			backgroundSize: "contain",
		// 		}}
		// 		onClick={this.on_click.bind(this)}
		// 	>
		// 		{ (this.state.access_token && !this.state.profile_pic_url) && this.state.profile_name }
		// 	</div>
		// );

        return (
            <a
                onClick={this.on_click.bind(this)}
                style={{color: "blue", textDecoration: "underline", cursor: "pointer"}}
            >Sign in to Spotify</a>
        );
    }

    on_click(): void {
        if (this.state.access_token == null) {
            this.goto_login_page();
        }
        else {
            this.signout();
        }
    }

	goto_login_page(): void {
		var state = generateRandomString(16);

		localStorage.setItem('spotify_auth_state', state);
		var scope = 'user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing';

		var url = 'https://accounts.spotify.com/authorize';
		url += '?response_type=token';
		url += '&client_id=' + encodeURIComponent(AuthButtonSpotify.CLIENT_ID);
		url += '&scope=' + encodeURIComponent(scope);
		url += '&redirect_uri=' + encodeURIComponent(AuthButtonSpotify.REDIRECT_URI);
		url += '&state=' + encodeURIComponent(state);

		window.location.assign(url);
	}

    signout(): void {
        this.setState({
            profile_pic_url: null,
            profile_name: null,
            access_token: null,
        });

        localStorage.setItem('spotify_token_expiry', '0');  // Just pretend the token has expired so that it doesn't get used.
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
