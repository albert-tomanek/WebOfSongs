import React from 'react';
import { GraphData as D3GraphData } from "react-d3-graph";

import App from './App';
import { WOSGraphData, WOSGraphNode, WOSGraphLink } from './WOSGraph';

export interface WOSNodeProps {
	/* The node component doesn't do any actual logic.
	 * It just displays itself in the way specified by the folowing parameters.	*/

	node: WOSGraphNode;
	shadow?: number;		/* [0,1] */
	dragHandleProps?: any;

	cb_focus_node?: (id: string) => void;
	cb_play_node?:  (id: string) => void;

	is_focused: boolean;
	is_playing: boolean;
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
	        <div className={p.is_focused ? "song-node selected" : "song-node"} style={{display: "flex", flexDirection: "row", filter: `drop-shadow(1px 4px 8px rgba(0, 0, 0, ${(p.shadow??0)*0.30}))`}} {...p.dragHandleProps}>
	            <div className="song-node-img" style={{flexShrink: 0, width: "65px", height: "65px", backgroundImage: `url(${this.state.cover_url ?? ""})`, backgroundSize: 'cover'}}>
					<svg width="65" height="65" xmlns="http://www.w3.org/2000/svg"
						onClick={() => { if (p.cb_play_node) {p.cb_play_node(p.node.id)}}}
						className={p.is_playing == false ? "hover-play" : ""}
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

// Get a the node with the given ID
export function get_node(data: WOSGraphData, node_id: string): WOSGraphNode|null {
	return data.nodes.find((node: WOSGraphNode) => node.id === node_id) ?? null;
}

// Get the ID of the node at the other end of this link. We don't know what direction the link is going in.
export function get_neigbour_id(link: WOSGraphLink, this_id: string): string|null {
	if (link.source == this_id)
		return link.target;
	else if (link.target == this_id)
		return link.source;
	else
		return null;
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

// These functions get/set the index of the link on _whichever_ end is on the node in quesiton
export function get_link_index_on(link: WOSGraphLink, id_to: string): number {
	if (link.target == id_to)
		return link.index_dst;
	else if (link.source == id_to)
		return link.index_src;
	else
		return 0;
}

export function set_link_index_on(data: WOSGraphData, id_a: string, id_b: string, index_b: number) {
	let link = data.links.find((link: WOSGraphLink) => 
		((link.source == id_a) && (link.target == id_b)) ||
		((link.source == id_b) && (link.target == id_a))
	)!;

	if (link.target == id_b)
	{
		link.index_dst = index_b;
		console.log("dst", index_b);
	}
	else if (link.source == id_b)
	{
		link.index_src = index_b;
		console.log("src", index_b);
	}
}