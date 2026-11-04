import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./ErrorBoundary";

// Safe monkey-patch para Node.prototype.removeChild e insertBefore
// Evita que o React 18 quebre com NotFoundError caso o Google Tradutor ou extensões do navegador
// envolvam ou modifiquem nós de texto no DOM (ex: em botões e divs)
if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child);
      }
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
