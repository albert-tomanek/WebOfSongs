import React, {useState} from 'react';
import {
	GraphView, // required
	Edge, // optional
	IEdge, // optional
	Node, // optional
	INode, // optional
	LayoutEngineType, // required to change the layoutEngineType, otherwise optional
	BwdlTransformer, // optional, Example JSON transformer
	GraphUtils // optional, useful utility functions
} from 'react-digraph';

// import logo from './logo.svg';
import './App.css';

/* Data definition */

interface GraphStore {
	nodes: GraphStoreNode[];
	edges: GraphStoreEdge[];
}

interface GraphStoreNode {
	id: number;
	title: string;
	x: number;
	y: number;
}

interface GraphStoreEdge {
	source: number;
	target: number;
}

/* Widget */

interface GraphState {
	graph: GraphStore;
	selected: object;
}

interface GraphProps {
    id: string;
}

const NODE_KEY = "id"       // Allows D3 to correctly update DOM

class Graph extends React.Component<GraphProps, GraphState> {
	constructor(props: GraphProps) {
		super(props);

		this.state = {
			graph: sample,
			selected: {}
		}
	}

	/* Define custom graph editing methods here */

	render() {
		const nodes = this.state.graph.nodes;
		const edges = this.state.graph.edges;
		const selected = this.state.selected;

		const NodeTypes = GraphConfig.NodeTypes;
		const NodeSubtypes = GraphConfig.NodeSubtypes;
		const EdgeTypes = GraphConfig.EdgeTypes;

		return (
			<div id='graph' style={{}}>
				<GraphView
					ref='GraphView'
					nodeKey={NODE_KEY}
					nodes={nodes}
					edges={edges}
					selected={selected}
					nodeTypes={NodeTypes}
					nodeSubtypes={NodeSubtypes}
					edgeTypes={EdgeTypes}
				/>
			</div>
		);
		// onSelectNode={this.onSelectNode}
		// onCreateNode={this.onCreateNode}
		// onUpdateNode={this.onUpdateNode}
		// onDeleteNode={this.onDeleteNode}
		// onSelectEdge={this.onSelectEdge}
		// onCreateEdge={this.onCreateEdge}
		// onSwapEdge={this.onSwapEdge}
		// onDeleteEdge={this.onDeleteEdge}
	}
}

const GraphConfig = {
  NodeTypes: {
	empty: { // required to show empty nodes
	  typeText: "None",
	  shapeId: "#empty", // relates to the type property of a node
	  shape: (
		<symbol viewBox="0 0 100 100" id="empty" key="0">
		  <circle cx="50" cy="50" r="45"></circle>
		</symbol>
	  )
	},
	custom: { // required to show empty nodes
	  typeText: "Custom",
	  shapeId: "#custom", // relates to the type property of a node
	  shape: (
		<symbol viewBox="0 0 50 25" id="custom" key="0">
		  <ellipse cx="50" cy="25" rx="50" ry="25"></ellipse>
		</symbol>
	  )
	}
  },
  NodeSubtypes: {},
  EdgeTypes: {
	emptyEdge: {  // required to show empty edges
	  shapeId: "#emptyEdge",
	  shape: (
		<symbol viewBox="0 0 50 50" id="emptyEdge" key="0">
		  <circle cx="25" cy="25" r="8" fill="currentColor"> </circle>
		</symbol>
	  )
	}
  }
}

/* Data */

const sample = {
  "nodes": [
	{
	  "id": 1,
	  "title": "Node A",
	  "x": 258.3976135253906,
	  "y": 331.9783248901367,
	  "type": "empty"
	},
	{
	  "id": 2,
	  "title": "Node B",
	  "x": 593.9393920898438,
	  "y": 260.6060791015625,
	  "type": "empty"
	},
	{
	  "id": 3,
	  "title": "Node C",
	  "x": 237.5757598876953,
	  "y": 61.81818389892578,
	  "type": "custom"
	},
	{
	  "id": 4,
	  "title": "Node C",
	  "x": 600.5757598876953,
	  "y": 600.81818389892578,
	  "type": "custom"
	}
  ],
  "edges": [
	{
	  "source": 1,
	  "target": 2,
	  "type": "emptyEdge"
	},
	{
	  "source": 2,
	  "target": 4,
	  "type": "emptyEdge"
	}
  ]
};

// const App: React.FC<AppProps> = ({is_admin, user_name}): JSX.Element => {   // FC = functional component. SFC = stateless ...
//     const [time, setTime] = useState<Date>(() => new Date(Date.now()));
//
//     setInterval(() => {
//         setTime(new Date(Date.now()));
//     }, 1000);
//
//     return (
//         <div className="App">
//             <p>Hey, {user_name}!</p>
//             { is_admin &&
//                 <p>Welcome to the club!</p>
//             }
//             <p>
//                 Time is {time.toUTCString()}
//             </p>
//         </div>
//     );
// }

interface AppProps {
	user_name: string | undefined;
	is_admin: boolean;
}

const App: React.FC<AppProps> = ({user_name, is_admin}) => {
	return (
		<div style={{display: "flex", flexDirection: "column", height: "100%"}}>
            <div style={{display: "flex", flexDirection: "row", flexGrow: 1}}>
    			<div id="ordering-panel">Song Order</div>
    			<Graph id="song-graph"/>
            </div>
			<div id="spotify-playing">Now Playing...</div>
		</div>
	);
}

export default App;
