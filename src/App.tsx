import React from 'react';
import logo from './logo.svg';
import {
    Graph as D3Graph,
    GraphProps as D3GraphProps,
    GraphNode as D3GraphNode,
    GraphLink as D3GraphLink,
    GraphData as D3GraphData,
} from "react-d3-graph";
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

var data: D3GraphData<GraphNode, D3GraphLink> = {       // https://github.com/danielcaldas/react-d3-graph/pull/104
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

interface GraphProps extends D3GraphProps<GraphNode, D3GraphLink> {
    cb_node_selected?: (id: string) => void,
}

class Graph extends React.Component<GraphProps, {}> {
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
                config={Graph.CONFIG}
                onClickNode={this.on_click_node.bind(this)}
                onClickLink={this.on_click_link.bind(this)}
                onClickGraph={() => console.log('click graph')}
            />
        );
    }

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
            strokeWidth: 4,
        },
    };
}

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
                            <h2>{data.nodes.find(node => node.id == this.state.selected_id)!.title}</h2>
                        }
                    </div>
                    <Graph id="song-graph"
                        data={data}
                        cb_node_selected={(id) => {this.setState({selected_id: id})}}
                    />
	            </div>
				<div id="spotify-playing">Now Playing...</div>
			</div>
		);
	}
}

export default App;
