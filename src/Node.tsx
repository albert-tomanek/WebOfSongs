import React from 'react';
import { GraphData as D3GraphData } from "react-d3-graph";

import App from './App';
import { WOSGraphData, WOSGraphNode, WOSGraphLink } from './WOSGraph';

export interface WOSNodeProps {
	node: WOSGraphNode;
	shadow?: number;		/* [0,1] */
	dragHandleProps?: any;

	cb_focus_node?: (id: string) => void;
	cb_play_node?:  (id: string) => void;
}

interface WOSNodeState {
	title: string|null;
    band: string|null;
    cover_url: string|null;
}

// Consider Design guidelines: https://developer.spotify.com/documentation/general/design-and-branding/
export class WOSNode extends React.Component<WOSNodeProps, WOSNodeState> {
	constructor(props: WOSNodeProps) {
		super(props);

		this.state = {
			title: null,
		    band: null,
		    cover_url: null,
		};
	}

	componentDidMount() {
		if (App.spotify.getAccessToken())
		{
			App.spotify.getTrack(this.props.node.id.split(':')[2]).then((json) => {
				this.setState({
					title: json.name,
					band: json.artists.map(a => a.name).join(', '),
					cover_url: json.album.images.sort((a, b) => a.width! - b!.width!)[0].url,
				});
			});
		}
	}

	render() {
		var p = this.props;
	    return (
	        <div className="song-node" style={{display: "flex", flexDirection: "row", filter: `drop-shadow(1px 4px 8px rgba(0, 0, 0, ${(p.shadow??0)*0.30}))`}} {...p.dragHandleProps}>
	            <div className="song-node-img" style={{flexShrink: 0, width: "65px", height: "65px", backgroundImage: `url(${this.state.cover_url ?? ""})`, backgroundSize: 'cover'}}>
					<svg width="65" height="65" xmlns="http://www.w3.org/2000/svg"
						onClick={() => { if (p.cb_play_node) {p.cb_play_node(p.node.id)}}}
					>
						<path transform="rotate(90, 34.1061, 32.7)" d="m21.81981,42.68264l12.2863,-19.96524l12.2863,19.96524l-24.5726,0l0.00001,0z" stroke="black" fill="white" strokeWidth="2"/>
					</svg>
				</div>
	            <div style={{display: "flex", flexDirection: "column", justifyContent: "space-around", padding: "8.5px 8.5px 8.5px 10px"}}
					onClick={() => { if (p.cb_focus_node) {p.cb_focus_node(p.node.id)}}}
				>
					{ App.spotify.getAccessToken() ?
						<>
			                <div className="title">{this.state.title ?? "░░░░░░░"}</div>
			                <div className="band">{this.state.band ?? "░░░░░░░"}</div>
						</> :
						<>
							<div className="title">{"Title"}</div>
							<div className="band">{this.props.node.id}</div>
						</>
					}
	            </div>
	        </div>
	    );
	}
}

export function get_node(data: WOSGraphData, node_id: string): WOSGraphNode|null {
	return data.nodes.find((node: WOSGraphNode) => node.id === node_id) ?? null;
}

export function get_node_outgoing_links(data: WOSGraphData, node_id: string): WOSGraphLink[] {
	return data.links.filter((link: WOSGraphLink) => link.source === node_id);
}

export function get_node_links(data: WOSGraphData, node_id: string): WOSGraphLink[] {
	return data.links.filter((link: WOSGraphLink) => (link.source === node_id) || (link.target === node_id));
}

export function get_link(data: WOSGraphData, id_from: string, id_to: string): WOSGraphLink|null {
    return data.links.find((link: WOSGraphLink) => (link.source === id_from) && (link.target === id_to)) ?? null;
}
