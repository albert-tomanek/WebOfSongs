import React from 'react';
import logo from './logo.svg';
import DraggableList from 'react-draggable-list';

import {event as currentEvent} from 'd3-selection';
import './App.css';

// import { SpotifyPlaybackSDK } from 'spotify-playback-sdk-node';     // Alternative: https://github.com/thelinmichael/spotify-web-api-node#usage
// import 'val-loader!./fetch-spotify';

/* UI Elements */
import {
    GraphLink as D3GraphLink,
    GraphData as D3GraphData,
} from "react-d3-graph";

import { WOSGraph, WOSGraphData, WOSGraphNode, WOSGraphLink } from './WOSGraph';
import { NodePanel, OrderingElt } from './NodePanel';
import { WOSNode, get_node, get_node_links, get_link } from './Node';

import Plus from './plus.svg';

var TEST_DATA: WOSGraphData = {       // https://github.com/danielcaldas/react-d3-graph/pull/104
    nodes: [
        { id: "seven", title: "Seven", band: "Andrew Huang", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" },
        { id: "cold&clear", title: "Cold & Clear", band: "Liam Bailey", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" },
        { id: "stars", title: "Stars", band: "Ivy Lab", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" },
        { id: "fahrenheit", title: "Fahrenheit", band: "Matt Zo", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" }
    ],
    links: [
        { source: "seven", index: 2, target: "cold&clear" },
        { source: "seven", index: 1, target: "stars" },
        { source: "seven", index: 3, target: "fahrenheit" },
        { source: "fahrenheit", index: 1, target: "stars" },
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

// https://github.com/gilbarbara/react-spotify-web-playback/blob/c3fcf5022dad4b13c15363b5632a14b7b4ece9ce/src/utils.ts#L49
function loadSpotifyPlayer(): Promise<any> {
    // Safe to be called multiple times.
    return new Promise<void>((resolve, reject) => {
        const scriptTag = document.getElementById('spotify-player');

        if (!scriptTag) {
            const script = document.createElement('script');

            script.id = 'spotify-player';
            script.type = 'text/javascript';
            script.async = false;
            script.defer = true;
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            // script.onload = () => resolve();
            script.onerror = (error: any) => reject(new Error(`loadScript: ${error.message}`));

            window.onSpotifyWebPlaybackSDKReady = () => resolve();//() => {
                // const token = '[My Spotify Web API access token]';
                // const player = new Spotify.Player({
                //     name: 'Web Playback SDK Quick Start Player',
                //     getOAuthToken: cb => { cb(token); }
                // });
            // }
            document.head.appendChild(script);
        } else {
            resolve();
        }
    });
}

class App extends React.Component<AppProps, AppState> {

	constructor(props: AppProps) {
		super(props);

        loadSpotifyPlayer();

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
                                            node={get_node(this.state.data, this.state.playing_id)!}
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
			</div>
		);
	}

    on_play_node(id: string) {
        this.setState({ playing_id: id });
    }

    link_to_current() {
        /* Link the currently playing song to the currently selected song */

        if (this.state.selected_id && this.state.playing_id) {
            /* Create the new link */
            this.setState((old_state) => {
                var data = old_state.data;

                if (! get_link(data, old_state.selected_id!, old_state.playing_id!)) {    // if the link doesn't already exist
                    var num_links = get_node_links(data, old_state.selected_id!).length;
                    data.links.push({ source: this.state.selected_id!, target: this.state.playing_id!, index: num_links + 1 });
                }

                return { data: data };
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
            var data = old_state.data;

            var index = data.links.findIndex((link: WOSGraphLink) => (link.source === id_from) && (link.target === id_to))!;
            if (index != -1) {
                data.links.splice(index, 1);
            }

            return { data: data };
        });
    }

    static recompute_link_color(data: WOSGraphData, node_id: string) {
        var links = get_node_links(data, node_id).sort((a, b) => a.index - b.index);

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
