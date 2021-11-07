import React from 'react';
import logo from './logo.svg';
import DraggableList from 'react-draggable-list';

// https://cnpmjs.org/package/@types/spotify-web-playback-sdk
import SpotifyWebApi from 'spotify-web-api-js';

import {event as currentEvent} from 'd3-selection';
import './App.css';


/* UI Elements */
import {
    GraphLink as D3GraphLink,
    GraphData as D3GraphData,
} from "react-d3-graph";

import { AuthButtonSpotify } from './AuthButtonSpotify';
import { AuthButtonGoogleDrive } from './AuthButtonGoogleDrive';
import { WOSGraph, WOSGraphData, WOSGraphNode, WOSGraphLink } from './WOSGraph';
import { NodePanel, OrderingElt } from './NodePanel';
import { WOSNode, get_node, get_node_links, get_node_outgoing_links, get_link } from './Node';

import Plus from './plus.svg';
import Bomb from './bomb.svg';

var TEST_DATA: WOSGraphData = {       // https://github.com/danielcaldas/react-d3-graph/pull/104
    nodes: [
        { id: "spotify:track:16g1GYkl4ogjX8UxsrRGHM"},
        { id: "spotify:track:2lpApUodMauXt8yzMeQtOB"},
        { id: "spotify:track:0bqjS54zmDlYanW8mlx28k"},
        { id: "spotify:track:2tjNv48TztwpNJZV8DKssQ"}
    ],
    links: [
        { source: "spotify:track:16g1GYkl4ogjX8UxsrRGHM", index: 2, target: "spotify:track:2lpApUodMauXt8yzMeQtOB" },
        { source: "spotify:track:16g1GYkl4ogjX8UxsrRGHM", index: 1, target: "spotify:track:0bqjS54zmDlYanW8mlx28k" },
        { source: "spotify:track:16g1GYkl4ogjX8UxsrRGHM", index: 3, target: "spotify:track:2tjNv48TztwpNJZV8DKssQ" },
        { source: "spotify:track:2tjNv48TztwpNJZV8DKssQ", index: 1, target: "spotify:track:0bqjS54zmDlYanW8mlx28k" },
    ],
};

/* App */

interface AppProps {
	user_name?: string | undefined;
}

interface AppState {
    selected_id: string | null;
    playing_id: string | null;
    data: WOSGraphData;
}

class App extends React.Component<AppProps, AppState> {
    static spotify = new SpotifyWebApi();

    constructor(props: AppProps) {
		super(props);

		this.state = {
            selected_id: null,
            playing_id: null,
            data: TEST_DATA,
		};
	}

    componentDidMount() {
        this.setState(state => {
            var data = state.data;
            data.nodes.forEach(node => {
                App.recompute_link_color(data, node.id);
            });

            return { data: data };
        });
    }

	render() {
		return (
			<div style={{display: "flex", flexDirection: "column", height: "100%"}}>
	            <div style={{display: "flex", flexDirection: "row", flexGrow: 1}}>
	    			<div id="ordering-panel">
                        <div style={{display: "flex", flexDirection: "column", alignItems: "stretch", height: "100%"}}>
                            { this.state.selected_id ?
                                <NodePanel
                                    data={this.state.data}
                                    node_id={this.state.selected_id}

                                    cb_reorder={this.on_links_reorder.bind(this)}
                                    cb_delete_link={this.on_delete_link.bind(this)}
                                    cb_play_node={this.on_play_node.bind(this)}
                                />
                                :
                                <div style={{flexGrow: 1}} />
                            }

                            <div id="now-playing" style={{padding: "16px"}}>
                                { this.state.playing_id &&
                                    <>
                                        <div style={{paddingBottom: "16px"}}>Now playing:</div>
                                        <OrderingElt
                                            node={{id: this.state.playing_id}}
                                            index={1}
                                            shadow={1}
                                            action_hide_unless_hover={false}
                                            action_icon_src={Plus}
                                            action_callback={this.link_to_current.bind(this)}
                                        />
                                    </>
                                }
                                { !this.state.playing_id &&
                                    <i>Play a song in Spotify to add it to the graph.</i>
                                }
                            </div>
                        </div>
                    </div>
                    <WOSGraph id="song-graph"
                        data={this.state.data}
                        cb_focus_node={(id: string|null) => {this.setState((state, props) => ({selected_id: id}))}}      // https://medium.com/ableneo/react-setstate-does-not-immediately-update-the-state-84dbd26f67d5
                        cb_play_node={this.on_play_node.bind(this)}
                    />
	            </div>
                <div id="icons-container" style={{position: "absolute", right: "12px", top: "12px", display: "flex", flexDirection: "column", gap: "12px"}}>
                    <AuthButtonSpotify on_aquire_token={this.on_spotify_login.bind(this)}/>
                    <AuthButtonGoogleDrive/>
                </div>
                <div className="account-icon" style={{position: "absolute", right: "12px", bottom: "12px", width: "48px", height: "48px", backgroundSize: "contain", backgroundColor: "white"}}>
                    <img src={Bomb} style={{padding: "7px"}}/>
                </div>
			</div>
		);
	}

    /* Account callbacks */

    on_spotify_login(access_token: string)
    {
        App.spotify.setAccessToken(access_token);

        this.sync_currently_playing();
        setInterval(() => this.sync_currently_playing(), 5000);
    }

    sync_currently_playing() {
        App.spotify.getMyCurrentPlaybackState().then(state => {
            // console.log(state.is_playing, this.state.playing_id)
            if (state.is_playing == false)
            {
                if (this.state.playing_id != null)
                {
                    console.log('Stopped playing');
                    this.setState({
                        playing_id: null
                    });
                }
            }
            else if (!state.item) {
                // Whaat? return;
            }
            else if (state.item!.uri != this.state.playing_id)
            {
                console.log('Next song');
                this.setState({
                    playing_id: null    // FIXME: I don't know why you have to make it null first in order to trigger a re-render.
                }, () => {
                    this.setState({
                        playing_id: state.item!.uri
                    });
                });
            }
            else {
                // console.log('(nothing changed)');
                // Nothing's changed.
            }
        });
    }

    /* UI callbacks */

    on_play_node(id: string) {

        App.spotify.getTrack(id.split(':')[2]).then((track_json) => {
            App.spotify.play({
                context_uri: track_json.album.uri,
                offset: {
                    position: track_json.track_number - 1,  // There was an off-by-one error for some reason. Weird since we're getting the infex from anfd feeding it back to the same API.
                }
            }).then(() => {
                console.log('submitted play')
                this.sync_currently_playing();
            })
        });

    }

    link_to_current() {
        /* Link the currently playing song to the currently selected song */

        if (this.state.selected_id && this.state.playing_id) {
            /* Create the new link */
            this.setState((old_state) => {
                var old_data = old_state.data;
                var new_nodes, new_links;

                /* Create the node if it doesn't exist */
                if (!get_node(old_data, this.state.playing_id!)) {
                    new_nodes = old_data.nodes.concat([{id: this.state.playing_id!}]);
                }
                else {
                    new_nodes = old_data.nodes
                }

                /* Create the link if it doesn't exist */
                if (!get_link(old_data, old_state.selected_id!, old_state.playing_id!)) {
                    var num_links = get_node_outgoing_links(old_data, old_state.selected_id!).length;
                    new_links = old_data.links.concat([{ source: this.state.selected_id!, target: this.state.playing_id!, index: num_links + 1 }]);
                }
                else {
                    new_links = old_data.links;
                }

                return {
                    data: {
                        nodes: new_nodes,
                        links: new_links,
                    }
                };
            });
        }
    }

    on_links_reorder(target_ids: string[])
    {
        this.setState((old_state) => {
            var data = old_state.data;

            target_ids.forEach((target_id, i) => {
                var link: WOSGraphLink = get_link(
                    data,
                    old_state.selected_id!, // If the links were reordered then there's gotta be sth selected
                    target_id
                )!;
                link.index = i;
            });

            App.recompute_link_color(data, old_state.selected_id!);

            return { data: data };
        });
    }

    on_delete_link(id_from: string, id_to: string) {
        this.setState((old_state) => {
            var new_links = Array.from(old_state.data.links);
            var new_nodes = Array.from(old_state.data.nodes);

            {
                /* Find the index of the link and remove it */
                var index = new_links.findIndex((link: WOSGraphLink) => (link.source === id_from) && (link.target === id_to))!;
                new_links.splice(index, 1);
            }

            return {
                data: {
                    nodes: new_nodes,
                    links: new_links,
                }
            };
        }, () => {
            /* Remove either node if it doesn't have any more links connected to it. */
            if (get_node_links(this.state.data, id_from).length == 0) {
                this.on_delete_node(id_from);
            }
            if (get_node_links(this.state.data, id_to).length == 0) {
                this.on_delete_node(id_to);
            }
        });
    }

    on_delete_node(node_id: string) {
        this.setState((old_state) => {
            var new_links = Array.from(old_state.data.links);
            var new_nodes = Array.from(old_state.data.nodes);

            {
                /* Remove the node */
                var index = new_nodes.findIndex((node: WOSGraphNode) => (node.id == node_id))!;
                new_nodes.splice(index, 1);

                /* Remove any links leading to/from it */
                for (var link of get_node_links(old_state.data, node_id)) {
                    var index = new_links.indexOf(link);
                    new_links.splice(index, 1);
                }
            }

            return {
                selected_id: null,
                data: {
                    nodes: new_nodes,
                    links: new_links,
                }
            };
        });
    }

    static recompute_link_color(data: WOSGraphData, node_id: string) {
        var links = get_node_outgoing_links(data, node_id).sort((a, b) => a.index - b.index);

        links.forEach((link, i) => {
            // Apply a functiuon so that all but the first link seem *almost* equally weak.
            var strength = 1 - (i / links.length);
            var MIN = 0.15;
            strength = 1/((1-1/MIN)*strength + (1/MIN));

            link.color = `hsl(0, 0%, ${(1-strength)*100}%)`;
        });
    }
}

export default App;

/* API stuff */
declare global {    // We need to declare this 'static' variable as part of the Window class in order to be able to use it.
    interface Window {
        _swpsdk_loaded?: boolean;
    }
}

// function adapted from: https://github.com/gilbarbara/react-spotify-web-playback/blob/c3fcf5022dad4b13c15363b5632a14b7b4ece9ce/src/utils.ts#L49
function loadSpotifyPlaybackAPI(): Promise<any> {
    // Safe to be called multiple times.
    return new Promise<void>((resolve, reject) => {
        const scriptTag = document.getElementById('spotify-player');

        if (!window._swpsdk_loaded) {
            const script = document.createElement('script');

            script.id = 'spotify-player';
            script.type = 'text/javascript';
            script.async = false;
            script.defer = true;
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            // script.onload = () => resolve(); // Too early. Spotify attaches its own hook to `window`.
            script.onerror = (error: any) => reject(new Error(`loadScript: ${error.message}`));

            window.onSpotifyWebPlaybackSDKReady = () => {
                window._swpsdk_loaded = true;
                resolve();
            };

            document.head.appendChild(script);
        } else {
            // `window.onSpotifyWebPlaybackSDKReady` must have already been invoked.

            resolve();
        }
    });
}
