import { Edge } from "yoga-layout"
import type { Renderable } from "./Renderable"

export interface LayoutNode {
  id: string
  type: string
  layout: {
    x: number
    y: number
    width: number
    height: number
  }
  style: {
    flexDirection: string
    padding: { top: number; right: number; bottom: number; left: number }
    margin: { top: number; right: number; bottom: number; left: number }
    border: { top: number; right: number; bottom: number; left: number }
  }
  children: LayoutNode[]
}

export interface DevtoolsMessage {
  type: "layout-tree"
  timestamp: number
  tree: LayoutNode
}

let devtoolsEnabled = false
let devtoolsCallback: ((message: DevtoolsMessage) => void) | null = null

export function enableDevtools(callback: (message: DevtoolsMessage) => void): void {
  devtoolsEnabled = true
  devtoolsCallback = callback
}

export function disableDevtools(): void {
  devtoolsEnabled = false
  devtoolsCallback = null
}

export function isDevtoolsEnabled(): boolean {
  return devtoolsEnabled
}

export function extractLayoutTree(renderable: Renderable): LayoutNode {
  const yoga = renderable.getYogaNode()

  const node: LayoutNode = {
    id: renderable.id,
    type: renderable.constructor.name,
    layout: {
      x: yoga.getComputedLeft(),
      y: yoga.getComputedTop(),
      width: yoga.getComputedWidth(),
      height: yoga.getComputedHeight(),
    },
    style: {
      flexDirection: getFlexDirectionName(yoga.getFlexDirection()),
      padding: {
        top: yoga.getComputedPadding(Edge.Top),
        right: yoga.getComputedPadding(Edge.Right),
        bottom: yoga.getComputedPadding(Edge.Bottom),
        left: yoga.getComputedPadding(Edge.Left),
      },
      margin: {
        top: yoga.getComputedMargin(Edge.Top),
        right: yoga.getComputedMargin(Edge.Right),
        bottom: yoga.getComputedMargin(Edge.Bottom),
        left: yoga.getComputedMargin(Edge.Left),
      },
      border: {
        top: yoga.getComputedBorder(Edge.Top),
        right: yoga.getComputedBorder(Edge.Right),
        bottom: yoga.getComputedBorder(Edge.Bottom),
        left: yoga.getComputedBorder(Edge.Left),
      },
    },
    children: [],
  }

  for (const child of renderable.getChildren() as Renderable[]) {
    node.children.push(extractLayoutTree(child))
  }

  return node
}

function getFlexDirectionName(value: number): string {
  switch (value) {
    case 0:
      return "column"
    case 1:
      return "column-reverse"
    case 2:
      return "row"
    case 3:
      return "row-reverse"
    default:
      return "unknown"
  }
}

export function emitLayoutTree(root: Renderable): void {
  if (!devtoolsEnabled || !devtoolsCallback) return

  const message: DevtoolsMessage = {
    type: "layout-tree",
    timestamp: Date.now(),
    tree: extractLayoutTree(root),
  }

  devtoolsCallback(message)
}
