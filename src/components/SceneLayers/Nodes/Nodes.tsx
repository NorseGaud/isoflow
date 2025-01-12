import React from 'react';
import { useSceneStore } from 'src/stores/sceneStore';
import { Node } from './Node/Node';

export const Nodes = () => {
  const nodes = useSceneStore((state) => {
    return state.nodes;
  });

  return (
    <>
      {nodes.map((node) => {
        return (
          <Node key={node.id} order={-node.tile.x - node.tile.y} node={node} />
        );
      })}
    </>
  );
};
