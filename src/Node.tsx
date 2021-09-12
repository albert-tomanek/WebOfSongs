import React from 'react';
import { GraphData as D3GraphData } from "react-d3-graph";

import { WOSGraphData, WOSGraphNode, WOSGraphLink } from './WOSGraph';

export interface WOSNodeProps {
	node: WOSGraphNode;
	shadow?: number;		/* [0,1] */
	dragHandleProps?: any;

	cb_focus_node?: (id: string) => void;
	cb_play_node?:  (id: string) => void;
}

export const WOSNode: React.FC<WOSNodeProps> = (p) => {
    return (
        <div className="song-node" style={{display: "flex", flexDirection: "row", filter: `drop-shadow(1px 4px 8px rgba(0, 0, 0, ${(p.shadow??0)*0.30}))`}} {...p.dragHandleProps}>
            <div className="song-node-img" style={{width: "65px", height: "65px", background: `url(${p.node.cover_url}), #8E8E8E`, backgroundSize: 'cover'}}>
				<svg width="65" height="65" xmlns="http://www.w3.org/2000/svg"
					onClick={() => { if (p.cb_play_node) {p.cb_play_node(p.node.id)}}}
				>
					<path transform="rotate(90, 34.1061, 32.7)" d="m21.81981,42.68264l12.2863,-19.96524l12.2863,19.96524l-24.5726,0l0.00001,0z" stroke="black" fill="white" strokeWidth="2"/>
				</svg>
			</div>
            <div style={{display: "flex", flexDirection: "column", justifyContent: "space-around", padding: "8.5px 8.5px 8.5px 10px"}}
				onClick={() => { if (p.cb_focus_node) {p.cb_focus_node(p.node.id)}}}
			>
                <div className="title">{p.node.title}</div>
                <div className="band">{p.node.band}</div>
            </div>
        </div>
    );
}

export function get_node(data: WOSGraphData, node_id: string): WOSGraphNode|null {
	return data.nodes.find((node: WOSGraphNode) => node.id === node_id) ?? null;
}

export function get_node_links(data: WOSGraphData, node_id: string): WOSGraphLink[] {
	return data.links.filter((link: WOSGraphLink) => link.source === node_id);
}

export function get_link(data: WOSGraphData, id_from: string, id_to: string): WOSGraphLink|null {
    return data.links.find((link: WOSGraphLink) => (link.source === id_from) && (link.target === id_to)) ?? null;
}
