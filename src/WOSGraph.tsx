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
    r_container: any;

    constructor(props: WOSGraphProps) {
        super(props);

        this.r_container = React.createRef();
        this.state = {config: {
            width: 200,
            height: 200,
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

    componentDidMount() {
        // Mrrrrrrh here's the issue you're looking for https://github.com/danielcaldas/react-d3-graph/issues/399
        console.log('component mounted')
        var resizeObserver = new ResizeObserver((entries) => {
            // this is only ever a single element list of the one parent container we're observing
            for (let entry of entries) {
                if (entry.contentRect) {
                    console.log(entry.contentRect.width, entry.contentRect.height)

                    this.setState(state => {
                        state.config.width  = entry.contentRect.width;
                        state.config.height = entry.contentRect.height - 5;     // The D3Graph has a 5px internal padding for dsome reason??

                        return state;
                    });
                }
            }
        });

        resizeObserver.observe(this.r_container.current);
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
        // Manually expand the graph to fit. Thanks bro:    https://github.com/danielcaldas/react-d3-graph/issues/332#issuecomment-650354806
        // const containerResizeRef = React.useCallback((containerNode) => {
        //     if (containerNode) {
        //         // // set the graph size to the size of the parent when the component mounts
        //         // setGraphSize({
        //         //     width: containerNode.offsetWidth,
        //         //     height: containerNode.offsetHeight,
        //         // });
        //
        //         const resizeObserver = new ResizeObserver((entries) => {
        //             // this is only ever a single element list of the one parent container we're observing
        //             for (let entry of entries) {
        //                 if (entry.contentRect) {
        //                     console.log(entry.contentRect.width, entry.contentRect.height)
        //
        //                     this.setState(state => {
        //                         state.config.width  = entry.contentRect.width;
        //                         state.config.height = entry.contentRect.height;
        //
        //                         return state;
        //                     });
        //                 }
        //             }
        //         });
        //
        //         resizeObserver.observe(containerNode);
        //     }
        // }, []);

        return (
            <div style={{/*background: "red",*/ flexGrow: 1}} ref={this.r_container} >
                <D3Graph
                id="graph-id"
                data={this.props.data}
                config={this.state.config}
                onClickLink={this.on_click_link.bind(this)}
                onClickGraph={() => this.props.cb_focus_node ? this.props.cb_focus_node(null) : null}
                />
            </div>
        );
    }
}
