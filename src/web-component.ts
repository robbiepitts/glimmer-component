import {
  RenderResult,
  UNDEFINED_REFERENCE
} from '@glimmer/runtime';
import {
  CONSTANT_TAG,
  CURRENT_TAG,
  DirtyableTag,
  PathReference,
  RevisionTag
} from '@glimmer/reference';

export default function WebComponent(componentName: string, attrMap: Object, app: any): Function {
  class WebComponent extends GlimmerWebComponent {
    static observedAttributes = Object.keys(attrMap);
    componentName = componentName;
    attrMap = attrMap;
    app = app;
  }

  return function initialize(): void {
    register(componentName, WebComponent);
  };
};

function register(componentName, klass): void {
  self.customElements.define(componentName, klass);
}

class GlimmerWebComponent extends HTMLElement {
  static observedAttributes: string[];
  protected componentName: string;
  protected attrMap: Object;
  protected app: any;
  protected root: RenderResult;

  connectedCallback() {
    let rootTemplateSpecifier = `${this.componentName}-wrapper`;
    let rootRef = new AttributesReference(this, this.observedAttributes);
    let rootElement = this;

    this.root = this.app.render({ rootTemplateSpecifier, rootRef, rootElement });
  }

  disconnectedCallback() {
    this.root.destroy();
  }

  attributeChangedCallback() {
    this.app.rerender();
  }
}

class AttributeReference implements PathReference<string> {
  public tag: RevisionTag = CONSTANT_TAG;

  constructor(private path: string, private val: string) {}

  value(): string {
    return this.val;
  }

  get(path: string): PathReference<string> {
    if (this.path === path) return this;

    return UNDEFINED_REFERENCE;
  }
}

class AttributesReference implements PathReference<Object> {
  public tag: DirtyableTag = CURRENT_TAG;

  constructor(private customElement: HTMLElement, private attributeNames: string[]) {}

  value(): Object {
    return this.attributeNames.reduce((memo, curr) => {
      memo[curr] = new AttributeReference(curr, this.customElement.getAttribute(curr));
      return memo;
    }, {});
  }

  get(path: string): AttributeReference {
    return new AttributeReference(path, this.customElement.getAttribute(path));
  }
}
