import React from 'react';
import logo from './logo.svg';
import { Graph as D3Graph } from "react-d3-graph";
// import * as d3 from 'd3';
import {event as currentEvent} from 'd3-selection';
import './App.css';

function viewgen(node: any): JSX.Element {
    return (
        <div>
            {node.id}
        </div>
    );
}

const data = {
  nodes: [{ id: "Harry", viewGenerator: viewgen }, { id: "Sally", viewGenerator: viewgen }, { id: "Alice", viewGenerator: viewgen }],
  links: [
    { source: "Harry", target: "Sally" },
    { source: "Harry", target: "Alice" },
  ],
};

/* Graph */

interface GraphProps {
    data: any,
}

class Graph extends React.Component<GraphProps, {}> {
    static CONFIG = {
        nodeHighlightBehavior: true,
        node: {
            color: "lightgreen",
            size: 120,
            highlightStrokeColor: "blue",
        },
        link: {
            highlightColor: "lightblue",
        },
    };

    on_click_node(id: string) {
        console.log('click ' + id);
    }

    on_click_link(from_id: string, to_id: string) {
        console.log('click link ' + from_id + ',' + to_id);
    }

    on_click_graph() {
        console.log('click graph');
    }

    render() {
        return (
            <D3Graph
                id="graph-id"
                data={this.props.data}
                config={Graph.CONFIG}
                onClickNode={this.on_click_node}
                onClickLink={this.on_click_link}
                onClickGraph={this.on_click_graph}
            />
        );
    }
}

/* App */

interface AppProps {
	user_name?: string | undefined;
}

interface AppState {
}

class App extends React.Component<AppProps, AppState> {
	constructor(props: AppProps) {
		super(props);

		this.state = {
		};
	}

	render() {
		return (
			<div style={{display: "flex", flexDirection: "column", height: "100%"}}>
	            <div style={{display: "flex", flexDirection: "row", flexGrow: 1}}>
	    			<div id="ordering-panel">Song Order</div>
                    <D3Graph id="my-graph" data={data} />
	            </div>
				<div id="spotify-playing">Now Playing...</div>
			</div>
		);
	}
}

export default App;
