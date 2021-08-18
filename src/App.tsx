import React from 'react';
import logo from './logo.svg';
import {
    Graph as D3Graph,
    GraphProps as D3GraphProps,
    GraphNode as D3GraphNode,
    GraphLink as D3GraphLink, } from "react-d3-graph";
// import * as d3 from 'd3';
import {event as currentEvent} from 'd3-selection';
import './App.css';

interface GraphNode extends D3GraphNode {
    title: string;
    band: string;
    cover_url: string;
}

function viewgen(node: GraphNode): JSX.Element {
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

const data = {
    nodes: [
        { id: "Harry", title: "Seven", band: "Andrew Huang", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" },
        { id: "Sally", title: "Cold & Clear", band: "Liam Bailey", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" },
        { id: "Alice", title: "Stars", band: "Ivy Lab", cover_url: "https://image.flaticon.com/icons/png/512/872/872199.png" }],
    links: [
        { source: "Harry", target: "Sally" },
        { source: "Harry", target: "Alice" },
    ],
};

/* Graph */

class Graph extends React.Component<D3GraphProps<GraphNode, D3GraphLink>, {}> {
    static CONFIG = {
        nodeHighlightBehavior: true,
        node: {
            color: "lightgreen",
            size: {width: 1950, height: 690},   // pixels x10 for some reason...  https://danielcaldas.github.io/react-d3-graph/docs/#node-size
            highlightStrokeColor: "blue",
            renderLabel: false,
            viewGenerator: viewgen,
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

    render() {
        return (
            <D3Graph
                id="graph-id"
                data={this.props.data}
                config={Graph.CONFIG}
                onClickNode={this.on_click_node}
                onClickLink={this.on_click_link}
                onClickGraph={() => console.log('click graph')}
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
                    <Graph id="song-graph" data={data} />
	            </div>
				<div id="spotify-playing">Now Playing...</div>
			</div>
		);
	}
}

export default App;
