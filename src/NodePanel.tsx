import React from 'react';
import { GraphData as D3GraphData } from "react-d3-graph";
import DraggableList from "react-draggable-list";

import { WOSGraphNode, WOSGraphLink } from './WOSGraph';
import { WOSNode, get_node, get_node_links } from './Node';

interface NodePanelProps {
    data: D3GraphData<WOSGraphNode, WOSGraphLink>;
    node_id: string;
}

interface NodePanelState {
}

export class NodePanel extends React.Component<NodePanelProps, NodePanelState> {
    // templ: ListTemplate;

	constructor(props: NodePanelProps) {
		super(props);

        // this.templ = new ListTemplate({});
		this.state = {
		};
	}

	render() {
		return (
			<div>
				<h2>{get_node(this.props.data, this.props.node_id).title}</h2>
                <DraggableList<WOSGraphNode, void, ListTemplate>
                    list={get_node_links(this.props.data, this.props.node_id).sort((a, b) => a.index - b.index).map(link => get_node(this.props.data, link.target))}
                    itemKey="target"
                    template={ListTemplate}
                />
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
        console.log(this.props.item)
        return (
            <WOSNode node={this.props.item} key={this.props.itemKey}/>
        );
    }
}
