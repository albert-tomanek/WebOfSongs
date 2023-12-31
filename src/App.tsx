// Run with: /opt/node-v14.15.2-linux-x64/bin/node /opt/node-v14.15.2-linux-x64/lib/node_modules/npm/bin/npm-cli.js start
// ⚠

import React from 'react';
import DraggableList from 'react-draggable-list';

// https://cnpmjs.org/package/@types/spotify-web-playback-sdk
import SpotifyWebApi from 'spotify-web-api-js';

// TODO: Replace with https://github.com/adrianbota/gdrive-appdata
// @ts-ignore
import { gapi } from "gapi-script";

import {event as currentEvent} from 'd3-selection';
import './App.css';


/* UI Elements */
import {
    GraphLink as D3GraphLink,
    GraphData as D3GraphData,
} from "react-d3-graph";

import { AuthButtonSpotify } from './AuthButtonSpotify';
import { WOSGraph, WOSGraphData, WOSGraphNode, WOSGraphLink } from './WOSGraph';
import { NodePanel, OrderingElt } from './NodePanel';
import { WOSNode, get_node, get_node_links, get_link, get_link_index_on, set_link_index_on, get_neigbour_id } from './Node';

import Plus from './plus.svg';
import Bomb from './bomb.svg';

// Uhh we need this to talk with python
export const eel = window.eel
eel.set_host('ws://localhost:8080') // If you get a `TypeError: Eel is undefined`, you haven't started the helper script in `src_python/`.

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

    save_file_id: string|null;  // The ID of the file we're saving to in Google Drive. It's not in State because changing this does not require a re-render from React's side.

    constructor(props: AppProps) {
		super(props);

        // Google drive stuff
        this.setup_atexit_code();
        this.save_file_id = null;

		this.state = {
            selected_id: null,
            playing_id: null,
            data: { nodes: [], links: [] },
		};
	}

    componentDidMount() {
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
                                    selected_id={this.state.selected_id}
                                    playing_id={this.state.playing_id}

                                    cb_change_sentimental={(sen) => { this.setState((old_state) => {
                                        var data = old_state.data;
                                        get_node(data, this.state.selected_id!)!.sentimental = sen;
                                        return { data: data };
                                    }); }}
                                    cb_reorder={this.on_links_reorder.bind(this)}
                                    cb_delete_link={this.on_delete_link.bind(this)}
                                    cb_play_node={this.on_play_node.bind(this)}
                                />
                                :
                                <div style={{flexGrow: 1}} />
                            }

                            <div id="now-playing" style={{padding: "16px"}}>
                                { App.spotify.getAccessToken() &&
                                    <>
                                        { this.state.playing_id &&
                                            <>
                                                <div style={{paddingBottom: "16px"}}>Now playing:</div>
                                                <OrderingElt
                                                    node={{id: this.state.playing_id, x:0,y:0}}
                                                    index={1}
                                                    shadow={1}
                                                    action_hide_unless_hover={false}
                                                    action_icon_src={Plus}
                                                    action_callback={() => {this.link_to_current();}}
                                                    is_focused={false}
                                                    is_playing={true}
                                                />
                                            </>
                                        }
                                        { !this.state.playing_id &&
                                            <i>Play a song in Spotify to add it to the graph.</i>
                                        }
                                    </>
                                }
                                { !App.spotify.getAccessToken() &&
                                    <i><AuthButtonSpotify on_aquire_token={this.on_spotify_login.bind(this)}/> to see playing songs.</i>
                                }
                            </div>
                        </div>
                    </div>
                    <WOSGraph id="song-graph"
                        data={this.state.data}
                        selected_id={this.state.selected_id}
                        playing_id={this.state.playing_id}
                        cb_focus_node={(id: string|null) => {this.setState((state, props) => ({selected_id: id}))}}      // https://medium.com/ableneo/react-setstate-does-not-immediately-update-the-state-84dbd26f67d5
                        cb_play_node={this.on_play_node.bind(this)}
                    />
	            </div>
                <div className="account-icon" onClick={() => {this.load_graph();}} style={{position: "absolute", right: "12px", bottom: "12px", width: "48px", height: "48px", backgroundSize: "contain", backgroundColor: "white"}}>
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

        this.load_graph();
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

        if (this.state.playing_id) {
            if (this.state.selected_id)
            {
                /* Create the new link */
                this.setState((old_state) => {
                    var old_data = old_state.data;
                    var new_nodes, new_links;

                    /* Create the node if it doesn't exist */
                    if (!get_node(old_data, this.state.playing_id!)) {
                        var selected = get_node(old_data, this.state.selected_id!)!;

                        new_nodes = old_data.nodes.concat([{id: this.state.playing_id!, x: selected.x + 20, y: selected.y + 20}]);
                    }
                    else {
                        new_nodes = old_data.nodes
                    }

                    /* Create the link if it doesn't exist */
                    if (!get_link(old_data, old_state.selected_id!, old_state.playing_id!)) {
                        var src_links = get_node_links(old_data, old_state.selected_id!).length;
                        var dst_links = get_node_links(old_data, old_state.playing_id!).length;

                        new_links = old_data.links.concat([{
                            source: this.state.selected_id!,
                            target: this.state.playing_id!,
                            index_src: src_links + 1,       // Make it the weakest link on both ends
                            index_dst: dst_links + 1,
                            ctime: (new Date()).getTime(),
                        }]);
                    }
                    else {
                        new_links = old_data.links;
                    }

                    var new_data = {
                        nodes: new_nodes,
                        links: new_links,
                    }

                    /* Recompute the colours of the links */
                    App.recompute_link_color(new_data, this.state.selected_id!);

                    return {
                        data: new_data,
                    };
                });
            }
            else
            {
                /* If there's no selected node to link to then add it to the graph at least */
                this.setState(old_state => {
                    return {
                        data: {
                            nodes: old_state.data.nodes.concat([{id: old_state.playing_id!, x: 0, y: 0}]),
                            links: old_state.data.links
                        }
                    };
                });
            }
        }
    }

    on_links_reorder(target_ids: string[])
    {
        this.setState((old_state) => {
            var data = old_state.data;

            target_ids.forEach((target_id, i) => {
                set_link_index_on(data, target_id, old_state.selected_id!, i);
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

    static link_colour(frac: number): string {
        // `frac` is the [0-1] placement of the link out of the total number of links

        var MAX = 0.85;
        frac = Math.sqrt(frac) * MAX;

        return `hsl(0, 0%, ${frac*100}%)`;
    }

    static recompute_link_color(/*out*/ data: WOSGraphData, node_id: string) {
        var links: WOSGraphLink[] = get_node_links(data, node_id)
        .sort((link_a, link_b) => get_link_index_on(link_a, node_id) - get_link_index_on(link_b, node_id));

        links.forEach((link, i) => {
            // Apply a functiuon so that all but the first link seem *almost* equally weak.

            var link_frac_here  = i / (links.length);
            var link_frac_there = get_link_index_on(link, get_neigbour_id(link, node_id)!) / (get_node_links(data, get_neigbour_id(link, node_id)!).length);

            // Although actually the colour needs to represent the link's priority on *both* the songs it connects, so we average between the two fractions.
            link.color = App.link_colour((link_frac_here + link_frac_there) / 2);
        });
    }

    /* Saving the graph */
    setup_atexit_code(): void {
        window.addEventListener('beforeunload', e => {
            /* Cancel the event */
            e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
            e.returnValue = ''; // Chrome requires returnValue to be set

            if (App.spotify.getAccessToken()) {     // Only save the grah if we actually managed to log in
                this.save_graph();
            }
        });
    }

    save_graph(): void {
        var output: WOSGraphData = {
            nodes: this.state.data.nodes,
            links: App.keep_properties(this.state.data.links as any, ['source', 'index_src', 'target', 'index_dst', 'ctime']) as [WOSGraphLink],
        }

        window.eel.py_write_graph_file(JSON.stringify(output))();
    }

    static keep_properties(list: any[], propnames: string[]): any[] {
        return list.map((item: {[index: string]:any}) => {
            // https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6#38750895
            return Object.keys(item)
                .filter(key => propnames.includes(key))
                .reduce((obj: {[index: string]:any}, key: string) => {
                    obj[key] = item[key];
                    return obj;
                }, {});
        });
    }

    load_graph(): void {
        console.log('Loading graph');
        window.eel.py_read_graph_file()().then((text: string) => {
            try {
                var json: any = JSON.parse(text);
                if (json.nodes != undefined && json.links != undefined)
                {
                    /* Merge the loaded data into whatever is already there (probably nothing) */
                    this.setState(state => {
                        return {
                            data: {
                                nodes: state.data.nodes.concat(json.nodes),
                                links: state.data.links.concat(json.links),
                            }
                        }
                    });

                    /* Compute the link colours for each link */
                    this.setState(state => {
                        var data = state.data;
                        data.nodes.forEach(node => {
                            App.recompute_link_color(data, node.id);
                        });

                        return { data: data };
                    });
                }
            }
            catch (e) {
                alert("Error loading graph from JSON: " + (e as Error).message);
            }
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
