import React from 'react';
import { GraphData as D3GraphData } from "react-d3-graph";
import DraggableList from "react-draggable-list";

import App from './App';
import Textarea from 'react-expanding-textarea';
import { WOSGraphData, WOSGraphNode, WOSGraphLink } from './WOSGraph';
import { WOSNode, WOSNodeProps, get_node, get_node_links, get_link_index_on, set_link_index_on, get_neigbour_id } from './Node';

import Bin from './bin.svg';

interface NodePanelProps {
    data: WOSGraphData;
    selected_id: string | null;
    playing_id: string | null;
    cb_change_sentimental: (sensitive: boolean) => void;
    cb_reorder: (ids: string[]) => void;
    cb_delete_link: (id_from: string, id_to: string) => void;
    cb_play_node?: (id: string) => void;
}

interface NodePanelState {
    title: string|null;
    list: readonly WOSGraphNode[];  // bruh? Dunno why it has to be readonly
    sensitive: boolean;
}

export class NodePanel extends React.Component<NodePanelProps, NodePanelState> {
	constructor(props: NodePanelProps) {
		super(props);

		this.state = {
            title: null,
            list: [],
            sensitive: false,
		};
	}

    componentDidMount() {
        if (this.props.selected_id != null) {
            this.setState({
                list: get_node_links(this.props.data, this.props.selected_id)   // May be both outgoing and incoming links -- WOS doesn't distinguish between the two so the utilized functions account for both cases
                    .sort((link_a, link_b) => get_link_index_on(link_a, this.props.selected_id!) - get_link_index_on(link_b, this.props.selected_id!))
                    .map(link => get_node(this.props.data, get_neigbour_id(link, this.props.selected_id!)!)!),
                sensitive: get_node(this.props.data, this.props.selected_id!)!.sentimental ?? false,
            });

            App.spotify.getTrack(this.props.selected_id.split(':')[2]).then((json) => {
                this.setState({
                    title: json.name,
                });
            });
        }
    }

    componentDidUpdate(old_props: NodePanelProps) {     // This is apparently bad?  https://www.freecodecamp.org/news/get-pro-with-react-setstate-in-10-minutes-d38251d1c781/#third-approach
        console.log('componentDidUpdate')
        if (this.props !== old_props) {
            this.componentDidMount();
        }
    }

    on_list_update(new_list: ReadonlyArray<WOSGraphNode>, item: WOSGraphNode, old_idx: number, new_idx: number) {
        this.setState({list: new_list});    // 1: This is to update this's state
        this.props.cb_reorder(new_list.map(node => node.id));   // 2: This is to update the state of the node in the graph, which only our parent has access to.
    }

	render() {
        if (this.props.selected_id != null)
        {
    		return (
    			<div style={{display: "flex", flexDirection: "column", alignItems: "stretch", height: "100%", padding: "24px"}}>
    				<h1 style={{display: "flex", justifyContent: "left"}}>{this.state.title ?? "░░░░░░░"}</h1>
                    <DraggableList<WOSGraphNode, any, ListTemplate>
                        list={this.state.list}
                        itemKey="id"
                        template={ListTemplate}
                        onMoveEnd={this.on_list_update.bind(this)}
                        constrainDrag={true}
                        springConfig={{stiffness: 600, damping: 35}}
                        commonProps={{
                            list: this.state.list,  // so that each instance can find out what its index in the list is
                            delete_link_with: (id: string) => this.props.cb_delete_link(this.props.selected_id!, id),  // to call when the delete button is pressed.
                            cb_play_node: this.props.cb_play_node,
                            playing_id: this.props.playing_id,
                        }}
                    />
                    <div style={{flexGrow: 1}} />
                    <Textarea
                        defaultValue={get_node(this.props.data, this.props.selected_id)!.note ?? ""}
                        id="note-textarea"
                        maxLength={3000}
                        onChange={()=>{}}
                        placeholder="Note…"
                        onBlur={(e) => { get_node(this.props.data, this.props.selected_id!)!.note = e.target.value; }}
                    />
                    <label>
                        Sensitive
                        <input
                            type="checkbox"
                            checked={ this.state.sensitive }
                            onChange={() => {
                                this.setState((old) => { return { sensitive: !old.sensitive }; }, () => {
                                    this.props.cb_change_sentimental(this.state.sensitive);
                                });
                            }}
                        />
                    </label>
    			</div>
    		);
        }
	}
}

/* List Template */

interface OrderingEltProps extends WOSNodeProps {
    node: WOSGraphNode,
    index?: number,
    action_icon_src: string;
    action_callback: (id: string) => void;
    action_hide_unless_hover: boolean;  // Hide the bin/plus/whatever unless the mouse is hovering over the elt
}

export const OrderingElt: React.FC<OrderingEltProps> = (p) => {
    return (
        <div className="ordering-elt" style={{display: 'flex', flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
            <div>
                {p.index}.
            </div>
            <WOSNode
                node={p.node}
                dragHandleProps={p.dragHandleProps}
                shadow={p.shadow}
                cb_play_node={p.cb_play_node}
                is_focused={false}
                is_playing={p.is_playing}
            />
            <img className={p.action_hide_unless_hover ? "hide" : ""} style={{padding: "6px 4px", borderRadius: "4px"}} src={p.action_icon_src} width="24px" height="24px"
                onClick={() => p.action_callback(p.node.id)}
            />
        </div>
    );
}

class ListTemplate extends React.Component<any, any> {
    render() {
        return (
            <OrderingElt
                node={this.props.item}
                key={this.props.itemKey}
                index={1 + this.props.commonProps.list.findIndex((node: WOSGraphNode) => node.id == this.props.item.id)}
                is_focused={false}
                is_playing={this.props.item.id == this.props.commonProps.playing_id}
                shadow={this.props.itemSelected}
                dragHandleProps={this.props.dragHandleProps}
                cb_play_node={this.props.commonProps.cb_play_node}
                action_callback={id => this.props.commonProps.delete_link_with(id)}
                action_icon_src={Bin}
                action_hide_unless_hover={true}
            />
        );
    }
}
