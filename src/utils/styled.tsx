import React, {
  ElementType,
  ComponentType,
  ComponentPropsWithRef,
} from "react";

const TAGS = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "circle",
  "cite",
  "clipPath",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "defs",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "ellipse",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "foreignObject",
  "form",
  "g",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "image",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "line",
  "linearGradient",
  "link",
  "main",
  "map",
  "mark",
  "marker",
  "mask",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "path",
  "pattern",
  "picture",
  "polygon",
  "polyline",
  "pre",
  "progress",
  "q",
  "radialGradient",
  "rect",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "stop",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "svg",
  "table",
  "tbody",
  "td",
  "text",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "tspan",
  "u",
  "ul",
  "use",
  "var",
  "video",
  "wbr",
] as const;

export function join(className: string, ...extra: (string | undefined)[]) {
  if (extra.length === 0) {
    return className;
  }
  const names = [className];
  for (const name of extra) {
    // only append if s is defined and non-empty
    if (name) {
      names.push(name);
    }
  }
  return names.join(" ");
}

type IntrinsicTag = (typeof TAGS)[number];
type IntrinsicElementType = IntrinsicTag & ElementType;

type StylableProps = { className?: string };
type StylableComponentType<P extends StylableProps> = ComponentType<P>;
type StylableElementType<P extends StylableProps = StylableProps> =
  | IntrinsicElementType
  | StylableComponentType<P>;

type StyledComponentProps<
  P extends StylableProps,
  T = StylableElementType<P>,
> = T extends IntrinsicElementType ? ComponentPropsWithRef<T> : P;

type StyledComponent<P extends StylableProps, T = StylableElementType<P>> = (
  props: StyledComponentProps<P, T>,
) => React.JSX.Element;

// Version that works for intrinsic element types.
//
// Example: const Button = styledIntrinsic("button", "Button");
//
export function styledIntrinsic<T extends IntrinsicElementType>(
  Component: T,
  className: string,
): StyledComponent<StylableProps, T> {
  const StyledComponent = (props: StyledComponentProps<StylableProps, T>) => {
    const Comp = Component as IntrinsicElementType; // TS is confused otherwise
    return <Comp {...props} className={join(className, props.className)} />;
  };
  StyledComponent.displayName = `styled.${Component}: ${className}`;
  return StyledComponent;
}

function getComponentName<P>(Component: ComponentType<P>) {
  if (Component.displayName) {
    return Component.displayName;
  }
  if (Component.name) {
    return Component.name;
  }
  return "Anonymous";
}

// Version that works for non-intrinsic element types.
//
// Example: const ImportantButton = styled(Button, "important");
//
function styledImpl<P extends StylableProps>(
  Component: ComponentType<P>,
  className: string,
): StyledComponent<P, ComponentType<P>> {
  const StyledComponent = (
    props: StyledComponentProps<P, ComponentType<P>>,
  ) => {
    return (
      <Component {...props} className={join(className, props.className)} />
    );
  };
  const componentName = getComponentName(Component);
  if (componentName.startsWith("styled.")) {
    StyledComponent.displayName = `${componentName} ${className}`;
  } else {
    StyledComponent.displayName = `styled.${componentName}: ${className}`;
  }
  return StyledComponent;
}

// Helper function for convenient intrinsic aliases.
//
function styledIntrinsicAlias<T extends IntrinsicElementType>(Component: T) {
  return (className: string) => styledIntrinsic(Component, className);
}

type StyledMethods<T extends readonly IntrinsicElementType[]> = {
  [K in T[number]]: (
    className: string,
  ) => StyledComponent<React.JSX.IntrinsicElements[K] & StylableProps, K>;
};
const intrinsicMethods = Object.fromEntries(
  TAGS.map((tag) => [tag, styledIntrinsicAlias(tag)]),
) as StyledMethods<typeof TAGS>;

export const styled = Object.assign(styledImpl, intrinsicMethods);
