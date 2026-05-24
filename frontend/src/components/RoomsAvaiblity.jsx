import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Building2, Blocks, Layers, DoorOpen, Search, Download } from 'lucide-react';

const baseUrl = import.meta.env.VITE_API_URL;

const TerminalHierarchy = () => {
    const [hierarchyData, setHierarchyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedItems, setExpandedItems] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState(null);
    const [focusedSearch, setFocusedSearch] = useState(false);

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        try {
            const response = await fetch(`${baseUrl}/rooms/hierarchy`);
            const data = await response.json();
            setHierarchyData(data.data);
            const initialExpanded = {};
            data.data.forEach(terminal => {
                initialExpanded[`terminal-${terminal.terminal_id}`] = true;
            });
            setExpandedItems(initialExpanded);
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id, type) => {
        setExpandedItems(prev => ({ ...prev, [`${type}-${id}`]: !prev[`${type}-${id}`] }));
    };

    const handleNodeClick = (node) => {
        setSelectedNode(node);
    };

    const exportHierarchy = () => {
        const dataStr = JSON.stringify(hierarchyData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'hierarchy_export.json');
        linkElement.click();
    };

    const filterData = (data, term) => {
        if (!term) return data;
        return data.filter(terminal => 
            terminal.terminal_name.toLowerCase().includes(term.toLowerCase()) ||
            terminal.blocks?.some(block => 
                block.block_name.toLowerCase().includes(term.toLowerCase()) ||
                block.floors?.some(floor =>
                    floor.floor_name.toLowerCase().includes(term.toLowerCase()) ||
                    floor.rooms?.some(room =>
                        room.room_name.toLowerCase().includes(term.toLowerCase()) ||
                        room.room_code.toLowerCase().includes(term.toLowerCase())
                    )
                )
            )
        );
    };

    const filteredData = filterData(hierarchyData, searchTerm);

    if (loading) {
        return <HierarchySkeleton />;
    }

    return (
        <div className="flex min-h-screen" style={{ background: '#F8F9FC' }}>
            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen">
                
                {/* Top Header */}
                <header className="h-20 bg-white flex items-center justify-between px-8 sticky top-0 z-10" style={{ borderBottom: '1px solid #EEF0F4', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Facility Hierarchy</h2>
                        <p className="text-sm text-gray-400 mt-0.5">Manage terminals, blocks, floors, and rooms</p>
                    </div>
                    {/* <button
                        onClick={exportHierarchy}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                        style={{ background: '#0B1D3A', color: '#ffffff', boxShadow: '0 4px 14px rgba(11,29,58,0.15)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#132D5E'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#0B1D3A'}
                    >
                        <Download size={16} /> Export JSON
                    </button> */}
                </header>

                {/* Content Area */}
                <div className="flex-1 p-8">
                    
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative max-w-xl">
                            <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center" style={{ borderRight: focusedSearch ? '1px solid #0B1D3A' : '1px solid #E5E7EB', background: focusedSearch ? '#F0F4FF' : '#FAFAFA', borderRadius: '10px 0 0 10px', transition: 'all 0.2s ease' }}>
                                <Search size={18} style={{ color: focusedSearch ? '#0B1D3A' : '#9CA3AF' }} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search terminals, blocks, floors, or rooms..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setFocusedSearch(true)}
                                onBlur={() => setFocusedSearch(false)}
                                className="w-full h-12 pl-12 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200"
                                style={{
                                    background: focusedSearch ? '#F0F4FF' : '#FAFAFA',
                                    border: focusedSearch ? '1.5px solid #0B1D3A' : '1.5px solid #E5E7EB',
                                    borderRadius: '10px',
                                    boxShadow: focusedSearch ? '0 0 0 3px rgba(11,29,58,0.06)' : 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Tree View Panel */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #EEF0F4' }}>
                            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #EEF0F4' }}>
                                <h3 className="font-semibold text-gray-900 text-sm">Hierarchy Structure</h3>
                                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 text-gray-600">{filteredData.length} Terminals</span>
                            </div>
                            <div className="p-4 max-h-[70vh] overflow-y-auto">
                                {filteredData.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No results found</p>
                                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
                                    </div>
                                ) : (
                                    filteredData.map(terminal => (
                                        <TerminalNode
                                            key={terminal.terminal_id}
                                            terminal={terminal}
                                            expandedItems={expandedItems}
                                            toggleExpand={toggleExpand}
                                            onNodeClick={handleNodeClick}
                                            selectedNode={selectedNode}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Details Panel */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-fit sticky top-24" style={{ border: '1px solid #EEF0F4' }}>
                            <div className="p-5" style={{ borderBottom: '1px solid #EEF0F4' }}>
                                <h3 className="font-semibold text-gray-900 text-sm">Node Details</h3>
                            </div>
                            <div className="p-5">
                                {selectedNode ? (
                                    <NodeDetails node={selectedNode} />
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                            <Building2 className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-medium text-sm">Select a node</p>
                                        <p className="text-gray-400 text-xs mt-1">Click any item in the tree to view its details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Tree Node Components ---

const TerminalNode = ({ terminal, expandedItems, toggleExpand, onNodeClick, selectedNode }) => {
    const isExpanded = expandedItems[`terminal-${terminal.terminal_id}`];
    const isSelected = selectedNode?.type === 'terminal' && selectedNode?.data.terminal_id === terminal.terminal_id;
    const hasBlocks = terminal.blocks && terminal.blocks.length > 0;

    return (
        <div className="mb-2">
            <div
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-150 group ${
                    isSelected ? 'bg-slate-50 border border-slate-200' : 'border border-transparent hover:bg-slate-50'
                }`}
                onClick={() => {
                    onNodeClick({ type: 'terminal', data: terminal });
                    if (hasBlocks) toggleExpand(terminal.terminal_id, 'terminal');
                }}
            >
                <div className={`mr-2 transition-colors ${isExpanded ? 'text-slate-800' : 'text-slate-400'}`}>
                    {hasBlocks ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4 block"></span>}
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ background: '#0B1D3A' }}>
                    <Building2 size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-gray-900 block truncate">{terminal.terminal_name}</span>
                    <span className="text-xs text-gray-500">{terminal.terminal_code} · {terminal.blocks?.length || 0} Blocks</span>
                </div>
                <StatusBadge active={terminal.terminal_is_active} />
            </div>
            
            {isExpanded && hasBlocks && (
                <div className="ml-6 pl-5 border-l border-slate-200 mt-1">
                    {terminal.blocks.map(block => (
                        <BlockNode key={block.block_id} block={block} terminalId={terminal.terminal_id} expandedItems={expandedItems} toggleExpand={toggleExpand} onNodeClick={onNodeClick} selectedNode={selectedNode} />
                    ))}
                </div>
            )}
        </div>
    );
};

const BlockNode = ({ block, terminalId, expandedItems, toggleExpand, onNodeClick, selectedNode }) => {
    const isExpanded = expandedItems[`block-${block.block_id}`];
    const isSelected = selectedNode?.type === 'block' && selectedNode?.data.block_id === block.block_id;
    const hasFloors = block.floors && block.floors.length > 0;

    return (
        <div className="mb-1.5">
            <div
                className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all duration-150 group ${
                    isSelected ? 'bg-blue-50 border border-blue-100' : 'border border-transparent hover:bg-blue-50/50'
                }`}
                onClick={() => {
                    onNodeClick({ type: 'block', data: { ...block, terminal_id: terminalId } });
                    if (hasFloors) toggleExpand(block.block_id, 'block');
                }}
            >
                <div className={`mr-2 transition-colors ${isExpanded ? 'text-slate-700' : 'text-slate-400'}`}>
                    {hasFloors ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5 block"></span>}
                </div>
                <div className="w-7 h-7 rounded-md flex items-center justify-center mr-3 bg-blue-100 text-blue-600">
                    <Blocks size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-800 block truncate">{block.block_name}</span>
                    <span className="text-[11px] text-gray-500">{block.block_code} · {block.floors?.length || 0} Floors</span>
                </div>
                <StatusBadge active={block.is_active} size="xs" />
            </div>
            
            {isExpanded && hasFloors && (
                <div className="ml-5 pl-5 border-l border-slate-200 mt-1">
                    {block.floors.map(floor => (
                        <FloorNode key={floor.floor_id} floor={floor} blockId={block.block_id} terminalId={terminalId} expandedItems={expandedItems} toggleExpand={toggleExpand} onNodeClick={onNodeClick} selectedNode={selectedNode} />
                    ))}
                </div>
            )}
        </div>
    );
};

const FloorNode = ({ floor, blockId, terminalId, expandedItems, toggleExpand, onNodeClick, selectedNode }) => {
    const isExpanded = expandedItems[`floor-${floor.floor_id}`];
    const isSelected = selectedNode?.type === 'floor' && selectedNode?.data.floor_id === floor.floor_id;
    const hasRooms = floor.rooms && floor.rooms.length > 0;

    return (
        <div className="mb-1.5">
            <div
                className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-150 group ${
                    isSelected ? 'bg-indigo-50 border border-indigo-100' : 'border border-transparent hover:bg-indigo-50/50'
                }`}
                onClick={() => {
                    onNodeClick({ type: 'floor', data: { ...floor, block_id: blockId, terminal_id: terminalId } });
                    if (hasRooms) toggleExpand(floor.floor_id, 'floor');
                }}
            >
                <div className={`mr-2 transition-colors ${isExpanded ? 'text-slate-700' : 'text-slate-400'}`}>
                    {hasRooms ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5 block"></span>}
                </div>
                <div className="w-7 h-7 rounded-md flex items-center justify-center mr-3 bg-indigo-100 text-indigo-600">
                    <Layers size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-800 block truncate">Floor {floor.floor_number}: {floor.floor_name}</span>
                    <span className="text-[11px] text-gray-500">{floor.rooms?.length || 0} Rooms</span>
                </div>
                <StatusBadge active={floor.is_active} size="xs" />
            </div>
            
            {isExpanded && hasRooms && (
                <div className="ml-5 pl-5 border-l border-slate-200 mt-1">
                    {floor.rooms.map(room => (
                        <RoomNode key={room.room_id} room={room} floorId={floor.floor_id} blockId={blockId} terminalId={terminalId} onNodeClick={onNodeClick} selectedNode={selectedNode} />
                    ))}
                </div>
            )}
        </div>
    );
};

const RoomNode = ({ room, floorId, blockId, terminalId, onNodeClick, selectedNode }) => {
    const isSelected = selectedNode?.type === 'room' && selectedNode?.data.room_id === room.room_id;

    const getStatusStyle = (status) => {
        switch(status) {
            case 'AVAILABLE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'OCCUPIED': return 'bg-red-50 text-red-700 border-red-200';
            case 'MAINTENANCE': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-150 mb-1 ${
                isSelected ? 'bg-slate-50 border border-slate-200' : 'border border-transparent hover:bg-slate-50'
            }`}
            onClick={() => onNodeClick({ type: 'room', data: { ...room, floor_id: floorId, block_id: blockId, terminal_id: terminalId } })}
        >
            <div className="flex items-center min-w-0 flex-1">
                <div className="w-6 h-6 rounded flex items-center justify-center mr-2.5 bg-slate-100 text-slate-500">
                    <DoorOpen size={12} />
                </div>
                <div className="min-w-0">
                    <span className="text-sm text-gray-800 block truncate">{room.room_name}</span>
                    <span className="text-[11px] text-gray-500">{room.room_code}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusStyle(room.room_status)}`}>
                    {room.room_status}
                </span>
            </div>
        </div>
    );
};

// --- Shared UI Components ---

const StatusBadge = ({ active, size = "sm" }) => (
    <span className={`inline-flex items-center font-medium ${
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px] rounded-md' : 'px-2 py-1 text-xs rounded-lg'
    } ${
        active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
        {active ? 'Active' : 'Inactive'}
    </span>
);

const NodeDetails = ({ node }) => {
    const { type, data } = node;

    const config = {
        terminal: { icon: Building2, label: 'Terminal', bg: 'bg-slate-100', color: 'text-slate-800' },
        block: { icon: Blocks, label: 'Block', bg: 'bg-blue-50', color: 'text-blue-700' },
        floor: { icon: Layers, label: 'Floor', bg: 'bg-indigo-50', color: 'text-indigo-700' },
        room: { icon: DoorOpen, label: 'Room', bg: 'bg-slate-50', color: 'text-slate-700' }
    }[type];

    const Icon = config.icon;

    const getFields = () => {
        switch(type) {
            case 'terminal': return [
                { label: 'Code', value: data.terminal_code },
                { label: 'Description', value: data.terminal_description },
                { label: 'Status', value: data.terminal_is_active ? 'Active' : 'Inactive' },
                { label: 'Total Blocks', value: data.blocks?.length || 0 }
            ];
            case 'block': return [
                { label: 'Code', value: data.block_code },
                { label: 'Type', value: data.block_type },
                { label: 'Description', value: data.description },
                { label: 'Status', value: data.is_active ? 'Active' : 'Inactive' },
                { label: 'Total Floors', value: data.floors?.length || 0 }
            ];
            case 'floor': return [
                { label: 'Floor Number', value: data.floor_number },
                { label: 'Description', value: data.description },
                { label: 'Status', value: data.is_active ? 'Active' : 'Inactive' },
                { label: 'Total Rooms', value: data.rooms?.length || 0 }
            ];
            case 'room': return [
                { label: 'Code', value: data.room_code },
                { label: 'Type', value: data.room_type },
                { label: 'Capacity', value: `${data.current_occupancy} / ${data.max_capacity}` },
                { label: 'Status', value: data.room_status },
                { label: 'Description', value: data.description },
                { label: 'Active', value: data.is_active ? 'Yes' : 'No' }
            ];
            default: return [];
        }
    };

    return (
        <div className="space-y-5">
            <div className={`flex items-center gap-3 p-4 rounded-xl ${config.bg}`}>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.color} bg-white shadow-sm`}>
                    <Icon size={24} />
                </div>
                <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{config.label}</span>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight">{data.terminal_name || data.block_name || data.floor_name || data.room_name}</h4>
                </div>
            </div>

            <div className="space-y-0">
                {getFields().map((field, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-gray-500">{field.label}</span>
                        <span className="text-sm text-gray-900 font-medium text-right max-w-[60%] break-words">{field.value || '—'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Skeleton Loader ---

const HierarchySkeleton = () => (
    <div className="flex min-h-screen" style={{ background: '#F8F9FC' }}>
        <main className="flex-1 p-8 space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-12 w-full max-w-xl bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 space-y-4" style={{ border: '1px solid #EEF0F4' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gray-100 rounded animate-pulse"></div>
                            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                            <div className="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1px solid #EEF0F4' }}>
                    <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                </div>
            </div>
        </main>
    </div>
);

export default TerminalHierarchy;