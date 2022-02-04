// Help with gapi + ts/react: https://gist.github.com/jakekara/652e3c3bf272cd682ae39b50f1c45062

import React from 'react';
import { gapi } from "gapi-script";

interface AuthButtonGoogleDriveProps {
    on_signed_in?: () => void;
}

interface AuthButtonGoogleDriveState {
	profile_pic_url: string|null;
	profile_name: string|null;
}

export class AuthButtonGoogleDrive extends React.Component<AuthButtonGoogleDriveProps, AuthButtonGoogleDriveState> {
    // Code comes from here: https://developers.google.com/drive/api/v3/quickstart/js

    static CLIENT_ID = '70176329581-7fbvuklhskgibam9ic2rlv8hcjk8mscg.apps.googleusercontent.com';
    static API_KEY = '';

    static DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
    static SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.appdata';

    google_auth: gapi.auth2.GoogleAuth|null = null; // This is the object that keeps track of the current user, and the can be used to trigger the login dialog.

	constructor(props: AuthButtonGoogleDriveProps) {
		super(props);

		this.state = {
			profile_pic_url: null,
			profile_name: null,
		};
	}

	componentDidMount() {
        loadGoogleAPI().then(() => this.init_gapi());
	}

    static client_initialized: boolean = false;

    init_gapi() {
        if (! AuthButtonGoogleDrive.client_initialized) {
            console.log('client not initialized')
            gapi.load('client:auth2:drive', () => {
                gapi.client.init({
                    // apiKey: AuthButtonGoogleDrive.API_KEY,
                    // clientId: AuthButtonGoogleDrive.CLIENT_ID,
                    discoveryDocs: AuthButtonGoogleDrive.DISCOVERY_DOCS,
                    // scope: AuthButtonGoogleDrive.SCOPES
                }).then(() => {
                    console.log('initialized client')
                    gapi.auth2.init({
                        client_id: AuthButtonGoogleDrive.CLIENT_ID,
                        scope: AuthButtonGoogleDrive.SCOPES,
                        ux_mode: "popup",
                    }).then(
                        (google_auth) => {
                            console.log('initialized oauth')
                            // Listen for sign-in state changes.
                            google_auth.currentUser.listen((user) => this.on_current_user_changed(user));

                            this.google_auth = google_auth;
                        }, ({error, details }) => {
                            alert('Error initializing Google OAuth2:\n' + error + '\n' + details);
                        }
                    );
                }, (error) => {
                    alert('Error initializing Google client API:\n' + JSON.stringify(error, null, 4));
                });
            });

            AuthButtonGoogleDrive.client_initialized = true;
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
				onClick={this.on_click.bind(this)}
			>
				{ this.state.profile_name }
			</div>
		);
	}

    on_click() {
        if (this.google_auth) {
            if (this.google_auth.isSignedIn.get()== false) {
                this.google_auth.signIn();
            }
            else {
                this.google_auth.signOut();
            }
        }
        else {
            console.error("No GoogleAuth instance; can't log in.");
        }
    }

    on_current_user_changed(user: gapi.auth2.GoogleUser) {
        console.log('Google user changed.', `isSignedIn: ${user.isSignedIn()}`);

        if (user.isSignedIn()) {
            let profile: gapi.auth2.BasicProfile = user.getBasicProfile();
            this.setState({
                profile_name: profile.getName(),
                profile_pic_url: profile.getImageUrl(),
            });

            if (this.props.on_signed_in) {
                this.props.on_signed_in();
            }
        }
        else {
            this.setState({
                profile_name: null,
                profile_pic_url: null,
            });
        }
    }
}

declare global {    // We need to declare this 'static' variable as part of the Window class in order to be able to use it.
    interface Window {
        _gapi_loaded?: boolean;
    }
}
function loadGoogleAPI(): Promise<any> {
    // Safe to be called multiple times.
    return new Promise<void>((resolve, reject) => {
        if (!window._gapi_loaded) {
            const script = document.createElement('script');

            script.type = 'text/javascript';
            script.async = true;
            script.defer = true;
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window._gapi_loaded = true;
                resolve();
            };
            script.onerror = (error: any) => reject(new Error(`loadGoogleAPI: ${error.message}`));

            document.head.appendChild(script);
        } else {
            resolve();
        }
    });
}
