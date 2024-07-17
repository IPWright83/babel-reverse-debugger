import { NodePath } from "@babel/core";

/**
 * Attempt to extract the name of the current node
 * @param  {} path       The path to the current node
 * @return {string|undefined}      The name of the node
 */
export default function getName(path: NodePath): string | undefined {
  const { node, parent } = path;

  return node.id?.name ??
    node.key?.name ??
    parent?.id?.name ??
    parent?.key?.name;
}

