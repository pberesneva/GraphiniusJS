/// <reference path="../../typings/tsd.d.ts" />
"use strict";
var $G = require('../core/Graph');
function DFSVisit(graph, current_root, config) {
    var dfsVisitScope = {
        stack: [],
        adj_nodes: [],
        stack_entry: null,
        current: null,
        current_root: current_root
    };
    var config = config || prepareDFSVisitStandardConfig(), callbacks = config.callbacks, dir_mode = config.dir_mode;
    /**
     * We are not traversing an empty graph...
     */
    if (graph.getMode() === $G.GraphMode.INIT) {
        throw new Error('Cowardly refusing to traverse graph without edges.');
    }
    /**
       * We are not traversing a graph taking NO edges into account
       */
    if (dir_mode === $G.GraphMode.INIT) {
        throw new Error('Cannot traverse a graph with dir_mode set to INIT.');
    }
    /**
     * HOOK 1 - INIT (INNER DFS VISIT):
     * Initializing a possible result object,
     * possibly with the current_root;
     */
    if (callbacks.init_dfs_visit) {
        execCallbacks(callbacks.init_dfs_visit, dfsVisitScope);
    }
    // Start by pushing current root to the stack
    dfsVisitScope.stack.push({
        node: current_root,
        parent: current_root,
        weight: 0 // initial weight cost from current_root
    });
    while (dfsVisitScope.stack.length) {
        dfsVisitScope.stack_entry = dfsVisitScope.stack.pop();
        dfsVisitScope.current = dfsVisitScope.stack_entry.node;
        /**
         * HOOK 2 - AQUIRED CURRENT NODE / POPPED NODE
         */
        if (callbacks.node_popped) {
            execCallbacks(callbacks.node_popped, dfsVisitScope);
        }
        if (!config.dfs_visit_marked[dfsVisitScope.current.getID()]) {
            config.dfs_visit_marked[dfsVisitScope.current.getID()] = true;
            /**
             * HOOK 3 - CURRENT NODE UNMARKED
             */
            if (callbacks.node_unmarked) {
                execCallbacks(callbacks.node_unmarked, dfsVisitScope);
            }
            /**
             * Do we move only in the directed subgraph,
             * undirected subgraph or complete (mixed) graph?
             */
            if (dir_mode === $G.GraphMode.MIXED) {
                dfsVisitScope.adj_nodes = dfsVisitScope.current.adjNodes();
            }
            else if (dir_mode === $G.GraphMode.UNDIRECTED) {
                dfsVisitScope.adj_nodes = dfsVisitScope.current.connNodes();
            }
            else if (dir_mode === $G.GraphMode.DIRECTED) {
                dfsVisitScope.adj_nodes = dfsVisitScope.current.nextNodes();
            }
            for (var adj_idx in dfsVisitScope.adj_nodes) {
                /**
                 * HOOK 6 - NODE OR EDGE TYPE CHECK...
                 * LATER !!
                 */
                if (callbacks) {
                }
                dfsVisitScope.stack.push({
                    node: dfsVisitScope.adj_nodes[adj_idx].node,
                    parent: dfsVisitScope.current,
                    weight: dfsVisitScope.adj_nodes[adj_idx].edge.getWeight()
                });
            }
            /**
             * HOOK 4 - ADJACENT NODES PUSHED - LEAVING CURRENT NODE
             */
            if (callbacks.adj_nodes_pushed) {
                execCallbacks(callbacks.adj_nodes_pushed, dfsVisitScope);
            }
        }
        else {
            /**
             * HOOK 5 - CURRENT NODE ALREADY MARKED
             */
            if (callbacks.node_marked) {
                execCallbacks(callbacks.node_marked, dfsVisitScope);
            }
        }
    }
    return config.visit_result;
}
exports.DFSVisit = DFSVisit;
/**
 * OuterDFS function
 */
function DFS(graph, root, config) {
    var config = config || prepareDFSStandardConfig(), callbacks = config.callbacks, dir_mode = config.dir_mode;
    if (graph.getMode() === $G.GraphMode.INIT) {
        throw new Error('Cowardly refusing to traverse graph without edges.');
    }
    if (dir_mode === $G.GraphMode.INIT) {
        throw new Error('Cannot traverse a graph with dir_mode set to INIT.');
    }
    var dfsScope = {
        marked: {},
        nodes: graph.getNodes()
    };
    /**
     * HOOK 1 - INIT (OUTER DFS)
     */
    if (callbacks.init_dfs) {
        execCallbacks(callbacks.init_dfs, dfsScope);
    }
    callbacks.adj_nodes_pushed = callbacks.adj_nodes_pushed || [];
    var markNode = function (context) {
        dfsScope.marked[context.current.getID()] = true;
    };
    callbacks.adj_nodes_pushed.push(markNode);
    // We need to put our results into segments
    // for easy counting of 'components'
    // TODO refactor for count & counter...
    var dfs_result = [{}];
    var dfs_idx = 0;
    var count = 0;
    var counter = function () {
        return count++;
    };
    /**
     * We not only add new nodes to the result object
     * of DFSVisit, but also to it's appropriate
     * segment of the dfs_result object
     */
    var addToProperSegment = function (context) {
        dfs_result[dfs_idx][context.current.getID()] = {
            parent: context.stack_entry.parent,
            counter: counter()
        };
    };
    // check if a callbacks object has been instantiated
    if (callbacks && callbacks.node_unmarked) {
        callbacks.node_unmarked.push(addToProperSegment);
    }
    // Start with root node, no matter what
    DFSVisit(graph, root, config);
    // Now take the rest in 'normal' order
    for (var node_key in dfsScope.nodes) {
        if (!dfsScope.marked[node_key]) {
            // Next segment in dfs_results
            dfs_idx++;
            dfs_result.push({});
            DFSVisit(graph, dfsScope.nodes[node_key], config);
        }
    }
    // console.dir(dfs_result);
    return dfs_result;
}
exports.DFS = DFS;
/**
 * This is the only place in which a config object
 * is instantiated (except manually, of course)
 *
 * Therefore, we do not take any arguments
 */
function prepareDFSVisitStandardConfig() {
    var config = {
        visit_result: {},
        callbacks: {},
        messages: {},
        dfs_visit_marked: {},
        dir_mode: $G.GraphMode.MIXED
    }, result = config.visit_result, callbacks = config.callbacks;
    // internal variable for order of visit
    // during DFS Visit                      
    var count = 0;
    var counter = function () {
        return count++;
    };
    callbacks.init_dfs_visit = callbacks.init_dfs_visit || [];
    var initDFSVisit = function (context) {
        result[context.current_root.getID()] = {
            parent: context.current_root
        };
    };
    callbacks.init_dfs_visit.push(initDFSVisit);
    callbacks.node_unmarked = callbacks.node_unmarked || [];
    var setResultEntry = function (context) {
        result[context.current.getID()] = {
            parent: context.stack_entry.parent,
            counter: counter()
        };
    };
    callbacks.node_unmarked.push(setResultEntry);
    return config;
}
exports.prepareDFSVisitStandardConfig = prepareDFSVisitStandardConfig;
/**
 * First instantiates config file for DFSVisit, then
 * enhances it with outer DFS init callback
 */
function prepareDFSStandardConfig() {
    // First prepare DFS Visit callbacks
    var config = prepareDFSVisitStandardConfig(), callbacks = config.callbacks, result = config.visit_result;
    // Now add outer DFS INIT callback
    callbacks.init_dfs = callbacks.init_dfs || [];
    var setInitialResultEntries = function (context) {
        // for ( var node_id in context.nodes ) {
        // 	result[node_id] = {
        // 		parent: null,
        // 		counter: -1
        // 	}
        // }
    };
    callbacks.init_dfs.push(setInitialResultEntries);
    return config;
}
exports.prepareDFSStandardConfig = prepareDFSStandardConfig;
;
/**
 * @param context this pointer to the DFS or DFSVisit function
 */
function execCallbacks(cbs, context) {
    cbs.forEach(function (cb) {
        if (typeof cb === 'function') {
            cb(context);
        }
    });
}
exports.execCallbacks = execCallbacks;