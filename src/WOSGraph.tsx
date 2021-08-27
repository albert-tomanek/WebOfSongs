import React from 'react';
import {
    Graph as D3Graph,
    GraphProps as D3GraphProps,
    GraphData as D3GraphData,
    GraphNode as D3GraphNode,
	GraphLink as D3GraphLink,
} from "react-d3-graph";

import { WOSNode } from './Node';

export interface WOSGraphNode extends D3GraphNode {
    title: string;
    band: string;
    cover_url: string;
}

export interface WOSGraphLink extends D3GraphLink {
	index: number;
}

export type WOSGraphData = D3GraphData<WOSGraphNode, WOSGraphLink>;

/* Component */

interface WOSGraphProps extends D3GraphProps<WOSGraphNode, D3GraphLink> {
    cb_node_selected?: (id: string|null) => void,
}

export class WOSGraph extends React.Component<WOSGraphProps, {}> {
    on_click_node(id: string) {
        if (this.props.cb_node_selected) {
            this.props.cb_node_selected(id);
        }
    }

    on_click_link(from_id: string, to_id: string) {
        console.log('click link ' + from_id + ',' + to_id);
    }

    render() {
        return (
            <D3Graph
                id="graph-id"
                data={this.props.data}
                config={WOSGraph.CONFIG}
                onClickNode={this.on_click_node.bind(this)}
                onClickLink={this.on_click_link.bind(this)}
                onClickGraph={() => this.props.cb_node_selected ? this.props.cb_node_selected(null) : null}
            />
        );
    }

    static CONFIG = {
        nodeHighlightBehavior: true,
        directed: true,
        node: {
            color: "lightgreen",
            size: {width: 1950, height: 690},   // pixels x10 for some reason...  https://danielcaldas.github.io/react-d3-graph/docs/#node-size
            highlightStrokeColor: "blue",
            renderLabel: false,
            viewGenerator: (node: WOSGraphNode) => React.createElement(WOSNode, {node: node}, null),
        },
        link: {
            color: "black",
            highlightColor: "lightblue",
            strokeWidth: 4,
        },
    };
}
