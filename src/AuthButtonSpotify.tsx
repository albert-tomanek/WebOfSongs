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
	// Uses the Authorization Code flow with PKCE: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
	// The redirect URI must be registered in the dashboard, and must be https:// or http://127.0.0.1 (not localhost).

    static CLIENT_ID = '1d3d80974a3c4a3a99b6f25c4e7483aa';  // https://developer.spotify.com/dashboard
    static REDIRECT_URI = window.location.origin + window.location.pathname;    // Without the query string, so that it's the same before and after the redirect
    static SCOPE = 'user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing';

    refresh_timer: number|undefined;

	constructor(props: AuthButtonSpotifyProps) {
		super(props);

		this.state = {
			profile_pic_url: null,
			profile_name: null,
			access_token: null,
		};
	}

	componentDidMount() {
        var url_params = new URLSearchParams(window.location.search);   // Spotify's OAuth returns ?code=...&state=... (or ?error=...)
        var token_expiry = parseInt(localStorage.getItem('spotify_token_expiry') ?? '0');     // Expiry time of the cached token

		if (url_params.has('code') || url_params.has('error')) {
            /* If we've returned from OAuth */
            window.history.replaceState(null, '', AuthButtonSpotify.REDIRECT_URI + window.location.hash);    // Get rid of the query params

            var storedState: string|null = localStorage.getItem('spotify_auth_state');
            var code_verifier: string|null = localStorage.getItem('spotify_code_verifier');
            localStorage.removeItem('spotify_auth_state');
            localStorage.removeItem('spotify_code_verifier');

            if (url_params.has('error') || url_params.get('state') !== storedState || code_verifier == null) {
    			alert('There was an error during Spotify authentication');
    		} else {
                this.request_token({
                    grant_type: 'authorization_code',
                    code: url_params.get('code')!,
                    redirect_uri: AuthButtonSpotify.REDIRECT_URI,
                    code_verifier: code_verifier,
                });
    		}
        }
        else if (Date.now() < token_expiry) {
            this.token_aquired(localStorage.getItem('spotify_auth_token')!);
            this.schedule_refresh(token_expiry);
        }
        else if (localStorage.getItem('spotify_refresh_token')) {
            this.refresh_token();
        }
        else {
            // Too bad. No token. We've got to wait for the user to log in.
        }
	}

    componentWillUnmount() {
        window.clearTimeout(this.refresh_timer);
    }

    request_token(params: Record<string, string>) {
        /* Exchanges an authorization code or refresh token for an access token */
        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: AuthButtonSpotify.CLIENT_ID, ...params }),
        }).then((response) => {
            if (!response.ok) throw new Error('Token request failed: ' + response.status);
            return response.json();
        }).then((json: any) => {
            var expiry = Date.now() + 1000*json.expires_in;

            localStorage.setItem('spotify_auth_token', json.access_token);
            localStorage.setItem('spotify_token_expiry', expiry.toString());
            if (json.refresh_token) {   // Spotify may rotate the refresh token
                localStorage.setItem('spotify_refresh_token', json.refresh_token);
            }

            this.token_aquired(json.access_token);
            this.schedule_refresh(expiry);
        }).catch((err) => {
            console.error(err);
            localStorage.removeItem('spotify_refresh_token');   // Probably revoked; the user will have to log in again.
        });
    }

    refresh_token() {
        this.request_token({
            grant_type: 'refresh_token',
            refresh_token: localStorage.getItem('spotify_refresh_token')!,
        });
    }

    schedule_refresh(expiry: number) {
        // Refresh a minute before the token runs out
        window.clearTimeout(this.refresh_timer);
        this.refresh_timer = window.setTimeout(() => this.refresh_token(), Math.max(0, expiry - Date.now() - 60*1000));
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
                profile_pic_url: (json.images?.length > 0) ? json.images[0].url : null,
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

	async goto_login_page() {
		if (window.location.hostname === 'localhost') {
			// Spotify rejects localhost as a redirect URI, but allows 127.0.0.1. Move there first, since localStorage is per-origin.
			window.location.hostname = '127.0.0.1';
			return;
		}

		var state = generateRandomString(16);
		var code_verifier = generateRandomString(64);

		localStorage.setItem('spotify_auth_state', state);
		localStorage.setItem('spotify_code_verifier', code_verifier);

		var url = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
			response_type: 'code',
			client_id: AuthButtonSpotify.CLIENT_ID,
			scope: AuthButtonSpotify.SCOPE,
			redirect_uri: AuthButtonSpotify.REDIRECT_URI,
			state: state,
			code_challenge_method: 'S256',
			code_challenge: await sha256Base64Url(code_verifier),
		});

        window.location.assign(url);
	}

    signout(): void {
        this.setState({
            profile_pic_url: null,
            profile_name: null,
            access_token: null,
        });

        window.clearTimeout(this.refresh_timer);
        localStorage.removeItem('spotify_auth_token');
        localStorage.removeItem('spotify_token_expiry');
        localStorage.removeItem('spotify_refresh_token');
    }
}

function generateRandomString(length: number) {
	/* Cryptographically random, as required for the PKCE code verifier */
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var values = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(values, (x) => possible[x % possible.length]).join('');
}

async function sha256Base64Url(text: string) {
	/* Computes the PKCE code challenge. Note that crypto.subtle is only available on https:// or 127.0.0.1. */
	var digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return btoa(String.fromCharCode(...Array.from(new Uint8Array(digest))))
		.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
