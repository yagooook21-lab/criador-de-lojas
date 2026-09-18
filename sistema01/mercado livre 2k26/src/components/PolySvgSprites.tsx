import { useEffect, useRef } from "react";

const PolySvgSprites = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/svg-sprites-collection.html')
      .then(res => res.ok ? res.text() : '')
      .then(html => {
        if (containerRef.current && html) {
          const svgMatch = html.match(/<svg[\s\S]*<\/svg>/i);
          if (svgMatch) {
            containerRef.current.innerHTML = svgMatch[0];
          }
        }
      })
      .catch(() => {});
  }, []);

  return <div ref={containerRef} />;
};

export default PolySvgSprites;
