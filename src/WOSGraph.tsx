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
    cb_focus_node?: (id: string|null) => void,
    cb_play_node?:  (id: string) => void;
}

export class WOSGraph extends React.Component<WOSGraphProps, {config: any}> {
    constructor(props: WOSGraphProps) {
        super(props);

        this.state = {config: {
            directed: true,
            staticGraphWithDragAndDrop: true,
            nodeHighlightBehavior: true,
            node: {
                color: "lightgreen",
                size: {width: 1950, height: 690},   // pixels x10 for some reason...  https://danielcaldas.github.io/react-d3-graph/docs/#node-size
                highlightStrokeColor: "blue",
                renderLabel: false,
                viewGenerator: (node: WOSGraphNode) => {
                    return React.createElement(WOSNode,{
                        node: node,
                        cb_focus_node: this.props.cb_focus_node,
                        cb_play_node:  this.props.cb_play_node,
                    }, null)
                },
            },
            link: {
                color: "black",
                highlightColor: "lightblue",
                strokeWidth: 4,
            },
        }};
    }

    on_click_node(id: string) {
        if (this.props.cb_focus_node) {
            this.props.cb_focus_node(id);
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
                config={this.state.config}
                onClickLink={this.on_click_link.bind(this)}
                onClickGraph={() => this.props.cb_focus_node ? this.props.cb_focus_node(null) : null}
            />
        );
    }
}
