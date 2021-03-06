/// <reference path="../../typings/tsd.d.ts" />

import * as chai from 'chai';
import * as $N from '../../src/core/Nodes';
import * as $E from '../../src/core/Edges';
import * as $G from '../../src/core/Graph';
import * as $I from '../../src/io/input/JSONInput';
import * as $EME from '../../src/energyminimization/expansionBoykov';

import * as $JO from '../../src/io/output/JSONOutput';


var expect = chai.expect,
    json   : $I.IJSONInput = new $I.JSONInput(true, false, true),
    eme_graph = "./test/test_data/energy_minimization_expansion_graph.json",
    graph : $G.IGraph,
    labels : Array<string> = ["1", "2"],
    eme : $EME.IEMEBoykov;


describe('EME Boykov Tests - ', () => {

  beforeEach(() => {
    graph = json.readFromJSONFile(eme_graph);
    eme = new $EME.EMEBoykov(graph, labels);
  });


  describe("Base Tests - ", () => {

    it('should instantiate a standard config', () => {
      expect( eme.prepareEMEStandardConfig() ).to.have.all.keys( 'directed', 'labeled', 'interactionTerm', 'dataTerm');
      expect( eme.prepareEMEStandardConfig().directed ).to.be.false;
      expect( eme.prepareEMEStandardConfig().labeled ).to.be.false;
      expect( eme.prepareEMEStandardConfig().interactionTerm ).to.exist;
      expect( eme.prepareEMEStandardConfig().dataTerm ).to.exist;
      // expect( eme.prepareEMEStandardConfig() ).to.deep.equal( {directed: true, labeled: false } );
    });

  });

  describe("Helper Functions Tests - ", () => {

    it('should correctly initialize the graph with the correct labels', () => {
      var lGraph: $G.IGraph = eme.initGraph(graph);

      // check that all labels got copied correctly
      var nodes = lGraph.getNodes();
      for (let i = 0; i < Object.keys(nodes).length; i++) {
          var node: $N.IBaseNode = nodes[Object.keys(nodes)[i]];
          expect(node.getLabel()).to.equal(node.getFeature('label'));
      }
    });

    it('should deep copy the graph with all nodes and edges', () => {
      var cGraph: $G.IGraph = eme.deepCopyGraph(graph);

      // check that it has all and only those nodes of the original graph
      expect(cGraph.getNodes()).to.have.all.keys(graph.getNodes());
      // check that it has all and only those edges of the original graph
      expect(cGraph.getUndEdges()).to.have.all.keys(graph.getUndEdges());

      // check that all labels got copied correctly
      var original_nodes = graph.getNodes();
      for (let i = 0; i < Object.keys(original_nodes).length; i++) {
          var original_node: $N.IBaseNode = original_nodes[Object.keys(original_nodes)[i]];
          expect(cGraph.getNodeById(original_node.getID()).getLabel()).to.equal(original_node.getLabel());
      }

      // check that all weights got copied correctly
      var original_edges = graph.getUndEdges();
      for (let i = 0; i < Object.keys(original_edges).length; i++) {
          var original_edge: $E.IBaseEdge = original_edges[Object.keys(original_edges)[i]];
          expect(cGraph.getEdgeById(original_edge.getID()).getWeight()).to.equal(original_edge.getWeight());
      }
    });


    it('should correctly construct the expansion graph', () => {
      /* TODO think about better way to test this function.. */
      /* TODO write new test case => we build the expansion grpah as a directed graph now */

      var eGraph: $G.IGraph = eme.constructGraph();

      // constructGraph is dependent on the energy functions and the active label
      // as this is the first action we perform:
      // the active label is set to the first label ("1")
      // and we are using the standard energy functions defined at the top

      var nodes: {[keys: string] : $N.IBaseNode} = eGraph.getNodes();
      var edges: {[keys: string] : $E.IBaseEdge} = eGraph.getDirEdges();

      // get all node ids
      var pixel_nodes = Object.keys(graph.getNodes());
      expect(pixel_nodes).to.include.members(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
      // get all auxiliary nodes ids
      var aux_nodes_ind = Object.keys(nodes).filter(element => pixel_nodes.concat(['SOURCE', 'SINK']).indexOf(element) < 0);
      // all non zero nodes ( labeled with 2 in the graph)
      var non_zero_nodes = ['A', 'C', 'D', 'G'];
      var zero_nodes = ['B', 'E', 'F', 'H', 'I'];

      // check for total number of nodes and edges
      expect(Object.keys(nodes).length).to.equal(16);
      expect(Object.keys(edges).length).to.equal(80);

      // // check for number of neighbors for each node + SOURCE + SINK
      // expect(Object.keys(nodes['A'].connNodes()).length).to.equal(4);
      // expect(Object.keys(nodes['B'].connNodes()).length).to.equal(5);
      // expect(Object.keys(nodes['C'].connNodes()).length).to.equal(4);
      // expect(Object.keys(nodes['D'].connNodes()).length).to.equal(5);
      // expect(Object.keys(nodes['E'].connNodes()).length).to.equal(6);
      // expect(Object.keys(nodes['F'].connNodes()).length).to.equal(5);
      // expect(Object.keys(nodes['G'].connNodes()).length).to.equal(4);
      // expect(Object.keys(nodes['H'].connNodes()).length).to.equal(5);
      // expect(Object.keys(nodes['I'].connNodes()).length).to.equal(4);
      // expect(Object.keys(nodes['SOURCE'].connNodes()).length).to.equal(9);
      // expect(Object.keys(nodes['SINK'].connNodes()).length).to.equal(14);

      // check edges to sink
      // weights should all be zero
      non_zero_nodes.forEach((element) => {
        var edge: $E.IBaseEdge = eGraph.getEdgeByNodeIDs(element, 'SINK');
        expect(edge.getWeight()).to.equal(0);
      });
      // weights should all be infinity
      zero_nodes.forEach((element) => {
        var edge: $E.IBaseEdge = eGraph.getEdgeByNodeIDs(element, 'SINK');
        expect(edge.getWeight()).to.equal(Infinity);
      });
      // weights should all be 1
      aux_nodes_ind.forEach((element) => {
        var edge: $E.IBaseEdge = eGraph.getEdgeByNodeIDs(element, 'SINK');
        expect(edge.getWeight()).to.equal(1);
      });

      // check edges to source
      // weights should all be zero
      non_zero_nodes.forEach((element) => {
        var edge: $E.IBaseEdge = eGraph.getEdgeByNodeIDs(element, 'SOURCE');
        expect(edge.getWeight()).to.equal(1.5);
      });
      // weights should all be infinity
      zero_nodes.forEach((element) => {
        var edge: $E.IBaseEdge = eGraph.getEdgeByNodeIDs(element, 'SOURCE');
        expect(edge.getWeight()).to.equal(0);
      });

      // check inter node edges
      expect(eGraph.getEdgeByNodeIDs('E', 'F').getWeight()).to.equal(0);
      expect(eGraph.getEdgeByNodeIDs('A', 'D').getWeight()).to.equal(1);
      expect(eGraph.getEdgeByNodeIDs('B', 'E').getWeight()).to.equal(0);
      expect(eGraph.getEdgeByNodeIDs('D', 'G').getWeight()).to.equal(1);
      expect(eGraph.getEdgeByNodeIDs('E', 'H').getWeight()).to.equal(0);
      expect(eGraph.getEdgeByNodeIDs('F', 'I').getWeight()).to.equal(0);
      expect(eGraph.getEdgeByNodeIDs('H', 'I').getWeight()).to.equal(0);
      // check node -> aux_node edges


      /* TODO check for edges between nodes and auxiliary nodes
      */

    });

    /* TODO write testcase for labelGraph function
    */
  });

  describe("Simple Potts Test - ", () => {

    it('should solve the potts model', () => {
      var pGraph = eme.calculateCycle().graph;
      var nodes = pGraph.getNodes();

      expect(nodes['A'].getLabel()).to.equal('2');
      expect(nodes['B'].getLabel()).to.equal('1');
      expect(nodes['C'].getLabel()).to.equal('1');
      expect(nodes['D'].getLabel()).to.equal('2');
      expect(nodes['E'].getLabel()).to.equal('1');
      expect(nodes['F'].getLabel()).to.equal('1');
      expect(nodes['G'].getLabel()).to.equal('2');
      expect(nodes['H'].getLabel()).to.equal('1');
      expect(nodes['I'].getLabel()).to.equal('1');

      /* TODO think about better test */

      // var jsonOut = new $JO.JSONOutput();
      // jsonOut.writeToJSONFile( "", pGraph );
      // console.log(eme.calculateCycle().graph.getStats());
      // expect( eme.calculateCycle().result)
    });
  });


});
