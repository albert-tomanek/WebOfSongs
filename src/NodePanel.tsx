import React from 'react';
import { GraphData as D3GraphData } from "react-d3-graph";
import DraggableList from "react-draggable-list";

import { WOSGraphData, WOSGraphNode, WOSGraphLink } from './WOSGraph';
import { WOSNode, get_node, get_node_links } from './Node';

interface NodePanelProps {
    data: WOSGraphData;
    node_id: string;
    cb_reorder: (ids: string[]) => void;
}

interface NodePanelState {
    list: readonly WOSGraphNode[];  // bruh? Dunno why it has to be readonly
}

export class NodePanel extends React.Component<NodePanelProps, NodePanelState> {
	constructor(props: NodePanelProps) {
		super(props);

		this.state = {
            list: [],
		};
	}

    componentDidMount() {
        this.setState({
            list: get_node_links(this.props.data, this.props.node_id).sort((a, b) => a.index - b.index).map(link => get_node(this.props.data, link.target))
        }, () => console.log(this.state));
    }

    componentDidUpdate(old_props: NodePanelProps) {     // This is apparently bad?  https://www.freecodecamp.org/news/get-pro-with-react-setstate-in-10-minutes-d38251d1c781/#third-approach
        if (this.props !== old_props) {
            this.componentDidMount();
        }
    }

    on_list_update(new_list: ReadonlyArray<WOSGraphNode>, item: WOSGraphNode, old_idx: number, new_idx: number) {
        this.setState({list: new_list});
        this.props.cb_reorder(new_list.map(node => node.id));
    }

	render() {
		return (
			<div style={{display: "flex", flexDirection: "column", alignItems: "stretch", height: "100%"}}>
				<h1 style={{display: "flex", justifyContent: "left"}}>{get_node(this.props.data, this.props.node_id).title}</h1>
                <DraggableList<WOSGraphNode, void, ListTemplate>
                    list={this.state.list}
                    itemKey="id"
                    template={ListTemplate}
                    onMoveEnd={this.on_list_update.bind(this)}
                    constrainDrag={true}
                    springConfig={{stiffness: 600, damping: 35}}
                />
                <div className="song-node" style={{borderStyle: "dashed"}}></div>
			</div>
		);
	}
}

// {/* <ol type="1">
//     {this.get_links().sort((a, b) => a.index - b.index).map(link => <li>{link.target}</li>)}
// </ol> */}
/* List Template */

class ListTemplate extends React.Component<any, any> {
    render() {
        return (
            <WOSNode
                node={this.props.item}
                key={this.props.itemKey}
                dragHandleProps={this.props.dragHandleProps}
                shadow={this.props.itemSelected}
            />
        );
    }
}
