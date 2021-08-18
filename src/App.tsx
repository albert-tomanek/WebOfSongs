import React from 'react';
import logo from './logo.svg';
import DraggableList from 'react-draggable-list';

import {event as currentEvent} from 'd3-selection';
import './App.css';

import {
    GraphLink as D3GraphLink,
    GraphData as D3GraphData,
} from "react-d3-graph";

import { WOSGraphNode, WOSGraph } from './WOSGraph';
import { NodeDetails } from './NodeDetails';

var data: D3GraphData<WOSGraphNode, D3GraphLink> = {       // https://github.com/danielcaldas/react-d3-graph/pull/104
    nodes: [
        { id: "Harry", title: "Seven", band: "Andrew Huang", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" },
        { id: "Sally", title: "Cold & Clear", band: "Liam Bailey", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" },
        { id: "Alice", title: "Stars", band: "Ivy Lab", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" }],
    links: [
        { source: "Harry", target: "Sally" },
        { source: "Harry", target: "Alice" },
    ],
};

/* App */

interface AppProps {
	user_name?: string | undefined;
}

interface AppState {
    selected_id: string | null;
}

class App extends React.Component<AppProps, AppState> {
	constructor(props: AppProps) {
		super(props);

		this.state = {
            selected_id: null,
		};
	}

	render() {
		return (
			<div style={{display: "flex", flexDirection: "column", height: "100%"}}>
	            <div style={{display: "flex", flexDirection: "row", flexGrow: 1}}>
	    			<div id="ordering-panel">
                        { this.state.selected_id &&
                            <NodeDetails data={data} node_id={this.state.selected_id}/>
                        }
                    </div>
                    <WOSGraph id="song-graph"
                        data={data}
                        cb_node_selected={(id: string) => {this.setState({selected_id: id})}}
                    />
	            </div>
				<div id="spotify-playing">Now Playing...</div>
			</div>
		);
	}
}

export default App;
