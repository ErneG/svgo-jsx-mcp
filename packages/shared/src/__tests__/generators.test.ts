import { describe, it, expect } from "vitest";
import { generateReactComponent, filenameToComponentName } from "../generators/react.js";
import { generateVueComponent } from "../generators/vue.js";
import { generateSvelteComponent } from "../generators/svelte.js";
import { generateWebComponent, toKebabCase } from "../generators/web-component.js";

describe("React Generator", () => {
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>`;

  describe("generateReactComponent", () => {
    it("should generate a valid React component", () => {
      const result = generateReactComponent(sampleSvg, {
        componentName: "LayersIcon",
      });

      expect(result.code).toContain("function LayersIcon");
      expect(result.code).toContain("export default LayersIcon");
      expect(result.code).toContain("{...props}");
      expect(result.extension).toBe(".tsx");
      expect(result.language).toBe("typescript");
    });

    it("should include TypeScript types by default", () => {
      const result = generateReactComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("interface TestIconProps");
      expect(result.code).toContain("React.SVGProps<SVGSVGElement>");
      expect(result.code).toContain("import type { SVGProps }");
    });

    it("should generate JavaScript when typescript is false", () => {
      const result = generateReactComponent(sampleSvg, {
        componentName: "TestIcon",
        typescript: false,
      });

      expect(result.code).not.toContain("interface");
      expect(result.code).not.toContain("import type");
      expect(result.extension).toBe(".jsx");
      expect(result.language).toBe("javascript");
    });

    it("should use named export when exportDefault is false", () => {
      const result = generateReactComponent(sampleSvg, {
        componentName: "TestIcon",
        exportDefault: false,
      });

      expect(result.code).toContain("export { TestIcon }");
      expect(result.code).not.toContain("export default");
    });

    it("should extract and use width/height as default props", () => {
      const result = generateReactComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain('width = "24"');
      expect(result.code).toContain('height = "24"');
    });

    it("should handle SVG without width/height", () => {
      const svgNoSize =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>';
      const result = generateReactComponent(svgNoSize, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("width,");
      expect(result.code).toContain("height,");
      expect(result.code).not.toContain('width = "');
    });

    it("should preserve viewBox and other attributes", () => {
      const result = generateReactComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain('viewBox="0 0 24 24"');
    });
  });

  describe("filenameToComponentName", () => {
    it("should convert kebab-case filename to PascalCase", () => {
      expect(filenameToComponentName("my-icon.svg")).toBe("MyIcon");
    });

    it("should convert snake_case filename to PascalCase", () => {
      expect(filenameToComponentName("my_icon.svg")).toBe("MyIcon");
    });

    it("should handle filenames with multiple extensions", () => {
      expect(filenameToComponentName("icon.min.svg")).toBe("IconMin");
    });

    it("should handle single word filenames", () => {
      expect(filenameToComponentName("icon.svg")).toBe("Icon");
    });

    it("should handle filenames with numbers", () => {
      expect(filenameToComponentName("icon-24px.svg")).toBe("Icon24px");
    });

    it("should handle already PascalCase filenames", () => {
      expect(filenameToComponentName("MyIcon.svg")).toBe("Myicon");
    });
  });
});

describe("Vue Generator", () => {
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>`;

  describe("generateVueComponent", () => {
    it("should generate a valid Vue 3 SFC", () => {
      const result = generateVueComponent(sampleSvg, {
        componentName: "LayersIcon",
      });

      expect(result.code).toContain("<script setup");
      expect(result.code).toContain("<template>");
      expect(result.code).toContain("LayersIcon");
      expect(result.extension).toBe(".vue");
      expect(result.language).toBe("vue");
    });

    it("should include TypeScript lang by default", () => {
      const result = generateVueComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain('lang="ts"');
      expect(result.code).toContain("defineProps<{");
    });

    it("should generate JavaScript when typescript is false", () => {
      const result = generateVueComponent(sampleSvg, {
        componentName: "TestIcon",
        typescript: false,
      });

      expect(result.code).not.toContain('lang="ts"');
      expect(result.code).toContain("defineProps({");
    });

    it("should use withDefaults for default props", () => {
      const result = generateVueComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("withDefaults");
      expect(result.code).toContain("'24'");
    });

    it("should add v-bind=$attrs for attribute passthrough", () => {
      const result = generateVueComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain('v-bind="$attrs"');
    });

    it("should add dynamic width/height bindings", () => {
      const result = generateVueComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain(':width="width"');
      expect(result.code).toContain(':height="height"');
    });
  });
});

describe("Svelte Generator", () => {
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>`;

  describe("generateSvelteComponent", () => {
    it("should generate a valid Svelte component", () => {
      const result = generateSvelteComponent(sampleSvg, {
        componentName: "LayersIcon",
      });

      expect(result.code).toContain("<script");
      expect(result.code).toContain("export let width");
      expect(result.code).toContain("export let height");
      expect(result.code).toContain("LayersIcon");
      expect(result.extension).toBe(".svelte");
      expect(result.language).toBe("svelte");
    });

    it("should include TypeScript lang by default", () => {
      const result = generateSvelteComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain('lang="ts"');
      expect(result.code).toContain("string | number");
    });

    it("should generate JavaScript when typescript is false", () => {
      const result = generateSvelteComponent(sampleSvg, {
        componentName: "TestIcon",
        typescript: false,
      });

      expect(result.code).not.toContain('lang="ts"');
      expect(result.code).not.toContain("string | number");
    });

    it("should include default width/height values", () => {
      const result = generateSvelteComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("= '24'");
    });

    it("should add $$restProps for attribute passthrough", () => {
      const result = generateSvelteComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("{...$$restProps}");
    });

    it("should add shorthand width/height bindings", () => {
      const result = generateSvelteComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("{width}");
      expect(result.code).toContain("{height}");
    });
  });
});

describe("Web Component Generator", () => {
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>`;

  describe("generateWebComponent", () => {
    it("should generate a valid Web Component class", () => {
      const result = generateWebComponent(sampleSvg, {
        componentName: "LayersIcon",
      });

      expect(result.code).toContain("class LayersIcon extends HTMLElement");
      expect(result.code).toContain("customElements.define");
      expect(result.code).toContain("attachShadow");
      expect(result.extension).toBe(".ts");
      expect(result.language).toBe("typescript");
    });

    it("should use shadow DOM", () => {
      const result = generateWebComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("attachShadow({ mode: 'open' })");
      expect(result.code).toContain("this.shadowRoot");
    });

    it("should register as custom element with kebab-case name", () => {
      const result = generateWebComponent(sampleSvg, {
        componentName: "MyAwesomeIcon",
      });

      expect(result.code).toContain("customElements.define('my-awesome-icon'");
    });

    it("should add svg- prefix if name has no hyphen", () => {
      const result = generateWebComponent(sampleSvg, {
        componentName: "Icon",
      });

      expect(result.code).toContain("customElements.define('svg-icon'");
    });

    it("should include observedAttributes for width/height", () => {
      const result = generateWebComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("observedAttributes");
      expect(result.code).toContain("'width', 'height'");
    });

    it("should generate JavaScript when typescript is false", () => {
      const result = generateWebComponent(sampleSvg, {
        componentName: "TestIcon",
        typescript: false,
      });

      expect(result.code).not.toContain(": string");
      expect(result.code).not.toContain(": void");
      expect(result.extension).toBe(".js");
      expect(result.language).toBe("javascript");
    });

    it("should include CSS in shadow DOM", () => {
      const result = generateWebComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("<style>");
      expect(result.code).toContain(":host");
      expect(result.code).toContain("display: inline-block");
    });

    it("should export both named and default exports", () => {
      const result = generateWebComponent(sampleSvg, {
        componentName: "TestIcon",
      });

      expect(result.code).toContain("export { TestIcon }");
      expect(result.code).toContain("export default TestIcon");
    });
  });

  describe("toKebabCase", () => {
    it("should convert PascalCase to kebab-case", () => {
      expect(toKebabCase("MyIcon")).toBe("my-icon");
    });

    it("should handle multiple capital letters", () => {
      expect(toKebabCase("XMLHttpRequest")).toBe("xml-http-request");
    });

    it("should handle single word", () => {
      expect(toKebabCase("Icon")).toBe("icon");
    });

    it("should handle already kebab-case", () => {
      expect(toKebabCase("my-icon")).toBe("my-icon");
    });
  });
});
