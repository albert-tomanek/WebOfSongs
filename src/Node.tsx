import React from 'react';
import { GraphData as D3GraphData } from "react-d3-graph";

import { WOSGraphNode, WOSGraphLink } from './WOSGraph';

interface WOSNodeProps {
	node: WOSGraphNode
}

export const WOSNode: React.FC<WOSNodeProps> = ({node}) => {
    return (
        <div className="song-node" style={{display: "flex", flexDirection: "row"}}>
            <img src={node.cover_url} style={{background: "#8E8E8E", width: "65px", height: "65px"}}/>
            <div style={{display: "flex", flexDirection: "column", justifyContent: "space-around", padding: "8.5px 8.5px 8.5px 10px"}}>
                <div className="title">{node.title}</div>
                <div className="band">{node.band}</div>
            </div>
        </div>
    );
}

export function get_node(data: D3GraphData<WOSGraphNode, WOSGraphLink>, node_id: string): WOSGraphNode {
	return data.nodes.find(node => node.id === node_id)!;
}

export function get_node_links(data: D3GraphData<WOSGraphNode, WOSGraphLink>, node_id: string): WOSGraphLink[] {
	return data.links.filter(link => link.source === node_id);
}
